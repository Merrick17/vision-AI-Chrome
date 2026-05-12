import { motion, AnimatePresence } from "framer-motion"
import { Mic } from "lucide-react"
import { useVoiceStore } from "~/store/voice"
import { AudioWaveform } from "./AudioWaveform"

export function VoiceIndicator() {
  const listening = useVoiceStore((s) => s.listening)
  const transcript = useVoiceStore((s) => s.transcript)

  return (
    <AnimatePresence>
      {listening && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative z-20 overflow-hidden border-b border-border/70">
          <div
            className="flex items-center gap-2 bg-panel-muted/60 px-3 py-2"
            style={{ boxShadow: "inset 0 0 20px hsl(var(--secondary) / 0.08)" }}>
            <div className="relative shrink-0">
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0.1, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-secondary"
              />
              <div
                className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full border border-secondary/55 bg-secondary/15"
                style={{ boxShadow: "0 0 8px hsl(var(--secondary) / 0.35)" }}>
                <Mic className="h-3 w-3 text-secondary" />
              </div>
            </div>
            <AudioWaveform active={listening} color="bg-secondary" />
            <p className="flex-1 truncate font-mono text-xs text-secondary">
              {transcript || "LISTENING..."}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
