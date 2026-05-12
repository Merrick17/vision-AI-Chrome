import { tool } from "ai"
import { z } from "~/lib/zod"
import { sendToContentScript } from "@plasmohq/messaging"

type ContentResponse = { success: boolean; error?: string }
type ValueResponse = { success: boolean; value?: string; error?: string }
type WaitResponse = { success: boolean; found?: boolean; timedOut?: boolean; error?: string }

export const keyboardTools = {
  press_key: tool({
    description:
      "Sends a keyboard key event to an element or the focused document. Use for: Tab (next field), Enter (submit/confirm), Escape (close modal/dropdown), ArrowDown/ArrowUp (navigate lists), Space (toggle checkboxes/buttons), Backspace (clear field). Always call extract_page first so you have the element IDs.",
    inputSchema: z.object({
      key: z.string().describe(
        "Key name: Enter, Tab, Escape, ArrowDown, ArrowUp, ArrowLeft, ArrowRight, Space, Backspace, Delete, Home, End"
      ),
      id: z.string().optional().describe(
        "Target element semantic ID (el_N). If omitted, the event goes to the currently focused element."
      ),
      tabId: z.number().optional()
    }),
    execute: async ({ key, id, tabId }) => {
      try {
        const result = await sendToContentScript<{ key: string; id?: string }, ContentResponse>({
          name: "pressKey",
          body: { key, id },
          tabId
        })
        return result
      } catch (e) {
        return { success: false, error: String(e) }
      }
    }
  }),

  hover_element: tool({
    description:
      "Dispatches mouseenter, mouseover, and focus events on an element to reveal hover-only menus, tooltips, or dropdown triggers. Call this before trying to click items inside a hover-revealed container, then call extract_page again to get the newly visible element IDs.",
    inputSchema: z.object({
      id: z.string(),
      tabId: z.number().optional()
    }),
    execute: async ({ id, tabId }) => {
      try {
        const result = await sendToContentScript<{ id: string }, ContentResponse>({
          name: "hoverElement",
          body: { id },
          tabId
        })
        return result
      } catch (e) {
        return { success: false, error: String(e) }
      }
    }
  }),

  get_element_value: tool({
    description:
      "Returns the current value of an input, textarea, or select element by its semantic ID. Use to check what is already typed in a field before overwriting, or to read the selected option in a dropdown. Works on text inputs, passwords (masked), textareas, selects, and contenteditable editors.",
    inputSchema: z.object({
      id: z.string(),
      tabId: z.number().optional()
    }),
    execute: async ({ id, tabId }) => {
      try {
        const result = await sendToContentScript<{ id: string }, ValueResponse>({
          name: "getElementValue",
          body: { id },
          tabId
        })
        return result
      } catch (e) {
        return { success: false, error: String(e) }
      }
    }
  }),

  wait_for_element: tool({
    description:
      "Polls the page until an element matching the given criteria appears (max 10 s). Use after clicking a button that opens a modal, triggers an async loader, or navigates to a new page section. After this tool returns found=true, call extract_page to get fresh semantic IDs.",
    inputSchema: z.object({
      matchText: z.string().optional().describe(
        "Case-insensitive substring to match against element text, placeholder, or aria-label"
      ),
      matchRole: z.string().optional().describe(
        "Role substring to match e.g. button, input, textbox, dialog, combobox"
      ),
      timeoutMs: z.number().min(500).max(10000).default(5000),
      tabId: z.number().optional()
    }),
    execute: async ({ matchText, matchRole, timeoutMs, tabId }) => {
      try {
        const result = await sendToContentScript<
          { matchText?: string; matchRole?: string; timeoutMs: number },
          WaitResponse
        >({
          name: "waitForElement",
          body: { matchText, matchRole, timeoutMs },
          tabId
        })
        return result
      } catch (e) {
        return { success: false, error: String(e) }
      }
    }
  })
}
