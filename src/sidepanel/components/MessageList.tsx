import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { FileText, Search, MousePointerClick, ChevronDown } from "lucide-react"
import { ScrollArea } from "~/sidepanel/components/ui/scroll-area"
import { useChatStore } from "~/store/chat"
import { useVoiceStore } from "~/store/voice"
import { useAgent } from "~/hooks/useAgent"
import { usePermissionStore } from "~/store/permissions"
import { MessageBubble } from "./MessageBubble"
import { ConfirmationDialog } from "./ConfirmationDialog"
import { ThinkingBubble } from "./ThinkingBubble"

const SUGGESTIONS = [
  { icon: FileText, label: "SUMMARIZE PAGE", prompt: "Summarize the content of this page" },
  { icon: Search, label: "EXTRACT DATA", prompt: "What information is available on this page?" },
  { icon: MousePointerClick, label: "FILL FORM", prompt: "Help me fill the form on this page" }
]

export function MessageList() {
  const messages = useChatStore((s) => s.messages)
  const agentState = useChatStore((s) => s.agentState)
  const pendingConfirmations = usePermissionStore((s) => s.pendingConfirmations)
  const sttAvailable = useVoiceStore((s) => s.sttAvailable)
  const voiceMode = useVoiceStore((s) => s.mode)
  const wakeWord = useVoiceStore((s) => s.wakeWord)
  const { sendPrompt } = useAgent()
  const bottomRef = useRef<HTMLDivElement>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)

  useEffect(() => {
    if (!showScrollButton) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, pendingConfirmations, agentState, showScrollButton])

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    setShowScrollButton(false)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { setShowScrollButton(!entry.isIntersecting) },
      { threshold: 0.1 }
    )
    const bottom = bottomRef.current
    if (bottom) observer.observe(bottom)
    return () => { if (bottom) observer.unobserve(bottom) }
  }, [])

  const isEmpty = messages.length === 0 && pendingConfirmations.filter((c) => c.status === "pending").length === 0
  const isThinking = agentState === "thinking" || agentState === "acting"

  const activityHint = useMemo(() => {
    const streamingAssistant = [...messages].reverse().find((m) => m.role === "assistant" && m.streaming)
    if (!streamingAssistant) return undefined
    const runningTool = streamingAssistant.toolCalls?.find((tc) => tc.status === "running")
    if (runningTool) return `Running ${runningTool.name}…`
    if (streamingAssistant.reasoning?.trim()) return "Reasoning…"
    if (agentState === "thinking") return "Planning next step…"
    return "Streaming response…"
  }, [messages, agentState])

  return (
    <div className="relative flex-1 z-20 overflow-hidden">
    <AnimatePresence>
      {showScrollButton && !isEmpty && (
        <motion.button
          initial={{ opacity: 0, scale: 0.85, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 8 }}
          transition={{ duration: 0.15 }}
          onClick={scrollToBottom}
          className="absolute bottom-3 right-3 z-30 flex h-7 w-7 items-center justify-center rounded-full border border-border/80 bg-panel-elevated shadow-lg text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-panel transition-colors"
          aria-label="Scroll to bottom">
          <ChevronDown className="h-3.5 w-3.5" />
        </motion.button>
      )}
    </AnimatePresence>
    <ScrollArea className="h-full px-3 py-3">
      <AnimatePresence mode="wait">
        {isEmpty ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center h-full py-8 gap-4">

            {/* Terminal boot display */}
            <div className="w-full max-w-[260px] space-y-1 font-mono text-xs text-muted-foreground">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}>
                &gt; BOOTING VISION OS...
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}>
                &gt; AI RUNTIME LOADED
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}>
                &gt; TOOLS REGISTERED
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0 }}
                className="text-primary text-glow">
                &gt; VISION ONLINE
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3 }}
                className="text-secondary">
                &gt; AWAITING COMMAND
                <span className="terminal-cursor ml-0.5 inline-block h-3 w-1.5 bg-primary align-middle" />
              </motion.p>
            </div>

            {/* Command suggestions */}
            <motion.div
              className="flex flex-col gap-1.5 w-full max-w-[260px]"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6 }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => sendPrompt(s.prompt)}
                  className="flex items-center gap-2 rounded-sm border border-border/70 px-3 py-2 font-mono text-xs tracking-wide text-muted-foreground transition-all duration-150 hover:border-primary/50 hover:bg-panel-muted/70 hover:text-foreground">
                  <s.icon className="h-3 w-3 shrink-0 text-secondary" />
                  <span>&gt; {s.label}</span>
                </button>
              ))}
            </motion.div>

            {sttAvailable !== false && voiceMode === "wake-word" && (
              <motion.div
                className="mt-1 flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.0 }}>
                <span>[ SAY "{wakeWord.toUpperCase()}" TO ACTIVATE ]</span>
              </motion.div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!isEmpty && (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </AnimatePresence>
          {isThinking && <ThinkingBubble state={agentState} detail={activityHint} />}
          <AnimatePresence>
            {pendingConfirmations
              .filter((c) => c.status === "pending")
              .map((c) => (
                <ConfirmationDialog
                  key={c.id}
                  id={c.id}
                  toolName={c.toolName}
                  description={c.description}
                  riskReason={c.riskReason}
                  args={c.args}
                />
              ))}
          </AnimatePresence>
        </div>
      )}
      <div ref={bottomRef} />
    </ScrollArea>
    </div>
  )
}
