import { AlertTriangle } from "lucide-react"
import { SettingsSheet } from "~/sidepanel/components/SettingsSheet"
import { Button } from "~/sidepanel/components/ui/button"
import { useSettingsStore } from "~/store/settings"

/**
 * Shown when the user has not configured an Ollama Cloud API key (required for the agent).
 */
export function SetupBanner() {
  const ollamaCloudToken = useSettingsStore((s) => s.ollamaCloudToken)

  if (ollamaCloudToken?.trim()) return null

  return (
    <div className="relative z-20 flex items-center gap-2 border-b border-amber-500/35 bg-amber-950/40 px-3 py-2 text-amber-100 backdrop-blur-sm">
      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" aria-hidden />
      <p className="min-w-0 flex-1 font-mono text-[10px] leading-snug tracking-wide">
        Add an <span className="text-amber-200">Ollama Cloud API key</span> in Settings, or define{" "}
        <code className="text-amber-200/90">PLASMO_PUBLIC_OLLAMA_CLOUD_TOKEN</code> in <code className="text-amber-200/90">.env</code>{" "}
        and rebuild.
      </p>
      <SettingsSheet>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 shrink-0 rounded-md border-amber-500/50 bg-amber-900/30 px-2 font-mono text-[10px] text-amber-100 hover:bg-amber-800/40">
          Open settings
        </Button>
      </SettingsSheet>
    </div>
  )
}
