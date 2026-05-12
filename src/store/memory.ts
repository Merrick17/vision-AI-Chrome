import { create } from "zustand"
import type { MemoryEntry } from "~/types"

type MemoryStore = {
  sessionMemory: MemoryEntry[]
  persistentMemory: MemoryEntry[]

  remember: (key: string, value: string) => void
  recall: (key: string) => string | undefined
  forget: (key: string) => void
  listSession: () => MemoryEntry[]
  loadPersistent: () => Promise<void>
  savePersistent: () => Promise<void>
}

const PERSISTENT_KEY = "vision:memory"

function simpleId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export const useMemoryStore = create<MemoryStore>((set, get) => ({
  sessionMemory: [],
  persistentMemory: [],

  remember: (key, value) => {
    set((s) => {
      const existing = s.sessionMemory.findIndex((m) => m.key === key)
      if (existing >= 0) {
        const updated = [...s.sessionMemory]
        updated[existing] = { ...updated[existing], value, createdAt: Date.now() }
        return { sessionMemory: updated }
      }
      return { sessionMemory: [...s.sessionMemory, { id: simpleId(), key, value, createdAt: Date.now() }] }
    })
  },

  recall: (key) => {
    const { sessionMemory, persistentMemory } = get()
    const fromSession = sessionMemory.find((m) => m.key === key)
    if (fromSession) return fromSession.value
    const fromPersistent = persistentMemory.find((m) => m.key === key)
    return fromPersistent?.value
  },

  forget: (key) => {
    set((s) => ({
      sessionMemory: s.sessionMemory.filter((m) => m.key !== key),
      persistentMemory: s.persistentMemory.filter((m) => m.key !== key)
    }))
  },

  listSession: () => get().sessionMemory,

  loadPersistent: async () => {
    const stored = await chrome.storage.local.get(PERSISTENT_KEY)
    const persistentMemory: MemoryEntry[] = (stored[PERSISTENT_KEY] as MemoryEntry[]) ?? []
    set({ persistentMemory })
  },

  savePersistent: async () => {
    const { persistentMemory } = get()
    await chrome.storage.local.set({ [PERSISTENT_KEY]: persistentMemory })
  }
}))