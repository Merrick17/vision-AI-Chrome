export type Message = {
  id: string
  role: "user" | "assistant" | "tool" | "system"
  content: string
  /** Model reasoning / chain-of-thought stream when the provider emits it */
  reasoning?: string
  timestamp: number
  toolCalls?: ToolCall[]
  streaming?: boolean
}

export type ToolCall = {
  id: string
  name: string
  args: unknown
  status: "running" | "done" | "error"
  result?: unknown
  error?: string
  duration?: number
}

export type AgentState = "idle" | "thinking" | "acting" | "done" | "error"

export type InteractiveElement = {
  id: string
  role: string
  text: string
  visible: boolean
  disabled: boolean
  value?: string
}

export type PageContext = {
  url: string
  title: string
  mainContent: string
  interactiveElements: InteractiveElement[]
  forms: Array<{ id: string; action: string; method: string }>
}

export type Settings = {
  model: string
  ollamaCloudToken: string
  supabaseUrl: string
  supabaseAnonKey: string
  skillResearch?: boolean
  skillAutomation?: boolean
  skillMemory?: boolean
  skillRag?: boolean
  skillWriting?: boolean
}

export type MemoryEntry = {
  id: string
  key: string
  value: string
  createdAt: number
}

export type Conversation = {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

export type ConfirmationStatus = "pending" | "approved" | "denied"

export type PendingConfirmation = {
  id: string
  toolName: string
  description: string
  riskReason?: string
  args: Record<string, unknown>
  status: ConfirmationStatus
  createdAt: number
}

export type StreamMessage =
  | { type: "chunk"; streamId: string; delta: string }
  | { type: "reasoning_delta"; streamId: string; delta: string }
  | { type: "tool_start"; streamId: string; call: ToolCall }
  | { type: "tool_done"; streamId: string; call: ToolCall }
  | { type: "confirmation_required"; streamId: string; confirmationId: string; toolName: string; description: string; riskReason?: string; args: Record<string, unknown> }
  | { type: "done"; streamId: string; finalText: string }
  | { type: "error"; streamId: string; message: string }