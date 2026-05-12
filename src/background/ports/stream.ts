import { streamText, stepCountIs } from "ai"
import type { ModelMessage } from "ai"
import { createOllama } from "ollama-ai-provider-v2"
import type { PlasmoMessaging } from "@plasmohq/messaging"
import { sendToContentScript } from "@plasmohq/messaging"
import { allTools } from "~/tools"
import { buildSystemPrompt } from "~/background/ai/prompts"
import { OLLAMA_CLOUD_URL } from "~/store/settings"
import { resolveOllamaCloudToken } from "~/lib/ollama-token"
import type { PageContext, ToolCall, MemoryEntry } from "~/types"

const SENSITIVE_PATTERNS = [
  /purchase/i, /buy/i, /pay/i, /checkout/i, /order/i,
  /delete/i, /remove/i, /send/i, /transfer/i,
  /withdraw/i, /deposit/i,
]

function isSensitive(toolName: string): boolean {
  return SENSITIVE_PATTERNS.some((p) => p.test(toolName))
}

const RISKY_TAB_TOOLS = new Set(["close_tab", "navigate_current_tab", "switch_tab", "open_tab"])

const pendingConfirmations = new Map<string, {
  resolve: (approved: boolean) => void
}>()
const CONFIRMATION_TIMEOUT_MS = 30_000
const TOOL_EXECUTE_TIMEOUT_MS = 45_000
/** Max model↔tool rounds per user message (AI SDK v6 `stopWhen`). 10 was too low for real browser workflows. */
const AGENT_MAX_STEPS = 40

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms (no reply from page or network)`))
    }, ms)
    promise.then(
      (v) => {
        clearTimeout(t)
        resolve(v)
      },
      (e) => {
        clearTimeout(t)
        reject(e)
      }
    )
  })
}

function normalizeToolName(raw: string): string {
  const t = raw.trim()
  if (t.startsWith("{") && t.includes('"name"')) {
    try {
      const o = JSON.parse(t) as { name?: unknown }
      if (typeof o.name === "string") return o.name
    } catch {
      /* keep raw */
    }
  }
  return raw
}

function mergeToolInputFromBuffer(
  toolCallId: string,
  input: unknown,
  buffers: Map<string, string>
): unknown {
  const emptyObject =
    input !== null &&
    typeof input === "object" &&
    !Array.isArray(input) &&
    Object.keys(input as object).length === 0
  if (input !== undefined && input !== null && !emptyObject) {
    buffers.delete(toolCallId)
    return input
  }

  let buf = buffers.get(toolCallId)
  if (buf === undefined && buffers.size === 1) {
    const first = buffers.entries().next().value as [string, string] | undefined
    if (first) {
      buf = first[1]
      buffers.delete(first[0])
    }
  } else if (buf !== undefined) {
    buffers.delete(toolCallId)
  }
  if (!buf?.trim()) return input ?? {}
  try {
    return JSON.parse(buf) as unknown
  } catch {
    return { _parseError: true, raw: buf.slice(0, 500) }
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.name === "resolveConfirmation") {
    const { confirmationId, approved } = message.body as { confirmationId: string; approved: boolean }
    const pending = pendingConfirmations.get(confirmationId)
    if (pending) {
      pending.resolve(approved)
      pendingConfirmations.delete(confirmationId)
    }
    sendResponse({ received: true })
  }
  return true
})

async function getSettings() {
  const stored = await chrome.storage.local.get([
    "model",
    "ollamaCloudToken",
    "skillResearch",
    "skillAutomation",
    "skillMemory",
    "skillRag",
    "skillWriting"
  ])
  return {
    model: (stored.model as string) ?? "glm-5.1",
    ollamaCloudToken: resolveOllamaCloudToken(
      typeof stored.ollamaCloudToken === "string" ? stored.ollamaCloudToken : undefined
    ),
    skillResearch: (stored.skillResearch as boolean | undefined) ?? true,
    skillAutomation: (stored.skillAutomation as boolean | undefined) ?? true,
    skillMemory: (stored.skillMemory as boolean | undefined) ?? true,
    skillRag: (stored.skillRag as boolean | undefined) ?? true,
    skillWriting: (stored.skillWriting as boolean | undefined) ?? true
  }
}

async function getPageContext(): Promise<PageContext | null> {
  try {
    const response = await sendToContentScript<undefined, { success: boolean; context: PageContext }>({
      name: "getPageContext"
    })
    return response?.context ?? null
  } catch {
    return null
  }
}

async function getMemory(): Promise<MemoryEntry[]> {
  try {
    const stored = await chrome.storage.local.get("vision:memory")
    return (stored["vision:memory"] as MemoryEntry[]) ?? []
  } catch {
    return []
  }
}

function hostnameFromUrl(value: string): string {
  try {
    return new URL(value).hostname
  } catch {
    return ""
  }
}

async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab ?? null
}

async function getTabRiskReason(toolName: string, args: unknown): Promise<string | null> {
  if (!RISKY_TAB_TOOLS.has(toolName)) return null

  if (toolName === "close_tab") {
    return "Closing a tab can interrupt in-progress work on that page."
  }

  if (toolName === "switch_tab") {
    const targetId = Number((args as Record<string, unknown>)?.tabId)
    if (Number.isFinite(targetId)) {
      const [active, target] = await Promise.all([getActiveTab(), chrome.tabs.get(targetId)])
      const activeHost = active?.url ? hostnameFromUrl(active.url) : ""
      const targetHost = target?.url ? hostnameFromUrl(target.url) : ""
      if (activeHost && targetHost && activeHost !== targetHost) {
        return `Switching tabs crosses domains (${activeHost} -> ${targetHost}).`
      }
    }
    return null
  }

  if (toolName === "open_tab" || toolName === "navigate_current_tab") {
    const targetUrl = String((args as Record<string, unknown>)?.url ?? "")
    const targetHost = hostnameFromUrl(targetUrl)
    const active = await getActiveTab()
    const activeHost = active?.url ? hostnameFromUrl(active.url) : ""

    if (activeHost && targetHost && activeHost !== targetHost) {
      return `Navigation crosses domains (${activeHost} -> ${targetHost}).`
    }

    if (toolName === "navigate_current_tab") {
      const pageContext = await getPageContext()
      if (pageContext?.forms?.length) {
        return "Current page has form fields; navigating may lose unsaved input."
      }
    }
  }

  return null
}

async function waitForConfirmation(confirmationId: string): Promise<boolean> {
  return await new Promise<boolean>((resolve) => {
    const timeout = setTimeout(() => {
      pendingConfirmations.delete(confirmationId)
      resolve(false)
    }, CONFIRMATION_TIMEOUT_MS)

    pendingConfirmations.set(confirmationId, {
      resolve: (approved: boolean) => {
        clearTimeout(timeout)
        resolve(approved)
      }
    })
  })
}

/**
 * Browser agent: expose tools whenever the user sent a non-empty message.
 * Which tools exist is still filtered by skills in getEnabledTools; the model may choose none.
 */
function shouldEnableTools(messages: ModelMessage[]): boolean {
  const lastUser = [...messages].reverse().find((m) => m.role === "user")
  const text = typeof lastUser?.content === "string"
    ? lastUser.content
    : Array.isArray(lastUser?.content)
      ? lastUser.content.map((p) => ("text" in p ? p.text : "")).join(" ")
      : ""
  return text.trim().length > 0
}

function getEnabledTools(
  settings: Awaited<ReturnType<typeof getSettings>>,
  all: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(all).filter(([name]) => {
      if (name.startsWith("memory_")) return settings.skillMemory
      if (name.startsWith("rag_")) return settings.skillRag
      if (name === "extract_page" || name === "summarize_page" || name === "extract_links") return settings.skillResearch
      if (
        name === "open_tab" ||
        name === "close_tab" ||
        name === "switch_tab" ||
        name === "reload_tab" ||
        name === "get_active_tab" ||
        name === "list_tabs" ||
        name === "navigate_current_tab" ||
        name === "go_back" ||
        name === "go_forward" ||
        name === "wait_for_tab_complete"
      ) {
        return settings.skillAutomation || settings.skillResearch
      }
      if (
        name === "click_element" ||
        name === "type_text" ||
        name === "select_option" ||
        name === "scroll_page" ||
        name === "press_key" ||
        name === "hover_element" ||
        name === "wait_for_element"
      ) {
        return settings.skillAutomation || settings.skillWriting
      }
      if (name === "get_element_value") {
        return settings.skillAutomation || settings.skillWriting || settings.skillResearch
      }
      return true
    })
  )
}

const handler: PlasmoMessaging.PortHandler = async (req, res) => {
  const { messages, streamId } = req.body as { messages: ModelMessage[]; streamId: string }

  const [settings, context, memory] = await Promise.all([getSettings(), getPageContext(), getMemory()])

  if (!settings.ollamaCloudToken?.trim()) {
    res.send({
      type: "error",
      streamId,
      message:
        "Missing Ollama Cloud API key. Add it in Settings, or set PLASMO_PUBLIC_OLLAMA_CLOUD_TOKEN in .env and rebuild (https://ollama.com)."
    })
    return
  }

  const ollama = createOllama({
    baseURL: OLLAMA_CLOUD_URL,
    headers: settings.ollamaCloudToken
      ? { "Authorization": `Bearer ${settings.ollamaCloudToken}` }
      : undefined
  })

  const toolCallMap = new Map<string, { call: ToolCall; startTime: number }>()
  const toolInputBuffers = new Map<string, string>()
  const enableTools = shouldEnableTools(messages)
  const filteredTools = getEnabledTools(settings, allTools as Record<string, unknown>)
  const toolsWithConfirmation = Object.fromEntries(
    Object.entries(filteredTools).map(([toolName, toolDef]) => {
      const toolAny = toolDef as { execute?: (args: unknown) => Promise<unknown> }
      if (!toolAny.execute) return [toolName, toolDef]

      return [toolName, {
        ...(toolDef as Record<string, unknown>),
        execute: async (args: unknown) => {
          const riskReason = await getTabRiskReason(toolName, args)
          if (isSensitive(toolName) || Boolean(riskReason)) {
            const confirmationId = `conf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
            res.send({
              type: "confirmation_required",
              streamId,
              confirmationId,
              toolName,
              description: riskReason
                ? `The agent wants to perform a risky tab action: ${toolName}`
                : `The agent wants to perform a sensitive action: ${toolName}`,
              riskReason: riskReason ?? undefined,
              args: (args as Record<string, unknown>) ?? {}
            })
            const approved = await waitForConfirmation(confirmationId)
            if (!approved) {
              return { success: false, error: "Action denied (or timed out) by user confirmation policy." }
            }
          }

          return await withTimeout(
            toolAny.execute(args),
            TOOL_EXECUTE_TIMEOUT_MS,
            toolName
          )
        }
      }]
    })
  )

  try {
    const result = streamText({
      model: ollama(settings.model),
      system: buildSystemPrompt(context, memory, {
        skillResearch: settings.skillResearch,
        skillAutomation: settings.skillAutomation,
        skillMemory: settings.skillMemory,
        skillRag: settings.skillRag,
        skillWriting: settings.skillWriting
      }),
      messages,
      tools: (enableTools ? toolsWithConfirmation : undefined) as never,
      stopWhen: (enableTools ? stepCountIs(AGENT_MAX_STEPS) : undefined) as never,
      onChunk: ({ chunk }) => {
        if (chunk.type === "text-delta") {
          res.send({ type: "chunk", streamId, delta: chunk.text })
          return
        }

        if (chunk.type === "reasoning-delta") {
          res.send({ type: "reasoning_delta", streamId, delta: chunk.text })
          return
        }

        if (chunk.type === "tool-input-start") {
          toolInputBuffers.set(chunk.id, "")
          return
        }

        if (chunk.type === "tool-input-delta") {
          const prev = toolInputBuffers.get(chunk.id) ?? ""
          toolInputBuffers.set(chunk.id, prev + chunk.delta)
          return
        }

        if (chunk.type === "tool-call") {
          const mergedArgs = mergeToolInputFromBuffer(chunk.toolCallId, chunk.input, toolInputBuffers)
          const name = normalizeToolName(String(chunk.toolName))
          const existing = toolCallMap.get(chunk.toolCallId)
          const startTime = existing?.startTime ?? Date.now()
          const call: ToolCall = {
            id: chunk.toolCallId,
            name,
            args: mergedArgs ?? {},
            status: "running"
          }
          toolCallMap.set(chunk.toolCallId, { call, startTime })
          res.send({ type: "tool_start", streamId, call })
          return
        }

        if (chunk.type === "tool-result") {
          const entry = toolCallMap.get(chunk.toolCallId)
          const duration = entry ? Date.now() - entry.startTime : 0
          const name = entry?.call.name
            ? normalizeToolName(String(entry.call.name))
            : normalizeToolName(String(chunk.toolName))
          const args = mergeToolInputFromBuffer(chunk.toolCallId, entry?.call.args ?? chunk.input, toolInputBuffers) ?? {}
          const call: ToolCall = {
            ...(entry?.call ?? {
              id: chunk.toolCallId,
              name,
              args: {},
              status: "running"
            }),
            name,
            args,
            status: "done",
            result: chunk.output,
            duration
          }
          res.send({ type: "tool_done", streamId, call })
          return
        }

        const maybeErr = chunk as unknown as {
          type: string
          toolCallId: string
          toolName: string
          input: unknown
          error: unknown
        }
        if (maybeErr.type === "tool-error") {
          const entry = toolCallMap.get(maybeErr.toolCallId)
          const duration = entry ? Date.now() - entry.startTime : 0
          const name = normalizeToolName(String(maybeErr.toolName))
          const args =
            mergeToolInputFromBuffer(maybeErr.toolCallId, entry?.call.args ?? maybeErr.input, toolInputBuffers) ?? {}
          const err = maybeErr.error
          const errorText =
            err !== null && typeof err === "object" && "message" in err
              ? String((err as { message: unknown }).message)
              : String(err)
          const call: ToolCall = {
            ...(entry?.call ?? {
              id: maybeErr.toolCallId,
              name,
              args,
              status: "running"
            }),
            name,
            args,
            status: "error",
            error: errorText,
            duration
          }
          res.send({ type: "tool_done", streamId, call })
        }
      }
    })

    const finalText = await result.text
    res.send({ type: "done", streamId, finalText })
  } catch (e) {
    res.send({ type: "error", streamId, message: String(e) })
  }
}

export default handler