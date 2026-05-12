/**
 * Resolves the Ollama Cloud API token: saved Settings value wins, otherwise build-time env.
 *
 * **Plasmo requirement:** use a **direct** `process.env.PLASMO_PUBLIC_*` read below so the
 * bundler can replace it at build time. Dynamic lookups (e.g. `globalThis.process.env[key]`)
 * are NOT inlined — the token would always be empty in the extension.
 *
 * In `.env` (repo root, for `pnpm dev` / `plasmo dev`):
 *
 *   PLASMO_PUBLIC_OLLAMA_CLOUD_TOKEN=your_key_here
 *
 * Restart the dev server after changing `.env`. For store builds, prefer Settings (local only).
 */
export function resolveOllamaCloudToken(storedValue: string | undefined | null): string {
  const fromStorage = typeof storedValue === "string" ? storedValue.trim() : ""
  if (fromStorage.length > 0) return fromStorage

  const fromEnv = process.env.PLASMO_PUBLIC_OLLAMA_CLOUD_TOKEN?.trim() ?? ""
  return fromEnv
}
