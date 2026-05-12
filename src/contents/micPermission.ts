import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const { name } = message as { name: string }
  if (name !== "requestMicPermission") return false

  const iframe = document.createElement("iframe")
  iframe.style.cssText = "display:none;width:0;height:0;position:fixed;top:0;left:0;"
  iframe.setAttribute("allow", "microphone")
  iframe.src = chrome.runtime.getURL("tabs/permission.html")

  let handled = false

  const cleanup = () => {
    clearTimeout(timeoutId)
    window.removeEventListener("message", onMessage)
    try { iframe.parentNode?.removeChild(iframe) } catch { /* already removed */ }
  }

  const timeoutId = setTimeout(() => {
    if (handled) return
    handled = true
    cleanup()
    sendResponse({ success: false, error: "timeout" })
  }, 30000)

  function onMessage(event: MessageEvent) {
    if ((event.data as { type?: string } | null)?.type !== "MIC_PERMISSION_RESULT") return
    if (handled) return
    handled = true
    cleanup()
    sendResponse({ success: true, granted: Boolean((event.data as { granted?: boolean }).granted) })
  }

  window.addEventListener("message", onMessage)
  document.body.appendChild(iframe)

  return true // keep message channel open for async sendResponse
})
