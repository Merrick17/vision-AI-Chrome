import { create } from "zustand"
import { resolveOllamaCloudToken } from "~/lib/ollama-token"

export const OLLAMA_CLOUD_URL = "https://api.ollama.com/api"
export const DEFAULT_SUPABASE_URL = ""
export const DEFAULT_SUPABASE_ANON_KEY = ""

type SettingsStore = {
  model: string
  ollamaCloudToken: string
  supabaseUrl: string
  supabaseAnonKey: string
  autonomousMode: boolean
  skillResearch: boolean
  skillAutomation: boolean
  skillMemory: boolean
  skillRag: boolean
  skillWriting: boolean
  /** Show reasoning stream, expanded tool args/results, and activity affordances */
  showAgentTrace: boolean
  setModel: (model: string) => void
  setOllamaCloudToken: (token: string) => void
  setSupabaseUrl: (url: string) => void
  setSupabaseAnonKey: (key: string) => void
  setAutonomousMode: (enabled: boolean) => void
  setSkillResearch: (enabled: boolean) => void
  setSkillAutomation: (enabled: boolean) => void
  setSkillMemory: (enabled: boolean) => void
  setSkillRag: (enabled: boolean) => void
  setSkillWriting: (enabled: boolean) => void
  setShowAgentTrace: (enabled: boolean) => void
  load: () => Promise<void>
  save: () => Promise<void>
}

const DEFAULTS = {
  model: "glm-5.1",
  ollamaCloudToken: resolveOllamaCloudToken(undefined),
  supabaseUrl: DEFAULT_SUPABASE_URL,
  supabaseAnonKey: DEFAULT_SUPABASE_ANON_KEY,
  autonomousMode: false,
  skillResearch: true,
  skillAutomation: true,
  skillMemory: true,
  skillRag: true,
  skillWriting: true,
  showAgentTrace: true
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...DEFAULTS,

  setModel: (model) => set({ model }),
  setOllamaCloudToken: (ollamaCloudToken) => set({ ollamaCloudToken }),
  setSupabaseUrl: (supabaseUrl) => set({ supabaseUrl }),
  setSupabaseAnonKey: (supabaseAnonKey) => set({ supabaseAnonKey }),
  setAutonomousMode: (autonomousMode) => { set({ autonomousMode }); get().save() },
  setSkillResearch: (skillResearch) => { set({ skillResearch }); get().save() },
  setSkillAutomation: (skillAutomation) => { set({ skillAutomation }); get().save() },
  setSkillMemory: (skillMemory) => { set({ skillMemory }); get().save() },
  setSkillRag: (skillRag) => { set({ skillRag }); get().save() },
  setSkillWriting: (skillWriting) => { set({ skillWriting }); get().save() },
  setShowAgentTrace: (showAgentTrace) => { set({ showAgentTrace }); get().save() },

  load: async () => {
    const stored = await chrome.storage.local.get([
      "model",
      "ollamaCloudToken",
      "supabaseUrl",
      "supabaseAnonKey",
      "autonomousMode",
      "skillResearch",
      "skillAutomation",
      "skillMemory",
      "skillRag",
      "skillWriting",
      "showAgentTrace"
    ]) as {
      model?: string
      ollamaCloudToken?: string
      supabaseUrl?: string
      supabaseAnonKey?: string
      autonomousMode?: boolean
      skillResearch?: boolean
      skillAutomation?: boolean
      skillMemory?: boolean
      skillRag?: boolean
      skillWriting?: boolean
      showAgentTrace?: boolean
    }
    set({
      model: stored.model ?? DEFAULTS.model,
      ollamaCloudToken: resolveOllamaCloudToken(stored.ollamaCloudToken),
      supabaseUrl: stored.supabaseUrl ?? DEFAULTS.supabaseUrl,
      supabaseAnonKey: stored.supabaseAnonKey ?? DEFAULTS.supabaseAnonKey,
      autonomousMode: stored.autonomousMode ?? DEFAULTS.autonomousMode,
      skillResearch: stored.skillResearch ?? DEFAULTS.skillResearch,
      skillAutomation: stored.skillAutomation ?? DEFAULTS.skillAutomation,
      skillMemory: stored.skillMemory ?? DEFAULTS.skillMemory,
      skillRag: stored.skillRag ?? DEFAULTS.skillRag,
      skillWriting: stored.skillWriting ?? DEFAULTS.skillWriting,
      showAgentTrace: stored.showAgentTrace ?? DEFAULTS.showAgentTrace
    })
  },

  save: async () => {
    const {
      model,
      ollamaCloudToken,
      supabaseUrl,
      supabaseAnonKey,
      autonomousMode,
      skillResearch,
      skillAutomation,
      skillMemory,
      skillRag,
      skillWriting,
      showAgentTrace
    } = get()
    await chrome.storage.local.set({
      model,
      ollamaCloudToken,
      supabaseUrl,
      supabaseAnonKey,
      autonomousMode,
      skillResearch,
      skillAutomation,
      skillMemory,
      skillRag,
      skillWriting,
      showAgentTrace
    })
  }
}))
