import { useEffect, useCallback } from "react"
import { createSTT, createWakeWordDetector, isSTTAvailable } from "~/lib/voice/stt"
import { speak, stopSpeaking } from "~/lib/voice/tts"
import { requestMicPermissionViaIframe } from "~/lib/voice/micPermission"
import { useVoiceStore } from "~/store/voice"
import { useAgent } from "./useAgent"
import { toast } from "~/sidepanel/components/ui/sonner"

type STTController = { stop: () => void; abort: () => void }

let wakeDetector: ReturnType<typeof createWakeWordDetector> | null = null
let sttController: STTController | null = null

function stopSTT(setListening: (listening: boolean) => void) {
  sttController?.stop()
  sttController = null
  setListening(false)
}

function abortSTT(setListening: (listening: boolean) => void) {
  sttController?.abort()
  sttController = null
  setListening(false)
}

function startSTTSession({
  onFinalPrompt,
  setListening,
  setTranscript,
  onStart,
  onError
}: {
  onFinalPrompt: (transcript: string) => void
  setListening: (listening: boolean) => void
  setTranscript: (transcript: string) => void
  onStart?: () => void
  onError?: (msg: string) => void
}) {
  // Pause the wake detector before starting STT — Chrome only allows one
  // SpeechRecognition instance at a time, so the detector must stop first.
  wakeDetector?.pause()
  abortSTT(setListening)
  setListening(true)
  setTranscript("")

  const stt = createSTT({
    onStart,
    onInterim: setTranscript,
    onFinal: (transcript) => {
      if (transcript.trim()) {
        onFinalPrompt(transcript.trim())
      }
      setTranscript("")
    },
    onEnd: () => {
      sttController = null
      setListening(false)
      wakeDetector?.resume()
    },
    onError: (msg) => {
      onError?.(msg)
      sttController = null
      setListening(false)
      wakeDetector?.resume()
    }
  })
  sttController = stt
  stt.start()
}

export function useVoiceController() {
  const {
    mode,
    wakeWord,
    micPermissionGranted,
    setListening,
    setTranscript,
    setEnergized,
    setMicPermissionGranted,
    setShowMicPermission,
    setRequestingMic
  } = useVoiceStore()
  const { sendPrompt } = useAgent()

  useEffect(() => {
    if (mode !== "wake-word") {
      wakeDetector?.stop()
      wakeDetector = null
      return
    }

    if (!isSTTAvailable()) return

    const startDetector = () => {
      wakeDetector?.stop()
      wakeDetector = createWakeWordDetector(wakeWord, () => {
        setEnergized(true)
        setTimeout(() => setEnergized(false), 1800)

        startSTTSession({
          onFinalPrompt: sendPrompt,
          setListening,
          setTranscript,
          onError: (msg) => {
            const denied = msg.toLowerCase().includes("not-allowed") || msg.toLowerCase().includes("permission")
            if (denied) {
              setMicPermissionGranted(false)
              setShowMicPermission(true)
            }
          }
        })
      })
      wakeDetector.start()
    }

    if (micPermissionGranted === true) {
      startDetector()
    } else {
      // Request mic via iframe injected into the active tab — this makes Chrome
      // show its native permission dialog in the main browser window instead of
      // silently failing inside the extension sidepanel.
      // When setMicPermissionGranted(true) fires, micPermissionGranted changes
      // → this effect re-runs → startDetector() is called cleanly after cleanup.
      setRequestingMic(true)
      requestMicPermissionViaIframe()
        .then((granted) => {
          if (granted) {
            setMicPermissionGranted(true) // triggers effect re-run → startDetector()
          } else {
            setMicPermissionGranted(false)
            setShowMicPermission(true)
          }
        })
        .finally(() => setRequestingMic(false))
    }

    return () => {
      wakeDetector?.stop()
      wakeDetector = null
      abortSTT(setListening)
    }
  }, [
    mode,
    wakeWord,
    micPermissionGranted,
    sendPrompt,
    setEnergized,
    setListening,
    setTranscript,
    setMicPermissionGranted,
    setShowMicPermission,
    setRequestingMic
  ])
}

export function useVoice() {
  const {
    ttsEnabled,
    micPermissionGranted,
    setListening,
    setTranscript,
    setSpeaking,
    setMicPermissionGranted,
    setShowMicPermission,
    setRequestingMic
  } = useVoiceStore()
  const { sendPrompt, cancelCurrentResponse } = useAgent()

  const startListening = useCallback(async () => {
    if (!isSTTAvailable()) {
      toast.error("Voice input is not supported in this browser. Try Chrome or Edge.")
      return
    }

    if (micPermissionGranted !== true) {
      setRequestingMic(true)
      try {
        // Use iframe injection into the active tab so Chrome's permission dialog
        // appears in the main browser window, not silently inside the sidepanel.
        const granted = await requestMicPermissionViaIframe()
        if (!granted) {
          setMicPermissionGranted(false)
          setShowMicPermission(true)
          return
        }
        setMicPermissionGranted(true)
      } finally {
        setRequestingMic(false)
      }
    }

    startSTTSession({
      onFinalPrompt: sendPrompt,
      setListening,
      setTranscript,
      onError: (msg) => {
        const denied = msg.toLowerCase().includes("not-allowed") || msg.toLowerCase().includes("permission")
        if (denied) {
          setMicPermissionGranted(false)
          setShowMicPermission(true)
        } else if (!msg.includes("No speech detected")) {
          toast.error(msg)
        }
      }
    })
  }, [
    micPermissionGranted,
    sendPrompt,
    setListening,
    setTranscript,
    setMicPermissionGranted,
    setShowMicPermission,
    setRequestingMic
  ])

  const stopListening = useCallback(() => {
    stopSTT(setListening)
  }, [setListening])

  function startPushToTalk() {
    startListening()
  }

  function stopPushToTalk() {
    stopListening()
  }

  function speakResponse(text: string) {
    if (ttsEnabled) {
      speak(text, {
        onStart: () => setSpeaking(true),
        onEnd: () => setSpeaking(false)
      })
    }
  }

  function stopResponse() {
    stopSpeaking()
    setSpeaking(false)
  }

  function stopAllVoiceAndResponse() {
    stopResponse()
    stopListening()
    cancelCurrentResponse()
  }

  return { startPushToTalk, stopPushToTalk, startListening, stopListening, speakResponse, stopResponse, stopAllVoiceAndResponse }
}
