import type { PlasmoMessaging } from "@plasmohq/messaging"
import { resolveOllamaCloudToken } from "~/lib/ollama-token"
import { getSupabaseClient } from "~/lib/supabase/client"
import { generateEmbedding } from "~/lib/supabase/embedding"
import { chunkDocument } from "~/lib/supabase/chunker"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const { url, title, content } = req.body as { url: string; title: string; content: string }

  try {
    const stored = await chrome.storage.local.get(["ollamaCloudToken", "supabaseUrl", "supabaseAnonKey"]) as {
      ollamaCloudToken?: string; supabaseUrl?: string; supabaseAnonKey?: string
    }
    const supabase = getSupabaseClient(stored.supabaseUrl, stored.supabaseAnonKey)

    if (!supabase) {
      res.send({ success: false, error: "Supabase not configured" })
      return
    }

    const chunks = chunkDocument(content)
    if (chunks.length === 0) {
      res.send({ success: false, error: "No content to index" })
      return
    }

    const ollamaToken = resolveOllamaCloudToken(stored.ollamaCloudToken)
    const rows = []
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i], ollamaToken)
      rows.push({
        url,
        title,
        chunk_index: i,
        content: chunks[i],
        embedding
      })
    }

    const { error } = await supabase
      .from("documents")
      .upsert(rows, { onConflict: "url,chunk_index" })

    if (error) {
      res.send({ success: false, error: error.message })
      return
    }

    res.send({ success: true, chunks_indexed: rows.length })
  } catch (e) {
    res.send({ success: false, error: String(e) })
  }
}

export default handler