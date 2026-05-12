import { useState } from "react"
import { Check, Copy } from "lucide-react"

type Props = { content: string }

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group my-2">
      <div className="flex items-center justify-between rounded-t-lg border border-border bg-panel-muted/80 px-3 py-0.5 text-[10px] text-muted-foreground">
        {lang || "code"}
        <button
          onClick={handleCopy}
          className="text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Copy code">
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </button>
      </div>
      <pre className="overflow-x-auto rounded-b-lg border border-border border-t-0 bg-panel-muted/80 p-3 font-mono text-xs text-foreground">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-panel px-1.5 py-0.5 font-mono text-xs text-foreground">
      {children}
    </code>
  )
}

/**
 * Lightweight markdown renderer for chat messages.
 * Handles: code blocks, inline code, bold, italic, links, lists, headings, blockquotes, tables.
 * Avoids heavy dependencies like react-markdown/vfile that break Parcel bundling.
 */
export function MarkdownContent({ content }: Props) {
  const elements = parseMarkdown(content)
  return <div className="leading-relaxed">{elements}</div>
}

function parseMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n")
  const result: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Code blocks
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i])
        i++
      }
      i++ // skip closing ```
      result.push(<CodeBlock key={result.length} code={codeLines.join("\n")} lang={lang || undefined} />)
      continue
    }

    // Headings
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const content = parseInline(headingMatch[2], result.length)
      const Tag = `h${level}` as "h1" | "h2" | "h3"
      result.push(
        <Tag key={result.length} className="mb-1 mt-3 text-sm font-semibold text-foreground">
          {content}
        </Tag>
      )
      i++
      continue
    }

    // Blockquote
    if (line.startsWith("> ")) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(lines[i].slice(2))
        i++
      }
      result.push(
        <blockquote key={result.length} className="my-1 border-l-2 border-border pl-3 text-muted-foreground">
          {quoteLines.map((ql, qi) => (
            <p key={qi}>{parseInline(ql, result.length)}</p>
          ))}
        </blockquote>
      )
      continue
    }

    // Unordered list
    if (line.match(/^\s*[-*]\s+/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^\s*[-*]\s+/)) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""))
        i++
      }
      result.push(
        <ul key={result.length} className="list-disc pl-4 space-y-0.5 my-1">
          {items.map((item, ii) => (
            <li key={ii} className="text-sm">{parseInline(item, result.length)}</li>
          ))}
        </ul>
      )
      continue
    }

    // Ordered list
    if (line.match(/^\s*\d+\.\s+/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^\s*\d+\.\s+/)) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""))
        i++
      }
      result.push(
        <ol key={result.length} className="list-decimal pl-4 space-y-0.5 my-1">
          {items.map((item, ii) => (
            <li key={ii} className="text-sm">{parseInline(item, result.length)}</li>
          ))}
        </ol>
      )
      continue
    }

    // Horizontal rule
    if (line.match(/^---+$/)) {
      result.push(<hr key={result.length} className="my-2 border-border" />)
      i++
      continue
    }

    // Empty line
    if (line.trim() === "") {
      i++
      continue
    }

    // Paragraph — collect consecutive non-empty, non-special lines
    const paraLines: string[] = []
    while (i < lines.length && lines[i].trim() !== "" && !lines[i].startsWith("```") && !lines[i].match(/^#{1,3}\s/) && !lines[i].startsWith("> ") && !lines[i].match(/^\s*[-*]\s+/) && !lines[i].match(/^\s*\d+\.\s+/) && !lines[i].match(/^---+$/)) {
      paraLines.push(lines[i])
      i++
    }
    if (paraLines.length > 0) {
      result.push(
        <p key={result.length} className="mb-1 last:mb-0">
          {parseInline(paraLines.join(" "), result.length)}
        </p>
      )
    }
  }

  return result
}

function parseInline(text: string, keyBase: number): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  let remaining = text
  let inlineKey = 0

  while (remaining.length > 0) {
    // Inline code
    const codeMatch = remaining.match(/^(.*?)`([^`]+)`(.*)$/s)
    if (codeMatch && codeMatch[2]) {
      if (codeMatch[1]) nodes.push(...parseInlineSimple(codeMatch[1], keyBase * 100 + inlineKey++))
      nodes.push(<InlineCode key={keyBase * 100 + inlineKey++}>{codeMatch[2]}</InlineCode>)
      remaining = codeMatch[3]
      continue
    }

    // Links
    const linkMatch = remaining.match(/^(.*?)\[([^\]]+)\]\(([^)]+)\)(.*)$/s)
    if (linkMatch) {
      if (linkMatch[1]) nodes.push(...parseInlineSimple(linkMatch[1], keyBase * 100 + inlineKey++))
      nodes.push(
        <a key={keyBase * 100 + inlineKey++} href={linkMatch[3]} target="_blank" rel="noopener noreferrer" className="text-secondary underline hover:text-primary">
          {linkMatch[2]}
        </a>
      )
      remaining = linkMatch[4]
      continue
    }

    // No more matches, parse the rest as inline simple
    nodes.push(...parseInlineSimple(remaining, keyBase * 100 + inlineKey++))
    break
  }

  return nodes
}

function parseInlineSimple(text: string, keyBase: number): React.ReactNode[] {
  if (!text) return []

  const nodes: React.ReactNode[] = []
  // Split on bold (**text**) and italic (*text*) patterns
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (!part) continue

    const boldMatch = part.match(/^\*\*(.+)\*\*$/)
    if (boldMatch) {
      nodes.push(<strong key={keyBase + i} className="font-semibold text-foreground">{boldMatch[1]}</strong>)
      continue
    }

    const italicMatch = part.match(/^\*([^*]+)\*$/)
    if (italicMatch) {
      nodes.push(<em key={keyBase + i} className="italic text-muted-foreground">{italicMatch[1]}</em>)
      continue
    }

    nodes.push(part)
  }

  return nodes.length > 0 ? nodes : [text]
}