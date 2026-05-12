import { useRef, useState, useEffect, type KeyboardEvent } from "react"
import { Mic, MicOff, Send, Square, Volume2, VolumeX } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "~/sidepanel/components/ui/button"
import { Textarea } from "~/sidepanel/components/ui/textarea"
import { useAgent } from "~/hooks/useAgent"
import { useVoice } from "~/hooks/useVoice"
import { useChatStore } from "~/store/chat"
import { useVoiceStore } from "~/store/voice"
import { MicPermissionDialog } from "./MicPermissionDialog"

export function InputBar() {
  const [input, setInput] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { sendPrompt } = useAgent()
  const { startListening, stopListening, stopAllVoiceAndResponse } = useVoice()
  const agentState = useChatStore((s) => s.agentState)
  const listening = useVoiceStore((s) => s.listening)
  const transcript = useVoiceStore((s) => s.transcript)
  const speaking = useVoiceStore((s) => s.speaking)
  const ttsEnabled = useVoiceStore((s) => s.ttsEnabled)
  const sttAvailable = useVoiceStore((s) => s.sttAvailable)
  const micPermissionGranted = useVoiceStore((s) => s.micPermissionGranted)
  const showMicPermission = useVoiceStore((s) => s.showMicPermission)
  const requestingMic = useVoiceStore((s) => s.requestingMic)
  const setTtsEnabled = useVoiceStore((s) => s.setTtsEnabled)
  const setShowMicPermission = useVoiceStore((s) => s.setShowMicPermission)
  const isThinking = agentState === "thinking" || agentState === "acting"

  useEffect(() => {
    const el = textareaRef.current
    if (!el || listening) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [input, listening])

  function handleSend() {
    const text = input.trim()
    if (!text || isThinking) return
    setInput("")
    sendPrompt(text)
    textareaRef.current?.focus()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleMicClick() {
    if (sttAvailable === false) return
    if (listening) {
      stopListening()
      return
    }
    // Start STT directly — Chrome will show its native permission dialog in the
    // browser's address bar if this is the first use. The MicPermissionDialog
    // only opens if Chrome later fires a "not-allowed" error.
    startListening()
  }

  function handleTtsToggle() {
    setTtsEnabled(!ttsEnabled)
  }

  const micDisabled = sttAvailable === false
  // Show address-bar hint while getUserMedia is pending (Chrome's native dialog
  // appears in the browser address bar, not inside the sidepanel)
  const showAddressBarHint = requestingMic

  return (
    <>
      {showMicPermission && (
        <MicPermissionDialog
          onAllow={() => { setShowMicPermission(false); startListening() }}
          onDismiss={() => setShowMicPermission(false)}
        />
      )}
      <AnimatePresence>
        {showAddressBarHint && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
            className="relative z-20 border-t border-secondary/40 bg-secondary/8 px-3 py-2">
            <p className="font-mono text-[10px] leading-snug text-secondary">
              <span className="mr-1 font-bold">🎤</span>
              A microphone permission dialog is opening in your browser. Click{" "}
              <span className="font-bold">Allow</span> to enable voice input.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="relative z-20 border-t border-border/70 bg-panel/80 px-3 py-2.5 backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={listening ? transcript : input}
              onChange={(e) => { if (!listening) setInput(e.target.value) }}
              onKeyDown={handleKeyDown}
              placeholder={listening ? "LISTENING..." : isThinking ? "PROCESSING..." : "ENTER COMMAND..."}
              disabled={isThinking || listening}
              rows={1}
              aria-label="Message input"
              className={`flex-1 min-h-[36px] max-h-[120px] resize-none rounded-md bg-input px-3 py-2.5 font-mono text-sm text-foreground transition-all duration-200 placeholder:text-muted-foreground ${
                listening
                  ? "border-secondary/60 ring-1 ring-secondary/30 text-secondary placeholder:text-secondary/60"
                  : "focus-visible:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary/40"
              }`}
              style={listening ? { boxShadow: "0 0 12px hsl(var(--secondary) / 0.18)" } : undefined}
            />
          </div>

          <div className="flex shrink-0 items-center gap-1 rounded-full border border-border/60 bg-panel/50 p-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleTtsToggle}
              aria-label={ttsEnabled ? "Disable text-to-speech" : "Enable text-to-speech"}
              className={`h-9 w-9 shrink-0 rounded-full transition-colors ${
                ttsEnabled
                  ? "border-0 bg-primary/20 text-primary hover:bg-primary/30"
                  : "border-0 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}>
              {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleMicClick}
              disabled={micDisabled || requestingMic}
              aria-label={listening ? "Stop listening" : requestingMic ? "Requesting microphone..." : "Start voice input"}
              title={
                micDisabled
                  ? "Voice input not supported in this browser"
                  : requestingMic
                    ? "Waiting for microphone permission..."
                    : listening
                      ? "Stop listening"
                      : "Start voice input"
              }
              className={`h-9 w-9 shrink-0 rounded-full transition-all duration-200 ${
                micDisabled
                  ? "cursor-not-allowed text-muted-foreground opacity-35"
                  : requestingMic
                    ? "border-0 text-warning animate-pulse cursor-wait"
                    : listening
                      ? "border-0 bg-secondary/25 text-secondary ring-2 ring-secondary/40 ring-offset-1 ring-offset-panel"
                      : "border-0 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}>
              {requestingMic
                ? <Mic className="h-4 w-4" />
                : listening
                  ? <MicOff className="h-4 w-4" />
                  : <Mic className="h-4 w-4" />
              }
            </Button>

            <AnimatePresence mode="wait">
              {isThinking || speaking ? (
                <motion.div
                  key="cancel"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.15 }}
                  className="flex h-9 w-9 items-center justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Cancel"
                    onClick={stopAllVoiceAndResponse}
                    className="h-9 w-9 shrink-0 rounded-full border border-destructive/50 bg-destructive/15 text-destructive-foreground hover:bg-destructive/25">
                    <Square className="h-3.5 w-3.5" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="send"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.15 }}
                  className="flex h-9 w-9 items-center justify-center">
                  <Button
                    type="button"
                    onClick={handleSend}
                    disabled={!input.trim() || isThinking}
                    size="icon"
                    aria-label="Send message"
                    title={
                      isThinking
                        ? "Wait for the current reply to finish"
                        : input.trim()
                          ? "Send (Enter)"
                          : "Type a message to send"
                    }
                    className={`h-9 w-9 shrink-0 rounded-full font-medium transition-all duration-200 ${
                      input.trim() && !isThinking
                        ? "border border-primary/50 bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-md shadow-primary/20 ring-1 ring-primary/35 hover:shadow-lg hover:ring-primary/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        : "border border-border bg-panel-elevated text-foreground/85 shadow-sm hover:border-border hover:bg-muted hover:text-foreground disabled:opacity-55"
                    }`}>
                    <Send className="h-4 w-4 translate-x-px drop-shadow-sm" strokeWidth={2.25} />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  )
}
