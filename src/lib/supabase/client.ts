import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let client: SupabaseClient | null = null
let cachedUrl: string | null = null

export function getSupabaseClient(url?: string, anonKey?: string): SupabaseClient | null {
  if (!url || !anonKey) {
    return client
  }

  if (!client || cachedUrl !== url) {
    try {
      client = createClient(url, anonKey)
      cachedUrl = url
    } catch (e) {
      console.error("[vision:supabase] Failed to create client:", e)
      client = null
      cachedUrl = null
    }
  }

  return client
}

export function resetSupabaseClient() {
  client = null
  cachedUrl = null
}