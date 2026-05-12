import { tool } from "ai"
import { z } from "~/lib/zod"

function toTabSummary(tab: chrome.tabs.Tab) {
  return {
    tabId: tab.id ?? null,
    windowId: tab.windowId ?? null,
    title: tab.title ?? "",
    url: tab.url ?? "",
    active: Boolean(tab.active),
    pinned: Boolean(tab.pinned),
    status: tab.status ?? "unknown"
  }
}

export const navigationTools = {
  get_active_tab: tool({
    description: "Returns metadata for the currently active tab in the current window",
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (!tab?.id) return { success: false, error: "No active tab found" }
        return { success: true, tab: toTabSummary(tab) }
      } catch (e) {
        return { success: false, error: String(e) }
      }
    }
  }),

  list_tabs: tool({
    description: "Lists tabs in the current window with IDs and metadata",
    inputSchema: z.object({
      currentWindowOnly: z.boolean().default(true)
    }),
    execute: async ({ currentWindowOnly }) => {
      try {
        const tabs = await chrome.tabs.query(currentWindowOnly ? { currentWindow: true } : {})
        return { success: true, tabs: tabs.map(toTabSummary) }
      } catch (e) {
        return { success: false, error: String(e) }
      }
    }
  }),

  open_tab: tool({
    description: "Opens a URL in a new browser tab",
    inputSchema: z.object({
      url: z.string().url().refine(
        (u) => u.startsWith("http:") || u.startsWith("https:"),
        { message: "Only http and https URLs are allowed" }
      )
    }),
    execute: async ({ url }) => {
      try {
        const tab = await chrome.tabs.create({ url })
        return { success: true, result: { tabId: tab.id } }
      } catch (e) {
        return { success: false, error: String(e) }
      }
    }
  }),

  close_tab: tool({
    description: "Closes a browser tab by its ID",
    inputSchema: z.object({ tabId: z.number() }),
    execute: async ({ tabId }) => {
      try {
        await chrome.tabs.remove(tabId)
        return { success: true }
      } catch (e) {
        return { success: false, error: String(e) }
      }
    }
  }),

  switch_tab: tool({
    description: "Switches focus to a browser tab by its ID",
    inputSchema: z.object({ tabId: z.number() }),
    execute: async ({ tabId }) => {
      try {
        await chrome.tabs.update(tabId, { active: true })
        return { success: true }
      } catch (e) {
        return { success: false, error: String(e) }
      }
    }
  }),

  reload_tab: tool({
    description: "Reloads the current active tab",
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (tab?.id) await chrome.tabs.reload(tab.id)
        return { success: true }
      } catch (e) {
        return { success: false, error: String(e) }
      }
    }
  }),

  navigate_current_tab: tool({
    description: "Navigates the current active tab to a URL",
    inputSchema: z.object({
      url: z.string().url().refine(
        (u) => u.startsWith("http:") || u.startsWith("https:"),
        { message: "Only http and https URLs are allowed" }
      )
    }),
    execute: async ({ url }) => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (!tab?.id) return { success: false, error: "No active tab found" }
        const updated = await chrome.tabs.update(tab.id, { url })
        return { success: true, tab: toTabSummary(updated) }
      } catch (e) {
        return { success: false, error: String(e) }
      }
    }
  }),

  go_back: tool({
    description: "Navigates the active tab backward in history",
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (!tab?.id) return { success: false, error: "No active tab found" }
        await chrome.tabs.goBack(tab.id)
        return { success: true, tabId: tab.id }
      } catch (e) {
        return { success: false, error: String(e) }
      }
    }
  }),

  go_forward: tool({
    description: "Navigates the active tab forward in history",
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (!tab?.id) return { success: false, error: "No active tab found" }
        await chrome.tabs.goForward(tab.id)
        return { success: true, tabId: tab.id }
      } catch (e) {
        return { success: false, error: String(e) }
      }
    }
  }),

  wait_for_tab_complete: tool({
    description: "Waits until a tab status is complete or timeout is reached",
    inputSchema: z.object({
      tabId: z.number().optional(),
      timeoutMs: z.number().min(1000).max(30000).default(10000),
      pollMs: z.number().min(100).max(2000).default(250)
    }),
    execute: async ({ tabId, timeoutMs, pollMs }) => {
      try {
        let targetTabId = tabId
        if (!targetTabId) {
          const [active] = await chrome.tabs.query({ active: true, currentWindow: true })
          targetTabId = active?.id
        }
        if (!targetTabId) return { success: false, error: "No tab ID provided and no active tab found" }

        const deadline = Date.now() + timeoutMs
        while (Date.now() < deadline) {
          const tab = await chrome.tabs.get(targetTabId)
          if (tab.status === "complete") {
            return { success: true, tab: toTabSummary(tab), timedOut: false }
          }
          await new Promise((resolve) => setTimeout(resolve, pollMs))
        }

        const tab = await chrome.tabs.get(targetTabId)
        return { success: true, tab: toTabSummary(tab), timedOut: true }
      } catch (e) {
        return { success: false, error: String(e) }
      }
    }
  })
}
