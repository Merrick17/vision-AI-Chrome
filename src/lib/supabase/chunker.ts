const MAX_CHUNK_CHARS = 2048
const MIN_CHUNK_CHARS = 100

export function chunkDocument(content: string, maxChars: number = MAX_CHUNK_CHARS): string[] {
  if (!content || content.trim().length === 0) return []

  const paragraphs = content.split(/\n{2,}/).filter((p) => p.trim().length > 0)

  const chunks: string[] = []
  let currentChunk = ""

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim()

    if (currentChunk.length + trimmed.length + 1 > maxChars && currentChunk.length >= MIN_CHUNK_CHARS) {
      chunks.push(currentChunk.trim())
      currentChunk = trimmed
    } else {
      currentChunk = currentChunk ? `${currentChunk}\n\n${trimmed}` : trimmed
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}