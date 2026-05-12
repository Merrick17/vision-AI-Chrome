import { create } from "zustand"
import type { PendingConfirmation, ConfirmationStatus } from "~/types"

const SENSITIVE_PATTERNS = [
  /purchase/i,
  /buy/i,
  /pay/i,
  /checkout/i,
  /order/i,
  /delete/i,
  /remove/i,
  /send/i,
  /transfer/i,
  /withdraw/i,
  /deposit/i,
  /confirm/i,
  /submit.*form/i,
  /account/i,
  /password/i,
  /settings/i,
]

type PermissionStore = {
  pendingConfirmations: PendingConfirmation[]
  addConfirmation: (confirmation: Omit<PendingConfirmation, "status" | "createdAt">) => string
  approve: (id: string) => Promise<void>
  deny: (id: string) => Promise<void>
  remove: (id: string) => void
  isSensitive: (toolName: string) => boolean
}

export const usePermissionStore = create<PermissionStore>((set) => ({
  pendingConfirmations: [],

  addConfirmation: (confirmation) => {
    const id = confirmation.id
    set((state) => ({
      pendingConfirmations: [
        ...state.pendingConfirmations,
        { ...confirmation, status: "pending" as ConfirmationStatus, createdAt: Date.now() }
      ]
    }))
    return id
  },

  approve: async (id) => {
    set((state) => ({
      pendingConfirmations: state.pendingConfirmations.map((c) =>
        c.id === id ? { ...c, status: "approved" as ConfirmationStatus } : c
      )
    }))
    await chrome.runtime.sendMessage({
      name: "resolveConfirmation",
      body: { confirmationId: id, approved: true }
    })
    setTimeout(() => {
      set((state) => ({
        pendingConfirmations: state.pendingConfirmations.filter((c) => c.id !== id)
      }))
    }, 250)
  },

  deny: async (id) => {
    set((state) => ({
      pendingConfirmations: state.pendingConfirmations.map((c) =>
        c.id === id ? { ...c, status: "denied" as ConfirmationStatus } : c
      )
    }))
    await chrome.runtime.sendMessage({
      name: "resolveConfirmation",
      body: { confirmationId: id, approved: false }
    })
    setTimeout(() => {
      set((state) => ({
        pendingConfirmations: state.pendingConfirmations.filter((c) => c.id !== id)
      }))
    }, 250)
  },

  remove: (id) => {
    set((state) => ({
      pendingConfirmations: state.pendingConfirmations.filter((c) => c.id !== id)
    }))
  },

  isSensitive: (toolName: string) => {
    return SENSITIVE_PATTERNS.some((pattern) => pattern.test(toolName))
  }
}))