import { useEffect, useState } from "react"

export function useCurrentTab() {
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")

  useEffect(() => {
    function update() {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0]
        if (tab) {
          setTitle(tab.title ?? "")
          setUrl(tab.url ?? "")
        }
      })
    }

    update()
    chrome.tabs.onActivated.addListener(update)
    chrome.tabs.onUpdated.addListener(update)

    return () => {
      chrome.tabs.onActivated.removeListener(update)
      chrome.tabs.onUpdated.removeListener(update)
    }
  }, [])

  return { title, url }
}
