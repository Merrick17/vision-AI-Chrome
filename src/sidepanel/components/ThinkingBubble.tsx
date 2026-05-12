import { motion } from "framer-motion"

type Props = {
  state: "thinking" | "acting" | "idle" | "done" | "error"
  /** Extra context, e.g. "Running browser tools…" */
  detail?: string
}

const STATE_LABELS: Record<string, string> = {
  thinking: "PLANNING",
  acting: "EXECUTING",
  idle: "",
  done: "",
  error: ""
}

const dots = [0, 1, 2]

export function ThinkingBubble({ state, detail }: Props) {
  if (state !== "thinking" && state !== "acting") return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="flex justify-start">
      <div className="flex max-w-[min(100%,22rem)] flex-col gap-0.5 border-l-2 border-primary/50 py-2 pl-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1">
            {dots.map((i) => (
              <motion.div
                key={i}
                className="h-1.5 w-1.5 bg-primary"
                style={{ boxShadow: "0 0 4px hsl(var(--primary) / 0.5)" }}
                animate={{
                  y: [0, -5, 0],
                  opacity: [0.3, 1, 0.3],
                  scale: [0.8, 1.1, 0.8]
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
          <span className="font-mono text-xs tracking-wider text-muted-foreground">
            {STATE_LABELS[state]}...
          </span>
        </div>
        {detail ? (
          <p className="pl-0.5 font-mono text-[10px] leading-snug text-muted-foreground/90">{detail}</p>
        ) : null}
      </div>
    </motion.div>
  )
}
