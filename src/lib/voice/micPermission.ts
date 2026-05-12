/**
 * Requests microphone permission via an iframe injected into the active tab.
 *
 * Chrome MV3 bug: SpeechRecognition and getUserMedia called from extension
 * pages (sidepanel, popup) don't reliably trigger the browser's permission
 * dialog. The fix: a content script injects a hidden iframe with
 * allow="microphone" pointing to an extension-hosted page that calls
 * getUserMedia. This makes Chrome show the dialog in the main browser window.
 */
export async function requestMicPermissionViaIframe(): Promise<boolean> {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    const tabId = tabs[0]?.id
    if (tabId === undefined) throw new Error("no active tab")

    const result = await new Promise<{ success: boolean; granted?: boolean }>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("timeout")), 32000)
      chrome.tabs.sendMessage(
        tabId,
        { name: "requestMicPermission", body: {} },
        (response: { success: boolean; granted?: boolean } | undefined) => {
          clearTimeout(timer)
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError)
          } else {
            resolve(response ?? { success: false })
          }
        }
      )
    })

    return Boolean(result?.granted)
  } catch {
    // Fallback: direct getUserMedia from sidepanel context.
    // Works when the user already granted permission, or on pages with no
    // content script (new tab, chrome:// pages).
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
      return true
    } catch {
      return false
    }
  }
}
