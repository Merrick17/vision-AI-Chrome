import { create } from "zustand"

type VoiceMode = "off" | "push-to-talk" | "wake-word"

type VoiceStore = {
  mode: VoiceMode
  listening: boolean
  transcript: string
  ttsEnabled: boolean
  wakeWord: string
  speaking: boolean
  energized: boolean
  sttAvailable: boolean | null
  ttsAvailable: boolean | null
  micPermissionGranted: boolean | null
  showMicPermission: boolean
  requestingMic: boolean
  setMode: (mode: VoiceMode) => void
  setListening: (listening: boolean) => void
  setTranscript: (transcript: string) => void
  setTtsEnabled: (enabled: boolean) => void
  setWakeWord: (word: string) => void
  setSpeaking: (speaking: boolean) => void
  setEnergized: (energized: boolean) => void
  setSttAvailable: (available: boolean) => void
  setTtsAvailable: (available: boolean) => void
  setMicPermissionGranted: (granted: boolean | null) => void
  setShowMicPermission: (show: boolean) => void
  setRequestingMic: (v: boolean) => void
  refreshMicPermission: (options?: { requestIfUnknown?: boolean }) => Promise<boolean | null>
  load: () => Promise<void>
  save: () => Promise<void>
}

const STORAGE_KEY = "vision:voice"

const DEFAULTS = {
  mode: "push-to-talk" as VoiceMode,
  listening: false,
  transcript: "",
  ttsEnabled: false,
  wakeWord: "Energize",
  speaking: false,
  energized: false,
  sttAvailable: null as boolean | null,
  ttsAvailable: null as boolean | null,
  micPermissionGranted: null as boolean | null,
  showMicPermission: false,
  requestingMic: false
}

export const useVoiceStore = create<VoiceStore>((set, get) => ({
  ...DEFAULTS,

  setMode: (mode) => { set({ mode }); get().save() },
  setListening: (listening) => set({ listening }),
  setTranscript: (transcript) => set({ transcript }),
  setTtsEnabled: (ttsEnabled) => { set({ ttsEnabled }); get().save() },
  setWakeWord: (wakeWord) => { set({ wakeWord }); get().save() },
  setSpeaking: (speaking) => set({ speaking }),
  setEnergized: (energized) => set({ energized }),
  setSttAvailable: (sttAvailable) => set({ sttAvailable }),
  setTtsAvailable: (ttsAvailable) => set({ ttsAvailable }),
  setMicPermissionGranted: (micPermissionGranted) => { set({ micPermissionGranted }); get().save() },
  setShowMicPermission: (showMicPermission) => set({ showMicPermission }),
  setRequestingMic: (requestingMic) => set({ requestingMic }),

  refreshMicPermission: async (options) => {
    if (typeof navigator === "undefined") return null
    const requestIfUnknown = options?.requestIfUnknown ?? false

    try {
      if ("permissions" in navigator && (navigator.permissions as Permissions).query) {
        const status = await navigator.permissions.query({ name: "microphone" as PermissionName })
        const granted = status.state === "granted" ? true : status.state === "denied" ? false : null
        set({ micPermissionGranted: granted })
        if (granted === null && !requestIfUnknown) {
          return null
        }
        if (granted !== null) {
          return granted
        }
      } else if (!requestIfUnknown) {
        set({ micPermissionGranted: null })
        return null
      }
    } catch {
      if (!requestIfUnknown) {
        set({ micPermissionGranted: null })
        return null
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())
      set({ micPermissionGranted: true })
      return true
    } catch {
      set({ micPermissionGranted: false })
      return false
    }
  },

  load: async () => {
    const stored = await chrome.storage.local.get(STORAGE_KEY) as Record<string, unknown>
    const data = (stored[STORAGE_KEY] as Record<string, unknown>) ?? {}
    set({
      mode: (data.voiceMode as VoiceMode) ?? DEFAULTS.mode,
      ttsEnabled: (data.ttsEnabled as boolean) ?? DEFAULTS.ttsEnabled,
      wakeWord: (data.wakeWord as string) ?? DEFAULTS.wakeWord,
      micPermissionGranted: (data.micPermissionGranted as boolean | null) ?? DEFAULTS.micPermissionGranted
    })
  },

  save: async () => {
    const { mode, ttsEnabled, wakeWord, micPermissionGranted } = get()
    await chrome.storage.local.set({ [STORAGE_KEY]: { voiceMode: mode, ttsEnabled, wakeWord, micPermissionGranted } })
  }
}))
