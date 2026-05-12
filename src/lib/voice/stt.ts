interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string
  readonly message: string
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onspeechend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

type STTCallbacks = {
  onStart?: () => void
  onInterim: (transcript: string) => void
  onFinal: (transcript: string) => void
  onEnd: () => void
  onError?: (message: string) => void
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance
    webkitSpeechRecognition: new () => SpeechRecognitionInstance
  }
}

let recognitionInstance: SpeechRecognitionInstance | null = null

export function isSTTAvailable(): boolean {
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window
}

export function createSTT(callbacks: STTCallbacks) {
  const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition
  const recognition = new SR()
  recognition.continuous = true
  recognition.interimResults = true
  recognition.lang = "en-US"
  recognition.maxAlternatives = 1

  recognition.onstart = () => callbacks.onStart?.()

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let interim = ""
    let final = ""
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i]
      const transcript = result[0].transcript
      if (result.isFinal) {
        final += transcript
      } else {
        interim += transcript
      }
    }
    if (interim) callbacks.onInterim(interim)
    if (final) callbacks.onFinal(final.trim())
  }

  recognition.onend = () => {
    recognitionInstance = null
    callbacks.onEnd()
  }

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    const msg = event.error === "not-allowed"
      ? "Microphone permission denied. Please allow microphone access."
      : event.error === "no-speech"
        ? "No speech detected. Try again."
        : event.error === "network"
          ? "Network error during speech recognition."
          : event.message || `Speech recognition error: ${event.error}`
    callbacks.onError?.(msg)
    recognitionInstance = null
  }

  recognition.onspeechend = () => {
    recognition.stop()
  }

  recognitionInstance = recognition

  return {
    start: () => {
      try {
        recognition.start()
      } catch (e) {
        callbacks.onError?.(String(e))
      }
    },
    stop: () => {
      try {
        recognition.stop()
      } catch {
        // Already stopped
      }
    },
    abort: () => {
      try {
        recognition.abort()
      } catch {
        // Already aborted
      }
    }
  }
}

export function createWakeWordDetector(wakeWord: string, onActivate: () => void) {
  if (!isSTTAvailable()) return { start: () => {}, stop: () => {} }

  const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition
  const recognition = new SR()
  recognition.continuous = true
  recognition.interimResults = true
  recognition.lang = "en-US"

  let active = false
  let stopped = false

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    if (active) return
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const text = event.results[i][0].transcript.toLowerCase()
      if (text.includes(wakeWord.toLowerCase())) {
        active = true
        onActivate()
        setTimeout(() => { active = false }, 3000)
        break
      }
    }
  }

  recognition.onend = () => {
    if (!stopped) {
      try { recognition.start() } catch { /* ignore */ }
    }
  }

  recognition.onerror = () => {
    // Auto-restart on error unless stopped
  }

  return {
    start: () => {
      stopped = false
      try { recognition.start() } catch { /* ignore */ }
    },
    stop: () => {
      stopped = true
      recognition.onend = null
      try { recognition.stop() } catch { /* ignore */ }
    },
    pause: () => {
      stopped = true
      try { recognition.stop() } catch { /* ignore */ }
    },
    resume: () => {
      stopped = false
      try { recognition.start() } catch { /* ignore */ }
    }
  }
}