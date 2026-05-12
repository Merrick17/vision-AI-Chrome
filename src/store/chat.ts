import { create } from "zustand"
import type { AgentState, Message, ToolCall, Conversation } from "~/types"

const STORAGE_KEY = "vision:conversations"

export type ChatStore = {
  messages: Message[]
  agentState: AgentState
  streamingId: string | null
  conversations: Conversation[]
  currentConversationId: string | null

  addMessage: (msg: Message) => void
  appendStreamChunk: (id: string, delta: string) => void
  appendReasoningChunk: (id: string, delta: string) => void
  finalizeStream: (id: string) => void
  addToolCall: (messageId: string, call: ToolCall) => void
  updateToolCall: (call: ToolCall) => void
  setAgentState: (state: AgentState) => void
  clearHistory: () => void

  loadConversations: () => Promise<void>
  saveCurrentConversation: () => Promise<void>
  loadConversation: (id: string) => void
  startNewConversation: () => void
  deleteConversation: (id: string) => Promise<void>
}

function generateTitle(messages: Message[]): string {
  const first = messages.find((m) => m.role === "user")
  if (!first) return "New conversation"
  return first.content.slice(0, 40) + (first.content.length > 40 ? "..." : "")
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  agentState: "idle",
  streamingId: null,
  conversations: [],
  currentConversationId: null,

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),

  appendStreamChunk: (id, delta) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, content: m.content + delta, streaming: true } : m
      )
    })),

  appendReasoningChunk: (id, delta) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id
          ? { ...m, reasoning: (m.reasoning ?? "") + delta, streaming: true }
          : m
      )
    })),

  finalizeStream: (id) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, streaming: false } : m
      ),
      streamingId: null,
      agentState: "idle"
    })),

  addToolCall: (messageId, call) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === messageId
          ? { ...m, toolCalls: [...(m.toolCalls ?? []), call] }
          : m
      )
    })),

  updateToolCall: (call) =>
    set((s) => ({
      messages: s.messages.map((m) => {
        if (!m.toolCalls?.length) return m
        return {
          ...m,
          toolCalls: m.toolCalls.map((tc) => (tc.id === call.id ? call : tc))
        }
      })
    })),

  setAgentState: (agentState) => set({ agentState }),

  clearHistory: () => set({ messages: [], agentState: "idle", streamingId: null }),

  loadConversations: async () => {
    const stored = await chrome.storage.local.get(STORAGE_KEY)
    const conversations: Conversation[] = (stored[STORAGE_KEY] as Conversation[]) ?? []
    set({ conversations })
  },

  saveCurrentConversation: async () => {
    const { messages, currentConversationId, conversations } = get()
    if (messages.length === 0) return

    const now = Date.now()
    const id = currentConversationId ?? `conv_${now}`
    const title = generateTitle(messages)
    const conversation: Conversation = {
      id,
      title,
      messages: messages.map((m) => ({ ...m, streaming: false })),
      createdAt: currentConversationId
        ? conversations.find((c) => c.id === id)?.createdAt ?? now
        : now,
      updatedAt: now
    }

    const updated = currentConversationId
      ? conversations.map((c) => (c.id === id ? conversation : c))
      : [...conversations, conversation]

    set({ conversations: updated, currentConversationId: id })
    await chrome.storage.local.set({ [STORAGE_KEY]: updated })
  },

  loadConversation: (id) => {
    const conversation = get().conversations.find((c) => c.id === id)
    if (conversation) {
      set({
        messages: conversation.messages,
        currentConversationId: id,
        agentState: "idle",
        streamingId: null
      })
    }
  },

  startNewConversation: () => {
    set({ messages: [], currentConversationId: null, agentState: "idle", streamingId: null })
  },

  deleteConversation: async (id) => {
    const updated = get().conversations.filter((c) => c.id !== id)
    set((s) => ({
      conversations: updated,
      currentConversationId: s.currentConversationId === id ? null : s.currentConversationId
    }))
    await chrome.storage.local.set({ [STORAGE_KEY]: updated })
  }
}))