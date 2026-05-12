import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"

type Toast = { id: string; message: string; type: "default" | "error" | "success" }

let listeners: ((toasts: Toast[]) => void)[] = []
let toasts: Toast[] = []

function notify(toast: Omit<Toast, "id">) {
  const newToast = { ...toast, id: Math.random().toString(36).slice(2) }
  toasts = [...toasts, newToast]
  listeners.forEach((l) => l(toasts))
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== newToast.id)
    listeners.forEach((l) => l(toasts))
  }, 4000)
}

export const toast = {
  error: (message: string) => notify({ message, type: "error" }),
  success: (message: string) => notify({ message, type: "success" }),
  message: (message: string) => notify({ message, type: "default" })
}

export function Toaster() {
  const [activeToasts, setActiveToasts] = useState<Toast[]>([])

  useEffect(() => {
    listeners.push(setActiveToasts)
    return () => {
      listeners = listeners.filter((l) => l !== setActiveToasts)
    }
  }, [])

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[calc(100%-24px)]">
      <AnimatePresence>
        {activeToasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className={`rounded-lg px-3 py-2 text-xs font-medium shadow-lg ${
              t.type === "error"
                ? "bg-red-800/90 text-red-100"
                : t.type === "success"
                ? "bg-emerald-800/90 text-emerald-100"
                : "bg-zinc-700 text-zinc-100"
            }`}>
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}