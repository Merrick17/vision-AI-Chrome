import { tool } from "ai"
import { z } from "~/lib/zod"
import { sendToContentScript } from "@plasmohq/messaging"
import type { PageContext } from "~/types"

type PageContextResponse = { success: true; context: PageContext } | { success: false; error: string }
type LinksResponse = { success: true; links: { id: string; text: string; href: string }[] } | { success: false; error: string }

async function getPageContext(tabId?: number): Promise<PageContextResponse> {
  try {
    return await sendToContentScript<undefined, PageContextResponse>({ name: "getPageContext", tabId })
  } catch {
    return { success: false, error: "Content script not available on this page" }
  }
}

async function getLinks(tabId?: number): Promise<LinksResponse> {
  try {
    return await sendToContentScript<undefined, LinksResponse>({ name: "extractLinks", tabId })
  } catch {
    return { success: false, error: "Content script not available on this page" }
  }
}

export const extractionTools = {
  extract_page: tool({
    description: "Extracts structured context from a page including interactive elements, forms, and main content. Defaults to active tab.",
    inputSchema: z.object({ tabId: z.number().optional() }),
    execute: async ({ tabId }) => {
      const result = await getPageContext(tabId)
      return result
    }
  }),

  summarize_page: tool({
    description: "Returns a brief summary of a page (url, title, and main text content only). Defaults to active tab.",
    inputSchema: z.object({ tabId: z.number().optional() }),
    execute: async ({ tabId }) => {
      const result = await getPageContext(tabId)
      if (!result.success) return result
      const { url, title, mainContent } = result.context
      return { success: true, result: { url, title, mainContent } }
    }
  }),

  extract_links: tool({
    description: "Extracts all visible links on a page with their text and URLs. Defaults to active tab.",
    inputSchema: z.object({ tabId: z.number().optional() }),
    execute: async ({ tabId }) => {
      const result = await getLinks(tabId)
      return result
    }
  })
}
