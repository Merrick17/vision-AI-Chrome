import { motion } from "framer-motion"
import { ShieldAlert } from "lucide-react"
import { usePermissionStore } from "~/store/permissions"

type Props = {
  id: string
  toolName: string
  description: string
  riskReason?: string
  args: Record<string, unknown>
}

export function ConfirmationDialog({ id, toolName, description, riskReason, args }: Props) {
  const approve = usePermissionStore((s) => s.approve)
  const deny = usePermissionStore((s) => s.deny)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 8 }}
      transition={{ duration: 0.15 }}
      className="mx-3 my-2 space-y-2.5 rounded-lg border border-warning/45 bg-warning/8 p-3"
      style={{ boxShadow: "0 0 16px hsl(var(--warning) / 0.08)" }}>
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-warning" aria-hidden />
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-warning">
          Confirmation Required
        </span>
      </div>

      <p className="font-mono text-[11px] leading-relaxed text-foreground/90">{description}</p>
      {riskReason && (
        <p className="rounded border border-warning/25 bg-warning/10 px-2 py-1 font-mono text-[10px] leading-snug text-warning">
          {riskReason}
        </p>
      )}

      <div className="space-y-0.5 rounded border border-border/60 bg-panel p-2 font-mono text-[10px] text-foreground">
        <div className="flex gap-1.5">
          <span className="shrink-0 text-muted-foreground">tool:</span>
          <span className="text-secondary">{toolName}</span>
        </div>
        {Object.entries(args).map(([key, value]) => (
          <div key={key} className="flex gap-1.5">
            <span className="shrink-0 text-muted-foreground">{key}:</span>
            <span className="truncate text-foreground/80">{String(value).slice(0, 120)}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => { void deny(id) }}
          className="flex-1 rounded-md border border-border/70 bg-panel px-3 py-1.5 font-mono text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          Deny
        </button>
        <button
          onClick={() => { void approve(id) }}
          className="flex-1 rounded-md border border-warning/50 bg-warning/15 px-3 py-1.5 font-mono text-[11px] font-medium text-warning transition-colors hover:bg-warning/25 hover:border-warning/70">
          Allow
        </button>
      </div>
    </motion.div>
  )
}