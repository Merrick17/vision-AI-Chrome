import { useEffect, useRef, useCallback } from "react"
import { usePort } from "@plasmohq/messaging/hook"
import type { ModelMessage } from "ai"
import { toast } from "~/sidepanel/components/ui/sonner"
import { useChatStore } from "~/store/chat"
import { useVoiceStore } from "~/store/voice"
import { useSettingsStore } from "~/store/settings"
import { speak, stripMarkdownForTTS } from "~/lib/voice/tts"
import type { StreamMessage } from "~/types"
import { nanoid } from "~/lib/utils"
import { usePermissionStore } from "~/store/permissions"

const AUTO_SAVE_INTERVAL = 30_000

export function useAgent() {
  const streamPort = usePort("stream" as Parameters<typeof usePort>[0])
  const assistantIdRef = useRef<string | null>(null)
  const streamIdRef = useRef<string | null>(null)

  const {
    addMessage,
    appendStreamChunk,
    appendReasoningChunk,
    finalizeStream,
    addToolCall,
    updateToolCall,
    setAgentState
  } = useChatStore()
  const { ttsEnabled, setSpeaking } = useVoiceStore()

  useEffect(() => {
    const interval = setInterval(() => {
      const { messages } = useChatStore.getState()
      if (messages.length > 0) {
        useChatStore.getState().saveCurrentConversation()
      }
    }, AUTO_SAVE_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!streamPort.data) return
    const msg = streamPort.data as StreamMessage

    if ("streamId" in msg && streamIdRef.current && msg.streamId !== streamIdRef.current) {
      return
    }

    if (msg.type === "chunk") {
      if (assistantIdRef.current) {
        appendStreamChunk(assistantIdRef.current, msg.delta)
        setAgentState("acting")
      }
    }

    if (msg.type === "reasoning_delta") {
      if (assistantIdRef.current) {
        appendReasoningChunk(assistantIdRef.current, msg.delta)
        setAgentState("thinking")
      }
    }

    if (msg.type === "tool_start") {
      if (assistantIdRef.current) {
        addToolCall(assistantIdRef.current, msg.call)
      }
    }

    if (msg.type === "tool_done") {
      const aid = assistantIdRef.current
      if (aid) {
        const assistant = useChatStore.getState().messages.find((m) => m.id === aid)
        const hasCall = assistant?.toolCalls?.some((tc) => tc.id === msg.call.id)
        if (hasCall) {
          updateToolCall(msg.call)
        } else {
          addToolCall(aid, msg.call)
        }
      }
    }

    if (msg.type === "confirmation_required") {
      const { confirmationId, toolName, description, args, riskReason } = msg
      const { autonomousMode } = useSettingsStore.getState()

      if (autonomousMode) {
        chrome.runtime.sendMessage({
          name: "resolveConfirmation",
          body: { confirmationId, approved: true }
        })
        return
      }

      usePermissionStore.getState().addConfirmation({
        id: confirmationId,
        toolName,
        description,
        riskReason,
        args
      })
    }

    if (msg.type === "done") {
      if (assistantIdRef.current) {
        finalizeStream(assistantIdRef.current)
        if (ttsEnabled && msg.finalText) {
          speak(stripMarkdownForTTS(msg.finalText), {
            onStart: () => setSpeaking(true),
            onEnd: () => setSpeaking(false)
          })
        }
        assistantIdRef.current = null
        streamIdRef.current = null
        useChatStore.getState().saveCurrentConversation()
      }
    }

    if (msg.type === "error") {
      toast.error(msg.message)
      if (assistantIdRef.current) {
        finalizeStream(assistantIdRef.current)
      }
      setAgentState("idle")
      assistantIdRef.current = null
      streamIdRef.current = null
    }
  }, [streamPort.data, addToolCall, updateToolCall, appendStreamChunk, appendReasoningChunk, setAgentState])

  const sendPrompt = useCallback((prompt: string) => {
    const token = useSettingsStore.getState().ollamaCloudToken?.trim()
    if (!token) {
      toast.error(
        "No Ollama API key: open Settings and paste your key, or set PLASMO_PUBLIC_OLLAMA_CLOUD_TOKEN in .env and run a dev build."
      )
      return
    }

    const existing = useChatStore.getState().messages
    const history: ModelMessage[] = existing
      .filter((m) => !m.streaming && m.content !== "" && (m.role === "user" || m.role === "assistant"))
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))

    history.push({ role: "user", content: prompt })

    addMessage({
      id: nanoid(),
      role: "user",
      content: prompt,
      timestamp: Date.now()
    })

    const assistantId = nanoid()
    const streamId = nanoid()
    assistantIdRef.current = assistantId
    streamIdRef.current = streamId
    addMessage({
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      streaming: true
    })

    setAgentState("thinking")
    streamPort.send({ streamId, messages: history })
  }, [addMessage, setAgentState, streamPort])

  const cancelCurrentResponse = useCallback(() => {
    if (assistantIdRef.current) {
      finalizeStream(assistantIdRef.current)
    }
    assistantIdRef.current = null
    streamIdRef.current = null
    setSpeaking(false)
    setAgentState("idle")
  }, [finalizeStream, setAgentState, setSpeaking])

  return { sendPrompt, cancelCurrentResponse }
}
