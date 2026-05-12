import type { PlasmoMessaging } from "@plasmohq/messaging"
import { resolveOllamaCloudToken } from "~/lib/ollama-token"

const handler: PlasmoMessaging.MessageHandler = async (_req, res) => {
  const stored = await chrome.storage.local.get(["model", "ollamaCloudToken"])
  res.send({
    model: stored.model ?? "glm-5.1",
    ollamaCloudToken: resolveOllamaCloudToken(
      typeof stored.ollamaCloudToken === "string" ? stored.ollamaCloudToken : undefined
    )
  })
}

export default handler
