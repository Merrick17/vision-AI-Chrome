import { tool } from "ai"
import { z } from "~/lib/zod"
import { sendToContentScript } from "@plasmohq/messaging"

type ContentResponse = { success: boolean; error?: string }

export const interactionTools = {
  click_element: tool({
    description: "Clicks an interactive element on a page by its semantic ID (e.g. el_1). Defaults to active tab.",
    inputSchema: z.object({ id: z.string(), tabId: z.number().optional() }),
    execute: async ({ id, tabId }) => {
      try {
        const result = await sendToContentScript<{ id: string }, ContentResponse>({
          name: "clickElement",
          body: { id },
          tabId
        })
        return result
      } catch (e) {
        return { success: false, error: String(e) }
      }
    }
  }),

  type_text: tool({
    description:
      "Types text into a field on the page: HTML textarea/text inputs, or rich editors (contenteditable / role=textbox). Defaults to active tab. Re-run extract_page after opening modals so the target id exists.",
    inputSchema: z.object({ id: z.string(), text: z.string(), tabId: z.number().optional() }),
    execute: async ({ id, text, tabId }) => {
      try {
        const result = await sendToContentScript<{ id: string; text: string }, ContentResponse>({
          name: "typeText",
          body: { id, text },
          tabId
        })
        return result
      } catch (e) {
        return { success: false, error: String(e) }
      }
    }
  }),

  select_option: tool({
    description: "Selects an option in a dropdown/select element on a page. Defaults to active tab.",
    inputSchema: z.object({ id: z.string(), value: z.string(), tabId: z.number().optional() }),
    execute: async ({ id, value, tabId }) => {
      try {
        const result = await sendToContentScript<{ id: string; value: string }, ContentResponse>({
          name: "selectOption",
          body: { id, value },
          tabId
        })
        return result
      } catch (e) {
        return { success: false, error: String(e) }
      }
    }
  }),

  scroll_page: tool({
    description: "Scrolls a page in a direction by a number of pixels. Defaults to active tab.",
    inputSchema: z.object({
      direction: z.enum(["up", "down"]),
      amount: z.number().default(400),
      tabId: z.number().optional()
    }),
    execute: async ({ direction, amount, tabId }) => {
      try {
        const result = await sendToContentScript<{ direction: "up" | "down"; amount: number }, ContentResponse>({
          name: "scrollPage",
          body: { direction, amount },
          tabId
        })
        return result
      } catch (e) {
        return { success: false, error: String(e) }
      }
    }
  })
}
