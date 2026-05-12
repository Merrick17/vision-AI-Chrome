import "~/styles/globals.css"

import { useEffect } from "react"
import { Toaster } from "~/sidepanel/components/ui/sonner"
import { SidepanelLayout } from "~/sidepanel/components/SidepanelLayout"
import { ErrorBoundary } from "~/sidepanel/components/ErrorBoundary"
import { useSettingsStore } from "~/store/settings"
import { useChatStore } from "~/store/chat"
import { useVoiceStore } from "~/store/voice"
import { isSTTAvailable } from "~/lib/voice/stt"
import { isTTSAvailable } from "~/lib/voice/tts"

function SidePanel() {
  const loadSettings = useSettingsStore((s) => s.load)
  const loadConversations = useChatStore((s) => s.loadConversations)
  const loadVoice = useVoiceStore((s) => s.load)
  const setSttAvailable = useVoiceStore((s) => s.setSttAvailable)
  const setTtsAvailable = useVoiceStore((s) => s.setTtsAvailable)
  const refreshMicPermission = useVoiceStore((s) => s.refreshMicPermission)

  useEffect(() => {
    loadSettings()
    loadConversations()
    loadVoice()
    setSttAvailable(isSTTAvailable())
    setTtsAvailable(isTTSAvailable())
    void refreshMicPermission({ requestIfUnknown: false })
  }, [loadSettings, loadConversations, loadVoice, setSttAvailable, setTtsAvailable, refreshMicPermission])

  return (
    <ErrorBoundary>
      <SidepanelLayout />
      <Toaster />
    </ErrorBoundary>
  )
}

export default SidePanel