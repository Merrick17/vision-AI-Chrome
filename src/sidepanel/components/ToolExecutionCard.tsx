import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight } from "lucide-react"
import type { ToolCall } from "~/types"

type Props = {
  call: ToolCall
  /** When true, args/result panel starts open (e.g. while the assistant message is streaming) */
  defaultExpanded?: boolean
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: string }> = {
  running: { bg: "bg-muted text-muted-foreground border border-border", text: "running", icon: "⟳" },
  done: { bg: "bg-success/15 text-success border border-success/35", text: "done", icon: "✓" },
  error: { bg: "bg-destructive/15 text-destructive-foreground border border-destructive/35", text: "error", icon: "✗" }
}

export function ToolExecutionCard({ call, defaultExpanded = false }: Props) {
  const [expanded, setExpanded] = useState(() => defaultExpanded || call.status === "running")
  const config = STATUS_CONFIG[call.status] ?? STATUS_CONFIG.running

  useEffect(() => {
    if (call.status === "error") setExpanded(true)
  }, [call.status])

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden">
      <div className="rounded-lg border border-border/70 bg-panel-muted/40 px-2.5 py-1.5 text-xs">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between gap-2 w-full text-left">
          <div className="flex items-center gap-1.5 min-w-0">
            <motion.div
              animate={{ rotate: expanded ? 90 : 0 }}
              transition={{ duration: 0.15 }}
              className="shrink-0">
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            </motion.div>
            <span className="font-mono text-foreground truncate">{call.name}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {call.duration != null && (
              <span className="text-muted-foreground">{call.duration}ms</span>
            )}
            <motion.span
              key={call.status}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className={`px-1.5 py-0.5 rounded-full font-medium ${config.bg}`}>
              {call.status === "running" ? (
                <span className="inline-block animate-spin">{config.icon}</span>
              ) : (
                config.icon
              )}{" "}
              {config.text}
            </motion.span>
          </div>
        </button>

        {call.error && (
          <p className="mt-1.5 pl-4 text-[10px] text-destructive-foreground">{call.error}</p>
        )}

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden">
              <div className="mt-1.5 space-y-1.5 pl-4">
                <div>
                  <p className="mb-0.5 text-[10px] text-muted-foreground">Arguments</p>
                  <pre className="overflow-x-auto rounded border border-border bg-panel p-2 font-mono text-[10px] text-foreground">
                    {call.args !== undefined && call.args !== null && !(typeof call.args === "object" && Object.keys(call.args as object).length === 0)
                      ? JSON.stringify(call.args, null, 2)
                      : "(none — empty or not yet streamed)"}
                  </pre>
                </div>
                {call.result !== undefined && call.result !== null && (
                  <div>
                    <p className="mb-0.5 text-[10px] text-muted-foreground">Result</p>
                    <pre className="overflow-x-auto rounded border border-border bg-panel p-2 font-mono text-[10px] text-foreground">
                      {typeof call.result === "string" ? call.result : JSON.stringify(call.result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}