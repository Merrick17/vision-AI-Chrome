import { motion, AnimatePresence } from "framer-motion"
import { Mic, X, ShieldOff, RefreshCw } from "lucide-react"

type Props = {
  onAllow: () => void
  onDismiss: () => void
}

export function MicPermissionDialog({ onAllow, onDismiss }: Props) {
  function openMicSettings() {
    const ua = navigator.userAgent.toLowerCase()
    const url = ua.includes("edg/")
      ? "edge://settings/content/microphone"
      : "chrome://settings/content/microphone"
    if (typeof chrome !== "undefined" && chrome.tabs?.create) {
      void chrome.tabs.create({ url })
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-background/60 backdrop-blur-sm pb-20"
        onClick={onDismiss}>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="mx-3 w-full max-w-[320px] rounded-2xl border border-border/70 bg-panel-elevated shadow-2xl"
          onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/15 border border-destructive/30">
                <ShieldOff className="h-4 w-4 text-destructive-foreground" />
              </div>
              <span className="font-mono text-xs font-bold tracking-wide text-foreground">
                Microphone Blocked
              </span>
            </div>
            <button
              onClick={onDismiss}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3 p-4">
            {/* Explanation */}
            <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
              Chrome blocked microphone access for this extension. The permission prompt may have appeared briefly at the top of your browser window.
            </p>

            {/* Address bar visual hint */}
            <div className="rounded-lg border border-border/60 bg-panel p-3 space-y-1.5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                How to enable
              </p>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 font-bold text-primary">1.</span>
                  <span className="text-foreground/80">
                    Look at the <span className="font-bold text-foreground">address bar</span> at the top of your browser window (not this panel)
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 font-bold text-primary">2.</span>
                  <span className="text-foreground/80">
                    Click the <span className="inline-flex items-center gap-0.5 rounded border border-border/70 bg-panel-muted px-1 py-0.5 text-[10px]"><Mic className="h-2.5 w-2.5" /> camera/mic icon</span> on the right side
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 font-bold text-primary">3.</span>
                  <span className="text-foreground/80">
                    Select <span className="font-bold text-foreground">"Always allow"</span> for the microphone
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 font-bold text-primary">4.</span>
                  <span className="text-foreground/80">
                    Come back here and click <span className="font-bold text-success">Try Again</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Alternative */}
            <p className="font-mono text-[10px] text-muted-foreground/70">
              If you don't see the icon, your browser may have a global block on microphone access.
            </p>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={openMicSettings}
                className="flex-1 rounded-lg border border-border/70 bg-panel px-3 py-2 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                Open Settings
              </button>
              <button
                onClick={onAllow}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-success/50 bg-success/15 px-3 py-2 font-mono text-[11px] font-medium text-success transition-colors hover:bg-success/25">
                <RefreshCw className="h-3 w-3" />
                Try Again
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
