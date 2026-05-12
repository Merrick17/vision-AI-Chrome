import { navigationTools } from "./browser/navigation"
import { interactionTools } from "./browser/interaction"
import { extractionTools } from "./browser/extraction"
import { keyboardTools } from "./browser/keyboard"
import { memoryTools } from "./memory/index"
import { ragTools } from "./rag/index"

export const allTools = {
  ...navigationTools,
  ...interactionTools,
  ...extractionTools,
  ...keyboardTools,
  ...memoryTools,
  ...ragTools
}