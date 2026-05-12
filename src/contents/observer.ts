import type { PlasmoCSConfig } from "plasmo"
import type { PageContext } from "~/types"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

const DEBOUNCE_MS = 1500
let timeout: ReturnType<typeof setTimeout> | null = null

function notifyContextChange() {
  if (timeout) clearTimeout(timeout)
  timeout = setTimeout(() => {
    chrome.runtime.sendMessage({
      name: "pageContextChanged",
      body: { url: location.href, title: document.title }
    }).catch(() => {})
  }, DEBOUNCE_MS)
}

const observer = new MutationObserver((mutations) => {
  let significantChange = false

  for (const mutation of mutations) {
    if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement && !node.closest("style, script, link, meta")) {
          significantChange = true
          break
        }
      }
    }
    if (mutation.type === "attributes" && mutation.target instanceof HTMLElement) {
      const attr = mutation.attributeName
      if (attr === "class" || attr === "style" || attr === "hidden" || attr === "disabled") {
        significantChange = true
        break
      }
    }
    if (significantChange) break
  }

  if (significantChange) {
    notifyContextChange()
  }
})

observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["class", "style", "hidden", "disabled"]
})

window.addEventListener("unload", () => {
  observer.disconnect()
  if (timeout) clearTimeout(timeout)
})