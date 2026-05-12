/**
 * Centralized error logging for the extension. Prefer this over ad-hoc console.error
 * so we can change policy (e.g. remote logging) in one place later.
 */
export function logVisionError(scope: string, error: unknown, extra?: Record<string, unknown>): void {
  if (extra && Object.keys(extra).length > 0) {
    console.error(`[vision:${scope}]`, error, extra)
  } else {
    console.error(`[vision:${scope}]`, error)
  }
}
