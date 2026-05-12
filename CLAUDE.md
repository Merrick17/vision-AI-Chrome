# CLAUDE.md

# Vision — Autonomous Browser AI Agent

## Overview

Vision is a fully extension-native AI browser agent built with:

- Plasmo
- React
- TypeScript
- TailwindCSS
- Shadcn/UI
- Zustand
- Zod
- Vercel AI SDK
- Ollama Cloud

Vision runs entirely inside the browser extension runtime.

No Node.js backend exists.

The extension itself contains:
- AI orchestration
- tool execution
- memory management
- streaming
- browser control
- UI rendering
- action validation

Vision acts as an intelligent browser co-pilot capable of:
- understanding webpages
- interacting with websites
- navigating tabs
- filling forms
- executing workflows
- summarizing content
- automating repetitive tasks
- maintaining memory
- activating and receiving commands via voice

---

# Core Principles

## 1. Local-First Experience

Vision should feel native to the browser.

All orchestration logic runs inside the extension.

No dedicated backend infrastructure should be required.

---

## 2. Human-In-The-Loop

Vision assists the user.

It does NOT fully replace user control.

Sensitive actions always require confirmation.

Examples:
- purchases
- crypto transactions
- account settings
- payments
- deleting content

---

## 3. Structured Automation

The AI never directly manipulates the DOM.

The AI interacts only through structured tools.

Incorrect:
```js
document.querySelector(...).click()
```

Correct:
```json
{
  "tool": "click_element",
  "target": "el_12"
}
```

---

## 4. Safety Over Autonomy

Vision prioritizes:
- predictability
- transparency
- validation
- observability

Over aggressive autonomous behavior.

---

## 5. Voice-First Activation

Vision can be activated and commanded entirely by voice.

Voice is a first-class input alongside text.

The agent must:
- listen for a wake word to activate
- transcribe speech to text in real time
- process the transcribed command as a normal prompt
- respond with streamed audio output (text-to-speech)
- fall back gracefully to text if microphone is unavailable

---

## 6. Streaming-First UX

The interface should always feel alive.

Every operation should stream:
- thoughts
- actions
- tool execution
- observations
- results

---

# Tech Stack

## Extension Framework
- Plasmo

## Frontend
- React
- TypeScript
- TailwindCSS
- Shadcn/UI
- Framer Motion

## AI
- Vercel AI SDK
- Ollama Cloud

## Voice
- Web Speech API (SpeechRecognition — wake word + STT)
- Web Speech API (SpeechSynthesis — TTS responses)
- Whisper (optional, via Ollama Cloud, for higher accuracy STT)

## State
- Zustand

## Validation
- Zod

## Persistence
- chrome.storage.local
- IndexedDB

---

# High-Level Architecture

```txt
Browser
│
└── Plasmo Extension
    │
    ├── Sidepanel UI
    │
    ├── Background Service Worker
    │   ├── AI Runtime
    │   ├── Planner
    │   ├── Tool Router
    │   ├── Streaming Engine
    │   ├── Memory Manager
    │   ├── Voice Engine
    │   │   ├── Wake Word Detector
    │   │   ├── Speech-to-Text (STT)
    │   │   └── Text-to-Speech (TTS)
    │   └── Permission Layer
    │
    ├── Content Scripts
    │   ├── DOM Extraction
    │   ├── Semantic Mapping
    │   ├── Browser Interaction
    │   └── Page Observation
    │
    └── Local Storage
```

---

# Project Structure

```txt
src/
│
├── sidepanel/
│   ├── app/
│   ├── components/
│   ├── chat/
│   ├── hooks/
│   ├── store/
│   ├── layouts/
│   └── pages/
│
├── background/
│   ├── index.ts
│   ├── ai/
│   ├── planner/
│   ├── tools/
│   ├── memory/
│   ├── permissions/
│   ├── streaming/
│   ├── voice/
│   │   ├── wake-word.ts
│   │   ├── stt.ts
│   │   └── tts.ts
│   └── router/
│
├── contents/
│   ├── extraction/
│   ├── semantic/
│   ├── interaction/
│   ├── observers/
│   └── overlays/
│
├── lib/
│   ├── ai/
│   ├── ollama/
│   ├── browser/
│   ├── storage/
│   ├── schemas/
│   ├── prompts/
│   ├── messaging/
│   └── utils/
│
├── tools/
│   ├── browser/
│   ├── tabs/
│   ├── forms/
│   ├── extraction/
│   ├── workflows/
│   └── memory/
│
├── types/
│
├── styles/
│
└── assets/
```

---

# Browser Agent Model

Vision follows an observe → reason → act loop.

```txt
Observe
   ↓
Understand Context
   ↓
Plan Actions
   ↓
Validate Actions
   ↓
Execute Tool
   ↓
Observe Result
   ↓
Repeat
```

---

# Sidepanel UI

The sidepanel is the primary Vision interface.

It must feel:
- modern
- minimal
- responsive
- conversational

---

# Sidepanel Features

## Required

- Chat interface
- Streaming responses
- Tool execution feed
- Task status
- Action confirmations
- Conversation history
- Current tab awareness
- Voice activation button (push-to-talk or wake word)
- Live transcription display while speaking
- Visual listening indicator (pulsing mic icon)
- TTS toggle for spoken responses

---

# UI Design Rules

## Use

- Shadcn/UI components
- Tailwind utility classes
- soft borders
- subtle shadows
- muted backgrounds
- clean typography

---

## Avoid

- visual clutter
- excessive gradients
- noisy animations
- bright saturated colors
- oversized cards

---

# Theme Philosophy

Vision should visually resemble:
- modern developer tools
- AI copilots
- terminal-inspired interfaces
- clean productivity apps

Preferred:
- dark-first UI
- grayscale surfaces
- accent color only for actions

---

# State Management

Use Zustand globally.

Avoid Redux unless absolutely necessary.

State should remain:
- modular
- isolated
- serializable

---

# AI Runtime

Vision uses:
- Vercel AI SDK
- Ollama Cloud models

All AI requests originate from the extension.

---

# Recommended Models

## Fast Execution
- qwen3:14b

## Complex Reasoning
- qwen3:32b
- deepseek-r1

## Vision
- qwen2.5vl
- llava

## Speech-to-Text
- Web Speech API (built-in, zero latency)
- whisper (via Ollama, higher accuracy, offline)

---

# Prompting Philosophy

Prompts should:
- enforce structured outputs
- avoid hallucinated actions
- encourage concise reasoning
- prioritize tool usage
- validate assumptions

---

# Tool Calling

The AI can only interact through registered tools.

---

# Tool Design Rules

Every tool must define:
- schema
- validation
- permissions
- failure behavior
- result structure

---

# Example Tool

```ts
export const clickElementTool = {
  name: "click_element",

  description: "Clicks an interactive element",

  parameters: z.object({
    target: z.string()
  })
}
```

---

# Browser Interaction

The extension controls browser interactions.

The AI does NOT directly access:
- DOM APIs
- chrome APIs
- raw JavaScript execution

---

# DOM Extraction

Never provide full HTML to the AI.

Instead extract structured context.

---

# Context Structure

```json
{
  "url": "",
  "title": "",
  "main_content": "",
  "interactive_elements": [],
  "forms": [],
  "metadata": {}
}
```

---

# Interactive Element Format

```json
{
  "id": "el_1",
  "role": "button",
  "text": "Continue",
  "visible": true,
  "disabled": false
}
```

---

# Semantic Layer

Every page interaction must go through semantic abstraction.

The AI references:
- semantic IDs
- roles
- labels

Never raw selectors directly.

---

# Content Scripts

Content scripts act as the physical execution layer.

Responsibilities:
- extract page structure
- map interactive elements
- execute interactions
- observe DOM changes
- capture page state

---

# Browser Tools

## Navigation
- open_tab
- close_tab
- switch_tab
- reload_tab

## Interaction
- click_element
- type_text
- select_option
- scroll_page

## Extraction
- extract_page
- summarize_page
- extract_links

## Workflows
- save_workflow
- run_workflow

---

# Streaming

Streaming is mandatory.

The UI must stream:
- assistant responses
- reasoning
- actions
- tool execution
- observations

The user should never feel blocked.

---

# Streaming UX

Example:

```txt
Opening website...
Reading page...
Found login form...
Typing email...
Waiting for confirmation...
```

---

# Memory System

Vision maintains:
- session memory
- persistent memory
- workflow memory

---

# Storage

Use:
- chrome.storage.local
- IndexedDB

Store:
- settings
- conversations
- workflows
- cached contexts
- user preferences

Never store:
- passwords
- tokens
- payment data

---

# Permission System

Vision should request minimal permissions.

---

# Initial Permissions

```json
[
  "activeTab",
  "storage",
  "tabs",
  "scripting",
  "sidePanel"
]
```

Microphone access is requested at runtime via the browser's `getUserMedia` API — not declared in `manifest.json`.

Vision must:
- request microphone permission only when the user first enables voice
- display a clear permission prompt explaining why it's needed
- never record audio in the background without explicit activation

Avoid:
```json
["<all_urls>"]
```

until absolutely required.

---

# Security Rules

CRITICAL.

Vision MUST NEVER:
- execute arbitrary JavaScript
- auto-confirm purchases
- sign blockchain transactions automatically
- bypass browser permissions
- access saved passwords
- impersonate user actions silently
- record audio continuously in the background
- store raw audio recordings
- activate the microphone without a visible indicator

---

# Sensitive Actions

Require explicit user confirmation for:
- payments
- wallet transactions
- deleting content
- account modifications
- publishing posts

---

# Error Handling

Never silently fail.

Always:
- surface errors
- explain failures
- retry safe operations
- preserve workflow state

---

# Observability

Every action should be inspectable.

Include:
- timestamp
- tool name
- duration
- status
- error logs

---

# Logging

Logs should help:
- debugging
- replaying workflows
- improving prompts
- identifying failures

---

# Performance Rules

Vision should feel instant.

Optimize:
- context size
- DOM extraction
- streaming latency
- tool execution speed

Avoid:
- huge prompts
- full DOM serialization
- blocking operations

---

# Context Compression

Never send:
- entire HTML
- unnecessary attributes
- hidden elements
- huge page dumps

Always compress context aggressively.

---

# Coding Standards

## TypeScript

- strict mode enabled
- no any types
- fully typed tools
- zod validation everywhere

---

# React Rules

- functional components only
- hooks-first architecture
- reusable primitives
- isolated business logic

---

# Styling Rules

Use:
- TailwindCSS
- Shadcn/UI

Avoid:
- inline CSS
- random style systems
- duplicated component styling

---

# Component Philosophy

Components should be:
- composable
- reusable
- isolated
- typed
- accessible

---

# Accessibility

All UI must support:
- keyboard navigation
- screen readers
- focus visibility
- reduced motion

---

# Workflow Engine

Future versions should support:
- saved automations
- reusable browser flows
- multi-step task execution

Example:
```txt
Open Gmail
Search unread invoices
Download PDFs
Rename files
```

---

# Vision Support

Future versions may support:
- screenshots
- visual reasoning
- OCR
- UI understanding

Potential models:
- llava
- qwen2.5vl

---

# Voice Activation

Vision supports hands-free activation and control via voice.

---

## Wake Word

The default wake word is **"Hey Vision"**.

Behavior:
- Detected entirely in-browser using the Web Speech API
- Does not require a server round-trip
- Activates the listening state and opens the sidepanel if closed
- Plays a subtle audio cue on activation

The wake word can be customized or disabled in settings.

---

## Voice Input Modes

### Push-to-Talk
- User holds the mic button in the sidepanel
- Recording stops on release
- Best for noisy environments

### Wake Word
- Always-on listener (only while sidepanel is open)
- Activates on detecting the wake phrase
- Stops listening after a configurable silence timeout (default: 3 seconds)

---

## Speech-to-Text (STT)

Primary: **Web Speech API** (`SpeechRecognition`)
- Zero install, runs natively in Chrome
- Streams interim transcriptions in real time
- Final transcript is sent as the user prompt

Fallback: **Whisper via Ollama**
- Used when Web Speech API is unavailable or accuracy is insufficient
- Runs fully locally, no data leaves the device
- Higher accuracy for accented speech and technical vocabulary

---

## Text-to-Speech (TTS)

Vision reads responses aloud using **Web Speech API** (`SpeechSynthesis`).

Rules:
- TTS is opt-in (toggled in the sidepanel)
- Only the final assistant response is spoken, not intermediate tool steps
- TTS is interrupted immediately if the user speaks again
- Voice, rate, and pitch are user-configurable in settings

---

## Voice UX Flow

```txt
User says "Hey Vision"
   ↓
Wake word detected → sidepanel opens, mic activates
   ↓
Pulsing mic indicator shown
   ↓
User speaks command → live transcript displayed
   ↓
Silence detected → transcript finalized
   ↓
Prompt sent to AI runtime
   ↓
Streaming response displayed + spoken aloud (if TTS enabled)
   ↓
Agent executes tools as normal
```

---

## Voice State in Zustand

```ts
interface VoiceState {
  mode: "off" | "push-to-talk" | "wake-word";
  listening: boolean;
  transcript: string;
  ttsEnabled: boolean;
  wakeWord: string;
}
```

---

## Voice Tool

```ts
export const voiceInputTool = {
  name: "voice_input",
  description: "Captures and transcribes a voice command from the user",
  parameters: z.object({
    transcript: z.string(),
    confidence: z.number().min(0).max(1),
    source: z.enum(["web-speech-api", "whisper"])
  })
}
```

---

## Voice Privacy Rules

- Audio is never stored or logged
- Transcripts are treated as regular user messages
- The microphone is ONLY active when the listening indicator is visible
- Wake word detection processes audio locally with no network calls

---



Before implementing any feature:
1. Define tool schema
2. Define validation rules
3. Define permission model
4. Define UI states
5. Define failure handling
6. Define observability

---

# Product Goal

Vision should feel:
- intelligent
- transparent
- trustworthy
- responsive
- minimal
- privacy-first
- hands-free when needed

The user should always remain in control.

Vision is an assistant, not an uncontrollable autonomous agent.