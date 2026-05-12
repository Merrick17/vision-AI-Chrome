import { motion, AnimatePresence } from "framer-motion"
import { Volume2, X } from "lucide-react"
import { useVoiceStore } from "~/store/voice"
import { useVoice } from "~/hooks/useVoice"
import { AudioWaveform } from "./AudioWaveform"

export function TTSIndicator() {
  const speaking = useVoiceStore((s) => s.speaking)
  const { stopResponse } = useVoice()

  return (
    <AnimatePresence>
      {speaking && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative z-20 overflow-hidden border-t border-border/70">
          <div
            className="flex items-center gap-2 bg-panel-muted/60 px-3 py-2"
            style={{ boxShadow: "inset 0 0 20px hsl(var(--primary) / 0.07)" }}>
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-primary/45 bg-primary/20"
              style={{ boxShadow: "0 0 8px hsl(var(--primary) / 0.3)" }}>
              <Volume2 className="h-3 w-3 text-primary" />
            </div>
            <AudioWaveform active={speaking} color="bg-primary" />
            <p className="flex-1 font-mono text-xs tracking-widest text-primary">SPEAKING...</p>
            <button
              onClick={stopResponse}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border bg-panel hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Stop speaking">
              <X className="h-3 w-3" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
