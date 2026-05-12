import { OLLAMA_CLOUD_URL } from "~/store/settings"

const OLLAMA_EMBED_URL = "/api/embeddings"

export async function generateEmbedding(
  text: string,
  ollamaCloudToken: string,
  model: string = "nomic-embed-text"
): Promise<number[] | null> {
  try {
    const url = `${OLLAMA_CLOUD_URL}${OLLAMA_EMBED_URL}`
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (ollamaCloudToken) {
      headers["Authorization"] = `Bearer ${ollamaCloudToken}`
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ model, prompt: text })
    })

    if (!response.ok) {
      console.error("[vision:embedding] Ollama Cloud embed request failed:", response.status)
      return null
    }

    const data = await response.json()
    return data.embedding as number[]
  } catch (e) {
    console.error("[vision:embedding] Failed to generate embedding:", e)
    return null
  }
}