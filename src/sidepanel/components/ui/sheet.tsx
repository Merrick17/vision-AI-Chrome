import * as React from "react"
import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"

type SheetContextValue = { open: boolean; setOpen: (v: boolean) => void }
const SheetContext = React.createContext<SheetContextValue>({ open: false, setOpen: () => {} })

export function Sheet({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <SheetContext.Provider value={{ open, setOpen }}>
      {children}
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </SheetContext.Provider>
  )
}

export function SheetTrigger({ children }: { children: React.ReactElement }) {
  const { setOpen } = React.useContext(SheetContext)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return React.cloneElement(children as React.ReactElement<any>, {
    onClick: () => setOpen(true),
  })
}

export function SheetContent({
  children,
  side = "right",
  className = ""
}: {
  children: React.ReactNode
  side?: "left" | "right"
  className?: string
}) {
  const { open, setOpen } = React.useContext(SheetContext)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="sheet"
          initial={{ x: side === "right" ? "100%" : "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: side === "right" ? "100%" : "-100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`fixed top-0 ${side === "right" ? "right-0" : "left-0"} z-50 h-full overflow-hidden shadow-xl ${className}`}
          onClick={(e) => e.stopPropagation()}>
          <button
            className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-100 z-10"
            onClick={() => setOpen(false)}>
            <X className="h-4 w-4" />
          </button>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function SheetHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex flex-col space-y-1 ${className}`}>{children}</div>
}

export function SheetTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-lg font-semibold ${className}`}>{children}</h2>
}