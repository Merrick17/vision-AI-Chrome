import type React from "react"
import { useEffect } from "react"
import { AlertTriangle, Bot, Trash2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "~/sidepanel/components/ui/sheet"
import { Label } from "~/sidepanel/components/ui/label"
import { Input } from "~/sidepanel/components/ui/input"
import { Button } from "~/sidepanel/components/ui/button"
import { useSettingsStore } from "~/store/settings"
import { useVoiceStore } from "~/store/voice"
import { useChatStore } from "~/store/chat"

const MODELS = [
  "glm-5.1",
  "qwen3-coder-next",
  "nemotron-3-super",
  "gemma3:27b",
  "deepseek-v3.2",
  "gpt-oss:120b",
  "minimax-m2.5",
  "gemma4:31b"
]
const VOICE_MODES = [
  { value: "off", label: "OFF" },
  { value: "push-to-talk", label: "PTT" },
  { value: "wake-word", label: "WAKE" }
] as const

const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.2 }
  })
}

type Props = { children: React.ReactElement }

export function SettingsSheet({ children }: Props) {
  const {
    model,
    ollamaCloudToken,
    supabaseUrl,
    supabaseAnonKey,
    autonomousMode,
    skillResearch,
    skillAutomation,
    skillMemory,
    skillRag,
    skillWriting,
    showAgentTrace,
    setModel,
    setOllamaCloudToken,
    setSupabaseUrl,
    setSupabaseAnonKey,
    setAutonomousMode,
    setSkillResearch,
    setSkillAutomation,
    setSkillMemory,
    setSkillRag,
    setSkillWriting,
    setShowAgentTrace,
    save
  } = useSettingsStore()
  const { mode, ttsEnabled, wakeWord, sttAvailable, ttsAvailable, setMode, setTtsEnabled, setWakeWord } = useVoiceStore()
  const conversations = useChatStore((s) => s.conversations)
  const currentConversationId = useChatStore((s) => s.currentConversationId)
  const loadConversations = useChatStore((s) => s.loadConversations)
  const loadConversation = useChatStore((s) => s.loadConversation)
  const deleteConversation = useChatStore((s) => s.deleteConversation)
  const clearHistory = useChatStore((s) => s.clearHistory)

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  async function handleSave() {
    await save()
  }

  let sectionIndex = 0

  return (
    <Sheet>
      <SheetTrigger>{children}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-72 border-border/70 bg-panel-elevated text-foreground p-0 font-mono">
        <SheetHeader className="border-b border-border/70 px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-xs font-bold tracking-widest text-primary text-glow">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-primary/35 bg-primary/10 text-primary">
              <Bot className="h-4 w-4" strokeWidth={2} aria-hidden />
            </span>
            SYSTEM CONFIG
          </SheetTitle>
        </SheetHeader>

        <div className="px-4 py-4 space-y-5 overflow-y-auto max-h-[calc(100vh-52px)]">

          {/* Autonomous Mode */}
          <motion.section
            custom={sectionIndex++}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Agent Mode</p>

            <div className="border border-amber-500/20 bg-amber-900/10 rounded-sm p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  <Label className="text-xs text-amber-400 font-mono font-bold tracking-wide">AUTONOMOUS</Label>
                </div>
                <button
                  onClick={() => setAutonomousMode(!autonomousMode)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-none transition-colors border ${
                    autonomousMode ? "bg-amber-500/30 border-amber-400/60" : "bg-transparent border-border"
                  }`}>
                  <span
                    style={{ transform: autonomousMode ? "translateX(18px)" : "translateX(2px)" }}
                    className={`inline-block h-3.5 w-3.5 transition-transform ${
                      autonomousMode ? "bg-amber-400" : "bg-muted-foreground"
                    }`}
                  />
                </button>
              </div>
              <p className="text-[10px] text-amber-600 leading-relaxed">
                Agent executes all actions without confirmation. Use with caution.
              </p>
            </div>
          </motion.section>

          <motion.section
            custom={sectionIndex++}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Skills</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Toggles which tool groups are registered. The model still decides whether to call them.
            </p>
            <div className="space-y-1.5 rounded-sm border border-border bg-panel/40 p-2">
              {[
                { key: "Automation", value: skillAutomation, set: setSkillAutomation },
                { key: "Research", value: skillResearch, set: setSkillResearch },
                { key: "Memory", value: skillMemory, set: setSkillMemory },
                { key: "RAG", value: skillRag, set: setSkillRag },
                { key: "Writing", value: skillWriting, set: setSkillWriting }
              ].map((skill) => (
                <div key={skill.key} className="flex items-center justify-between">
                  <Label className="text-[10px] text-muted-foreground">{skill.key}</Label>
                  <button
                    onClick={() => skill.set(!skill.value)}
                    className={`relative inline-flex h-4 w-7 items-center rounded-none border transition-colors ${
                      skill.value ? "border-primary/50 bg-primary/20" : "border-border bg-transparent"
                    }`}>
                    <span
                      style={{ transform: skill.value ? "translateX(14px)" : "translateX(2px)" }}
                      className={`inline-block h-2.5 w-2.5 transition-transform ${
                        skill.value ? "bg-primary" : "bg-muted-foreground"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section
            custom={sectionIndex++}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Agent trace</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Reasoning stream (when the model emits it), tool names, arguments, results, and errors in the chat.
            </p>
            <div className="flex items-center justify-between rounded-sm border border-border bg-panel/40 px-2 py-2">
              <Label className="text-[10px] text-muted-foreground">Show full trace</Label>
              <button
                type="button"
                onClick={() => setShowAgentTrace(!showAgentTrace)}
                className={`relative inline-flex h-5 w-9 items-center rounded-none transition-colors border ${
                  showAgentTrace ? "border-primary/50 bg-primary/20" : "border-border bg-transparent"
                }`}>
                <span
                  style={{ transform: showAgentTrace ? "translateX(18px)" : "translateX(2px)" }}
                  className={`inline-block h-3.5 w-3.5 transition-transform ${
                    showAgentTrace ? "bg-primary" : "bg-muted-foreground"
                  }`}
                />
              </button>
            </div>
          </motion.section>

          {/* Voice */}
          <motion.section
            custom={sectionIndex++}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Voice</p>

            {sttAvailable === false && (
              <div className="bg-amber-900/20 border border-amber-700/30 text-amber-500 text-[10px] p-2 rounded-none">
                Voice input not supported. Try Chrome or Edge.
              </div>
            )}

            {ttsAvailable === false && (
              <div className="bg-amber-900/20 border border-amber-700/30 text-amber-500 text-[10px] p-2 rounded-none">
                Text-to-speech not supported.
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Mode</Label>
              <div className="flex gap-1.5">
                {VOICE_MODES.map((vm) => (
                  <button
                    key={vm.value}
                    onClick={() => setMode(vm.value)}
                    className={`flex-1 text-xs px-2 py-1.5 rounded-none border transition-colors font-mono tracking-wide ${
                      mode === vm.value
                        ? "border-primary/60 bg-primary/15 text-primary"
                        : "border-border bg-transparent text-muted-foreground hover:text-foreground hover:border-primary/40"
                    }`}>
                    {vm.label}
                  </button>
                ))}
              </div>
            </div>

            {mode === "wake-word" && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Wake word</Label>
                <Input
                  value={wakeWord}
                  onChange={(e) => setWakeWord(e.target.value)}
                  className="h-8 rounded-none border-border bg-transparent text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
                  placeholder="Energize"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Read responses aloud</Label>
              <button
                onClick={() => setTtsEnabled(!ttsEnabled)}
                className={`relative inline-flex h-5 w-9 items-center rounded-none transition-colors border ${
                  ttsEnabled ? "bg-primary/20 border-primary/50" : "bg-transparent border-border"
                }`}>
                <span
                  style={{ transform: ttsEnabled ? "translateX(18px)" : "translateX(2px)" }}
                  className={`inline-block h-3.5 w-3.5 transition-transform ${
                    ttsEnabled ? "bg-primary" : "bg-muted-foreground"
                  }`}
                />
              </button>
            </div>
          </motion.section>

          {/* Conversations */}
          {conversations.length > 0 && (
            <motion.section
              custom={sectionIndex++}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              className="space-y-3">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">History</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                <AnimatePresence initial={false}>
                  {conversations.map((conv) => (
                    <motion.div
                      key={conv.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                      className={`flex items-center justify-between gap-2 text-xs px-2 py-1.5 rounded-none cursor-pointer transition-colors border font-mono ${
                        conv.id === currentConversationId
                          ? "bg-primary/15 text-primary border-primary/35"
                          : "bg-transparent text-muted-foreground border-border hover:text-foreground hover:border-primary/40"
                      }`}
                      onClick={() => loadConversation(conv.id)}>
                      <span className="truncate flex-1">&gt; {conv.title}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id) }}
                        className="shrink-0 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.section>
          )}

          {/* Ollama Cloud */}
          <motion.section
            custom={sectionIndex++}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ollama Cloud</p>
            <p className="text-[10px] text-amber-600/90 leading-relaxed">
              Required for the agent. Paste a key below (saved in this browser), or set{" "}
              <code className="rounded bg-panel px-0.5 text-[9px]">PLASMO_PUBLIC_OLLAMA_CLOUD_TOKEN</code> in{" "}
              <code className="rounded bg-panel px-0.5 text-[9px]">.env</code> for dev builds (inlined at build time).
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">API Key</Label>
              <Input
                value={ollamaCloudToken}
                onChange={(e) => setOllamaCloudToken(e.target.value)}
                onBlur={handleSave}
                type="password"
                className="h-8 rounded-none border-border bg-transparent text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
                placeholder="ollama-..."
              />
              <p className="text-[10px] text-muted-foreground">
                &gt; api.ollama.com
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Model</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {MODELS.map((m) => (
                  <button
                    key={m}
                    onClick={() => { setModel(m); save() }}
                    className={`text-xs px-2 py-1.5 rounded-none border transition-colors font-mono ${
                      model === m
                        ? "border-primary/60 bg-primary/15 text-primary"
                        : "border-border bg-transparent text-muted-foreground hover:text-foreground hover:border-primary/40"
                    }`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Supabase */}
          <motion.section
            custom={sectionIndex++}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Supabase</p>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Project URL</Label>
              <Input
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                onBlur={handleSave}
                className="h-8 rounded-none border-border bg-transparent text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
                placeholder="https://your-project.supabase.co"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Anon Key</Label>
              <Input
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                onBlur={handleSave}
                type="password"
                className="h-8 rounded-none border-border bg-transparent text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
                placeholder="eyJ..."
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Required for RAG. Leave empty to disable.
            </p>
          </motion.section>

          {/* Danger zone */}
          <motion.section
            custom={sectionIndex++}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3 border-t border-border/60 pt-2">
            <Button
              variant="destructive"
              size="sm"
              className="h-8 w-full rounded-none border border-destructive/45 bg-destructive/20 font-mono text-xs tracking-wide text-destructive-foreground hover:bg-destructive/30"
              onClick={clearHistory}>
              CLEAR CONVERSATION
            </Button>
          </motion.section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
