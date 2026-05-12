// Open sidepanel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  if (tab.windowId !== undefined) {
    chrome.sidePanel.open({ windowId: tab.windowId })
  }
})

// Plasmo auto-discovers handlers in background/messages/ and background/ports/
