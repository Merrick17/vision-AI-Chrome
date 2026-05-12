import { tool } from "ai"
import { z } from "~/lib/zod"
import { getSupabaseClient } from "~/lib/supabase/client"
import { generateEmbedding } from "~/lib/supabase/embedding"
import { chunkDocument } from "~/lib/supabase/chunker"
import { logVisionError } from "~/lib/log"
import { resolveOllamaCloudToken } from "~/lib/ollama-token"

async function getSettings() {
  const stored = await chrome.storage.local.get(["ollamaCloudToken", "supabaseUrl", "supabaseAnonKey"])
  return {
    ollamaCloudToken: resolveOllamaCloudToken(stored.ollamaCloudToken as string | undefined),
    supabaseUrl: (stored.supabaseUrl as string) ?? "",
    supabaseAnonKey: (stored.supabaseAnonKey as string) ?? ""
  }
}

export const ragTools = {
  rag_search: tool({
    description: "Searches the knowledge base for relevant information using semantic similarity. Use this when you need to recall previously indexed content or find information related to a topic.",
    inputSchema: z.object({
      query: z.string().describe("The search query to find relevant information"),
      top_k: z.number().default(5).describe("Number of results to return")
    }),
    execute: async ({ query, top_k }) => {
      const settings = await getSettings()
      const supabase = getSupabaseClient(settings.supabaseUrl, settings.supabaseAnonKey)

      if (!supabase) {
        return { success: false, error: "Supabase is not configured. Set up Supabase URL and anon key in settings." }
      }

      const embedding = await generateEmbedding(query, settings.ollamaCloudToken)
      if (!embedding) {
        return { success: false, error: "Failed to generate embedding. Check your Ollama Cloud token." }
      }

      try {
        const { data, error } = await supabase.rpc("match_documents", {
          query_embedding: embedding,
          match_count: top_k
        })

        if (error) {
          logVisionError("rag_search", error)
          return { success: false, error: `Search failed: ${error.message}` }
        }

        const results = (data as Array<{ content: string; url: string; title: string; similarity: number }>).map(
          (row) => ({
            content: row.content,
            url: row.url,
            title: row.title,
            similarity: row.similarity
          })
        )

        return { success: true, results }
      } catch (e) {
        return { success: false, error: String(e) }
      }
    }
  }),

  rag_index_page: tool({
    description: "Indexes the current page content into the knowledge base for later retrieval. Chunks the content, generates embeddings, and stores in Supabase.",
    inputSchema: z.object({
      url: z.string().describe("The URL of the page to index"),
      title: z.string().describe("The title of the page"),
      content: z.string().describe("The main text content of the page")
    }),
    execute: async ({ url, title, content }) => {
      const settings = await getSettings()
      const supabase = getSupabaseClient(settings.supabaseUrl, settings.supabaseAnonKey)

      if (!supabase) {
        return { success: false, error: "Supabase is not configured. Set up Supabase URL and anon key in settings." }
      }

      const chunks = chunkDocument(content)
      if (chunks.length === 0) {
        return { success: false, error: "No content to index after chunking." }
      }

      const rows = []

      for (let i = 0; i < chunks.length; i++) {
        const embedding = await generateEmbedding(chunks[i], settings.ollamaCloudToken)
        rows.push({
          url,
          title,
          chunk_index: i,
          content: chunks[i],
          embedding
        })
      }

      try {
        const { error } = await supabase
          .from("documents")
          .upsert(rows, { onConflict: "url,chunk_index" })

        if (error) {
          logVisionError("rag_index_page", error)
          return { success: false, error: `Indexing failed: ${error.message}` }
        }

        return { success: true, chunks_indexed: rows.length }
      } catch (e) {
        return { success: false, error: String(e) }
      }
    }
  })
}