import { Bot, Ear, Plus, Settings } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "~/sidepanel/components/ui/button"
import { SettingsSheet } from "./SettingsSheet"
import { useCurrentTab } from "~/hooks/useCurrentTab"
import { useChatStore } from "~/store/chat"
import { useSettingsStore } from "~/store/settings"
import { useVoiceStore } from "~/store/voice"

const STATE_LABELS: Record<string, string> = {
  idle: "READY",
  thinking: "THINKING",
  acting: "ACTING",
  done: "DONE",
  error: "ERROR"
}

const STATE_COLORS: Record<string, string> = {
  idle: "bg-muted text-foreground border border-border",
  thinking: "bg-primary/15 text-primary border border-primary/35",
  acting: "bg-secondary/20 text-secondary border border-secondary/45",
  done: "bg-success/15 text-success border border-success/40",
  error: "bg-destructive/15 text-destructive-foreground border border-destructive/45"
}

const STATE_DOT_COLORS: Record<string, string> = {
  idle: "bg-primary",
  thinking: "bg-primary animate-pulse",
  acting: "bg-secondary animate-pulse",
  done: "bg-success",
  error: "bg-destructive"
}

export function Header() {
  const { title } = useCurrentTab()
  const messages = useChatStore((s) => s.messages)
  const agentState = useChatStore((s) => s.agentState)
  const isLive = messages.some((m) => m.streaming)
  const model = useSettingsStore((s) => s.model)
  const autonomousMode = useSettingsStore((s) => s.autonomousMode)
  const voiceMode = useVoiceStore((s) => s.mode)
  const setMode = useVoiceStore((s) => s.setMode)
  const startNewConversation = useChatStore((s) => s.startNewConversation)

  return (
    <div className="relative z-20 flex items-center justify-between border-b border-border/70 bg-panel/70 px-3 py-2 backdrop-blur-sm">
      <div className="flex items-center gap-2 min-w-0">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-primary/40 bg-primary/12 text-primary shadow-[0_0_14px_hsl(var(--primary)/0.18)]"
          title="Vision agent"
          aria-hidden>
          <Bot className="h-[18px] w-[18px]" strokeWidth={2} />
        </div>
        <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-1.5">
          <span className="text-xs font-bold font-mono tracking-widest text-primary text-glow">VISION</span>
          <span className="truncate font-mono text-[10px] text-muted-foreground sm:max-w-[80px]">{model}</span>
        </div>
        {title && (
          <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[100px]" title={title}>
            &gt; {title}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        {isLive && (
          <span
            className="text-[9px] font-mono font-bold text-success border border-success/45 bg-success/10 px-1.5 py-0.5 rounded tracking-widest"
            title="Assistant message is still streaming">
            LIVE
          </span>
        )}
        {autonomousMode && (
          <span className="text-[9px] font-mono font-bold text-amber-400 border border-amber-500/50 px-1.5 py-0.5 rounded animate-pulse tracking-widest">
            AUTO
          </span>
        )}
        {voiceMode === "wake-word" && (
          <button
            onClick={() => setMode("push-to-talk")}
            className="relative h-7 w-7 flex items-center justify-center rounded-lg text-primary transition-colors hover:bg-muted hover:text-foreground"
            title="Wake word active — click to disable"
            aria-label="Disable wake word">
            <Ear className="h-3.5 w-3.5" />
            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          </button>
        )}
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${STATE_DOT_COLORS[agentState] ?? "bg-green-700"}`} />
          <AnimatePresence mode="wait">
            <motion.span
              key={agentState}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className={`rounded-sm px-2 py-0.5 text-[10px] font-mono font-medium tracking-wider ${STATE_COLORS[agentState]}`}>
              {STATE_LABELS[agentState]}
            </motion.span>
          </AnimatePresence>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={startNewConversation}
          className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="New conversation"
          title="New conversation">
          <Plus className="h-3.5 w-3.5" />
        </Button>
        <SettingsSheet>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Settings">
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </SettingsSheet>
      </div>
    </div>
  )
}
