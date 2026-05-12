import { tool } from "ai"
import { z } from "~/lib/zod"
import type { MemoryEntry } from "~/types"

const STORAGE_KEY = "vision:memory"

async function readMemory(): Promise<MemoryEntry[]> {
  const stored = await chrome.storage.local.get(STORAGE_KEY)
  return (stored[STORAGE_KEY] as MemoryEntry[]) ?? []
}

async function writeMemory(entries: MemoryEntry[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: entries })
}

function simpleId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export const memoryTools = {
  memory_remember: tool({
    description: "Store a key-value fact in persistent memory. Use this to remember user preferences, important context, or instructions across conversations.",
    inputSchema: z.object({
      key: z.string().describe("A short label for the fact, e.g. 'user_name' or 'preferred_language'"),
      value: z.string().describe("The fact or value to remember")
    }),
    execute: async ({ key, value }) => {
      try {
        const entries = await readMemory()
        const existing = entries.findIndex((m) => m.key === key)
        if (existing >= 0) {
          entries[existing] = { ...entries[existing], value, createdAt: Date.now() }
        } else {
          entries.push({ id: simpleId(), key, value, createdAt: Date.now() })
        }
        await writeMemory(entries)
        return { success: true, message: `Remembered: ${key} = ${value}` }
      } catch (e) {
        return { success: false, error: String(e) }
      }
    }
  }),

  memory_recall: tool({
    description: "Recall a previously stored fact from persistent memory by key. Returns the stored value.",
    inputSchema: z.object({
      key: z.string().describe("The key of the fact to recall")
    }),
    execute: async ({ key }) => {
      try {
        const entries = await readMemory()
        const entry = entries.find((m) => m.key === key)
        if (entry) {
          return { success: true, key, value: entry.value }
        }
        return { success: false, message: `No memory found for key: ${key}` }
      } catch (e) {
        return { success: false, error: String(e) }
      }
    }
  }),

  memory_forget: tool({
    description: "Remove a previously stored fact from persistent memory",
    inputSchema: z.object({
      key: z.string().describe("The key of the fact to forget")
    }),
    execute: async ({ key }) => {
      try {
        const entries = await readMemory()
        const filtered = entries.filter((m) => m.key !== key)
        await writeMemory(filtered)
        if (filtered.length < entries.length) {
          return { success: true, message: `Forgot: ${key}` }
        }
        return { success: false, message: `No memory found for key: ${key}` }
      } catch (e) {
        return { success: false, error: String(e) }
      }
    }
  })
}