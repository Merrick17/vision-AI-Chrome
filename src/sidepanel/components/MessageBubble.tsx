import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Brain, ChevronRight, Copy, Check } from "lucide-react"
import type { Message } from "~/types"
import { useSettingsStore } from "~/store/settings"
import { ToolExecutionCard } from "./ToolExecutionCard"
import { MarkdownContent } from "./MarkdownContent"

function relativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 5) return "just now"
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

const STATUS_ICON: Record<string, string> = { running: "⟳", done: "✓", error: "✗" }
const STATUS_COLOR: Record<string, string> = {
  running: "text-muted-foreground",
  done: "text-success",
  error: "text-destructive-foreground"
}

type Props = { message: Message }

function normalizeAssistantCopy(content: string): string {
  return content
    .replace(/<\/?(?:think|thinking|reasoning|redacted_reasoning)[^>]*>/gi, "")
    .replace(/Ready would you like to do\?/gi, "Ready. What would you like to do?")
    .replace(/,\s*or\.\s*$/gi, ", or answer general questions.")
}

export function MessageBubble({ message }: Props) {
  const showAgentTrace = useSettingsStore((s) => s.showAgentTrace)
  const [reasoningOpen, setReasoningOpen] = useState(true)
  const [toolsExpanded, setToolsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const isUser = message.role === "user"
  const assistantContent = isUser ? message.content : normalizeAssistantCopy(message.content)
  const reasoningText = message.reasoning?.trim()
  const showReasoningBlock = !isUser && showAgentTrace && Boolean(reasoningText)
  const expandToolDetails = showAgentTrace || Boolean(message.streaming)
  const hasTools = Boolean(message.toolCalls?.length)

  const copyContent = useCallback(() => {
    void navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [message.content])

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={`group flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="flex flex-col gap-0.5 max-w-[94%]">
        <div
          className={`px-3.5 py-2.5 text-sm font-mono ${
            isUser
              ? "rounded-lg rounded-br-sm border border-primary/35 bg-primary/10 text-foreground"
              : "rounded-md border border-border/60 bg-panel-elevated/70 text-foreground"
          }`}
          style={isUser ? { boxShadow: "0 0 8px hsl(var(--primary) / 0.12)" } : undefined}>
          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          ) : (
            <>
              {showReasoningBlock && (
                <div className="mb-2 overflow-hidden rounded-md border border-secondary/35 bg-panel-muted/50">
                  <button
                    type="button"
                    onClick={() => setReasoningOpen((o) => !o)}
                    className="flex w-full items-center justify-between gap-2 px-2 py-1.5 text-left transition-colors hover:bg-panel-muted/80">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-secondary">
                      <Brain className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      Reasoning
                    </span>
                    <ChevronRight
                      className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${
                        reasoningOpen ? "rotate-90" : ""
                      }`}
                      aria-hidden
                    />
                  </button>
                  {reasoningOpen && (
                    <pre className="max-h-52 overflow-x-auto overflow-y-auto whitespace-pre-wrap border-t border-border/50 bg-background/40 px-2 py-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
                      {message.reasoning}
                    </pre>
                  )}
                </div>
              )}
              <div className="prose-sm max-w-none">
                <MarkdownContent content={assistantContent} />
              </div>
            </>
          )}
          {message.streaming && (
            <motion.span
              className="ml-0.5 inline-block h-3.5 w-1.5 bg-primary align-middle"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            />
          )}

          {hasTools && (
            <div className="mt-2">
              {expandToolDetails ? (
                <div className="space-y-1.5">
                  {showAgentTrace && (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tools</p>
                  )}
                  {message.toolCalls!.map((tc) => (
                    <ToolExecutionCard
                      key={tc.id}
                      call={tc}
                      defaultExpanded={tc.status === "running" || tc.status === "error"}
                    />
                  ))}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setToolsExpanded((o) => !o)}
                  className="flex flex-wrap items-center gap-1 rounded border border-border/50 bg-panel-muted/40 px-2 py-1 text-[10px] font-mono hover:border-border hover:bg-panel-muted/70 transition-colors w-full text-left">
                  {message.toolCalls!.map((tc) => (
                    <span
                      key={tc.id}
                      className={`flex items-center gap-0.5 ${STATUS_COLOR[tc.status] ?? "text-muted-foreground"}`}>
                      <span>{STATUS_ICON[tc.status]}</span>
                      <span className="text-foreground/70">{tc.name}</span>
                    </span>
                  ))}
                  <AnimatePresence>
                    {toolsExpanded && (
                      <motion.div
                        className="mt-1.5 w-full space-y-1.5"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}>
                        {message.toolCalls!.map((tc) => (
                          <ToolExecutionCard key={tc.id} call={tc} defaultExpanded={false} />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              )}
            </div>
          )}
        </div>

        {!isUser && !message.streaming && (
          <div className="flex items-center gap-2 px-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <span className="font-mono text-[9px] text-muted-foreground/60">
              {relativeTime(message.timestamp)}
            </span>
            <button
              type="button"
              onClick={copyContent}
              className="flex items-center gap-0.5 rounded px-1 py-0.5 font-mono text-[9px] text-muted-foreground/60 hover:text-foreground hover:bg-panel-muted transition-colors"
              aria-label="Copy response">
              {copied
                ? <><Check className="h-2.5 w-2.5" /><span>copied</span></>
                : <><Copy className="h-2.5 w-2.5" /><span>copy</span></>
              }
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
