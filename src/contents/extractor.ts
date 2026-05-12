import type { PlasmoCSConfig } from "plasmo"
import type { InteractiveElement, PageContext } from "~/types"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

const elementMap = new Map<string, Element>()
const MAX_INTERACTIVE = 70

function isVisible(el: Element): boolean {
  const rect = (el as HTMLElement).getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return false
  const htmlEl = el as HTMLElement
  if (htmlEl.offsetParent === null && getComputedStyle(htmlEl).position !== "fixed") return false
  return true
}

function isTypeableInput(el: HTMLInputElement): boolean {
  const t = (el.type || "text").toLowerCase()
  return !["hidden", "button", "submit", "reset", "image", "checkbox", "radio", "file", "color", "range"].includes(t)
}

function isMeaningfulContentEditable(el: HTMLElement): boolean {
  if (!el.isContentEditable) return false
  if (el.getAttribute("contenteditable") === "false") return false
  const ce = el.getAttribute("contenteditable")
  if (ce !== "true" && ce !== "") return false
  const r = el.getBoundingClientRect()
  if (r.height < 20 || r.width < 80) return false
  if (el.closest('[role="toolbar"], [data-test-id*="toolbar"]')) return false
  return true
}

function elementRoleLabel(el: HTMLElement): string {
  const r = el.getAttribute("role")
  if (r) return r
  if (el instanceof HTMLTextAreaElement) return "textarea"
  if (el instanceof HTMLInputElement) return el.type ? `input:${el.type}` : "input"
  if (el.isContentEditable) return "contenteditable"
  return el.tagName.toLowerCase()
}

function gatherInteractiveElements(): HTMLElement[] {
  const seen = new Set<Element>()
  const out: HTMLElement[] = []

  const push = (el: Element) => {
    if (!(el instanceof HTMLElement) || !isVisible(el)) return
    if (seen.has(el)) return
    seen.add(el)
    out.push(el)
  }

  for (const el of document.querySelectorAll("textarea")) push(el)

  for (const el of document.querySelectorAll("input")) {
    if (el instanceof HTMLInputElement && isTypeableInput(el)) push(el)
  }

  for (const sel of ['[contenteditable="true"]', '[contenteditable=""]'] as const) {
    for (const el of document.querySelectorAll(sel)) {
      if (el instanceof HTMLElement && isMeaningfulContentEditable(el)) push(el)
    }
  }

  for (const el of document.querySelectorAll('[role="textbox"]')) {
    if (!(el instanceof HTMLElement)) continue
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) continue
    if (el.isContentEditable && isMeaningfulContentEditable(el)) push(el)
  }

  for (const el of document.querySelectorAll('button, a[href], select, [role="button"]')) {
    push(el)
  }

  return out.slice(0, MAX_INTERACTIVE)
}

function cleanupStaleEntries() {
  for (const [id, el] of elementMap) {
    if (!document.contains(el)) {
      elementMap.delete(id)
    }
  }
}

function extractPageContext(): PageContext {
  cleanupStaleEntries()

  const els = gatherInteractiveElements()

  const interactiveElements: InteractiveElement[] = []
  for (const el of els) {
    const existingId = [...elementMap.entries()].find(([, v]) => v === el)?.[0]
    if (existingId) {
      const existingValue =
        el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement
          ? el.value
          : el.isContentEditable
            ? (el.textContent ?? "").trim().slice(0, 100)
            : undefined
      interactiveElements.push({
        id: existingId,
        role: elementRoleLabel(el),
        text: (
          el.getAttribute("aria-label") ||
          el.getAttribute("data-placeholder") ||
          el.getAttribute("placeholder") ||
          (el as HTMLElement).innerText?.trim().slice(0, 80) ||
          el.getAttribute("name") ||
          ""
        ).trim(),
        visible: true,
        disabled: (el as HTMLInputElement).disabled ?? false,
        value: existingValue || undefined
      })
      continue
    }

    const id = `el_${elementMap.size + 1}`
    elementMap.set(id, el)
    const currentValue =
      el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement
        ? el.value
        : el.isContentEditable
          ? (el.textContent ?? "").trim().slice(0, 100)
          : undefined
    interactiveElements.push({
      id,
      role: elementRoleLabel(el),
      text: (
        el.getAttribute("aria-label") ||
        el.getAttribute("data-placeholder") ||
        el.getAttribute("placeholder") ||
        (el as HTMLElement).innerText?.trim().slice(0, 80) ||
        el.getAttribute("name") ||
        ""
      ).trim(),
      visible: true,
      disabled: (el as HTMLInputElement).disabled ?? false,
      value: currentValue || undefined
    })
  }

  return {
    url: location.href,
    title: document.title,
    mainContent: document.body.innerText.trim().slice(0, 2000),
    interactiveElements,
    forms: Array.from(document.forms).map((f) => ({
      id: f.id,
      action: f.action,
      method: f.method
    }))
  }
}

function setNativeValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(
    element instanceof HTMLTextAreaElement
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype,
    "value"
  )?.set

  if (valueSetter) {
    valueSetter.call(element, value)
  } else {
    element.value = value
  }
}

/**
 * Rich editors (LinkedIn, Notion, etc.) use contenteditable; React/Draft expect execCommand insertText + input.
 */
function typeIntoContentEditable(el: HTMLElement, text: string): boolean {
  el.focus()
  const sel = window.getSelection()
  if (!sel) return false

  const range = document.createRange()
  if (el.childNodes.length === 0) {
    range.setStart(el, 0)
    range.collapse(true)
  } else {
    range.selectNodeContents(el)
    range.collapse(false)
  }
  sel.removeAllRanges()
  sel.addRange(range)

  const ok = document.execCommand("insertText", false, text)
  if (!ok) {
    el.textContent = text
  }

  el.dispatchEvent(
    new InputEvent("input", {
      bubbles: true,
      composed: true,
      cancelable: true,
      inputType: "insertText",
      data: text
    })
  )
  el.dispatchEvent(new Event("change", { bubbles: true }))
  return true
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const { name, body } = message as { name: string; body: Record<string, unknown> }

  if (name === "getPageContext") {
    sendResponse({ success: true, context: extractPageContext() })
    return true
  }

  if (name === "clickElement") {
    const el = elementMap.get(body.id as string) as HTMLElement | undefined
    if (!el) {
      sendResponse({ success: false, error: `Element ${body.id} not found` })
      return true
    }
    el.click()
    sendResponse({ success: true })
    return true
  }

  if (name === "typeText") {
    const el = elementMap.get(body.id as string) as HTMLElement | undefined
    const text = String(body.text ?? "")
    if (!el) {
      sendResponse({ success: false, error: `Element ${body.id} not found` })
      return true
    }

    if (el instanceof HTMLTextAreaElement || (el instanceof HTMLInputElement && isTypeableInput(el))) {
      el.focus()
      setNativeValue(el, text)
      el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }))
      el.dispatchEvent(new Event("change", { bubbles: true }))
      sendResponse({ success: true })
      return true
    }

    if (el.isContentEditable && isMeaningfulContentEditable(el)) {
      typeIntoContentEditable(el, text)
      sendResponse({ success: true })
      return true
    }

    sendResponse({
      success: false,
      error: `Element ${body.id} is not typeable (expected textarea, text-like input, or contenteditable editor). Run extract_page again after the editor is open.`
    })
    return true
  }

  if (name === "selectOption") {
    const el = elementMap.get(body.id as string) as HTMLSelectElement | undefined
    if (!el) {
      sendResponse({ success: false, error: `Element ${body.id} not found` })
      return true
    }
    el.value = body.value as string
    el.dispatchEvent(new Event("change", { bubbles: true }))
    sendResponse({ success: true })
    return true
  }

  if (name === "scrollPage") {
    const amount = body.direction === "down" ? (body.amount as number) : -(body.amount as number)
    window.scrollBy({ top: amount, behavior: "smooth" })
    sendResponse({ success: true })
    return true
  }

  if (name === "extractLinks") {
    const links = Array.from(document.querySelectorAll("a[href]"))
      .filter((a) => {
        const rect = a.getBoundingClientRect()
        return rect.width > 0 && rect.height > 0
      })
      .slice(0, 100)
      .map((a, i) => ({
        id: `link_${i + 1}`,
        text: (a.textContent ?? "").trim().slice(0, 100),
        href: (a as HTMLAnchorElement).href
      }))
    sendResponse({ success: true, links })
    return true
  }

  if (name === "pressKey") {
    const key = String(body.key ?? "Enter")
    const id = body.id as string | undefined
    const target = id
      ? (elementMap.get(id) as HTMLElement | undefined)
      : ((document.activeElement as HTMLElement) ?? document.body)
    if (!target) {
      sendResponse({ success: false, error: `Element ${id} not found` })
      return true
    }
    for (const type of ["keydown", "keypress", "keyup"]) {
      target.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true, cancelable: true }))
    }
    sendResponse({ success: true })
    return true
  }

  if (name === "hoverElement") {
    const el = elementMap.get(body.id as string) as HTMLElement | undefined
    if (!el) {
      sendResponse({ success: false, error: `Element ${body.id} not found` })
      return true
    }
    el.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true, cancelable: true }))
    el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, cancelable: true }))
    el.dispatchEvent(new FocusEvent("focus", { bubbles: true }))
    sendResponse({ success: true })
    return true
  }

  if (name === "getElementValue") {
    const el = elementMap.get(body.id as string) as HTMLElement | undefined
    if (!el) {
      sendResponse({ success: false, error: `Element ${body.id} not found` })
      return true
    }
    let value: string
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
      value = el.value
    } else if (el.isContentEditable) {
      value = (el.textContent ?? "").trim()
    } else {
      value = (el as HTMLElement).innerText?.trim() ?? ""
    }
    sendResponse({ success: true, value })
    return true
  }

  if (name === "waitForElement") {
    const { matchText, matchRole, timeoutMs = 5000 } = body as {
      matchText?: string
      matchRole?: string
      timeoutMs?: number
    }
    const deadline = Date.now() + timeoutMs
    const poll = () => {
      const ctx = extractPageContext()
      const found = ctx.interactiveElements.some((el) => {
        const textMatch = matchText ? el.text.toLowerCase().includes(matchText.toLowerCase()) : true
        const roleMatch = matchRole ? el.role.toLowerCase().includes(matchRole.toLowerCase()) : true
        return textMatch && roleMatch
      })
      if (found) {
        sendResponse({ success: true, found: true, timedOut: false })
      } else if (Date.now() >= deadline) {
        sendResponse({ success: true, found: false, timedOut: true })
      } else {
        setTimeout(poll, 250)
      }
    }
    poll()
    return true
  }
})
