type SpeakOptions = {
  onStart?: () => void
  onEnd?: () => void
}

let cachedVoices: SpeechSynthesisVoice[] = []

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  const loadVoices = () => { cachedVoices = window.speechSynthesis.getVoices() }
  window.speechSynthesis.onvoiceschanged = loadVoices
  loadVoices()
}

export function isTTSAvailable(): boolean {
  return "speechSynthesis" in window
}

function getEnglishVoice(): SpeechSynthesisVoice | null {
  if (!("speechSynthesis" in window)) return null
  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices()
  const enUS = voices.find((v) => v.lang === "en-US" && !v.localService)
    ?? voices.find((v) => v.lang === "en-US")
  if (enUS) return enUS
  const enAny = voices.find((v) => v.lang.startsWith("en-") && !v.localService)
    ?? voices.find((v) => v.lang.startsWith("en-"))
  return enAny ?? null
}

export function speak(text: string, options?: SpeakOptions) {
  if (!("speechSynthesis" in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 1.0
  utterance.pitch = 1.0
  utterance.lang = "en-US"

  const voice = getEnglishVoice()
  if (voice) utterance.voice = voice

  utterance.onstart = () => options?.onStart?.()
  utterance.onend = () => options?.onEnd?.()
  utterance.onerror = () => options?.onEnd?.()
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel()
  }
}

export function stripMarkdownForTTS(text: string): string {
  return text
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/gs, "$1")
    .replace(/\*(.+?)\*/gs, "$1")
    .replace(/`{1,3}[\s\S]*?`{1,3}/g, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 600)
}