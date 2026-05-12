import { MotionConfig } from "framer-motion"
import { SetupBanner } from "./SetupBanner"
import { Header } from "./Header"
import { MessageList } from "./MessageList"
import { InputBar } from "./InputBar"
import { VoiceIndicator } from "./VoiceIndicator"
import { TTSIndicator } from "./TTSIndicator"
import { EnergizeAnimation } from "./EnergizeAnimation"
import { useVoiceController } from "~/hooks/useVoice"

export function SidepanelLayout() {
  useVoiceController()
  const logoUrl = typeof chrome !== "undefined" && chrome.runtime?.getURL
    ? chrome.runtime.getURL("assets/logo_icon.png")
    : "/assets/logo_icon.png"

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative flex h-screen flex-col overflow-hidden bg-background text-foreground">
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("${logoUrl}")`,
            backgroundPosition: "center",
            backgroundSize: "85% auto",
            backgroundRepeat: "no-repeat",
            filter: "blur(1px)"
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 z-10 matrix-flicker"
          style={{
            background:
              "radial-gradient(120% 120% at 50% 0%, hsl(var(--secondary) / 0.12) 0%, transparent 42%), radial-gradient(120% 120% at 50% 100%, hsl(var(--accent) / 0.12) 0%, transparent 46%)"
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background: "linear-gradient(180deg, hsl(var(--background) / 0.1), hsl(var(--background) / 0.72))"
          }}
        />
        <EnergizeAnimation />
        <SetupBanner />
        <Header />
        <MessageList />
        <VoiceIndicator />
        <TTSIndicator />
        <InputBar />
      </div>
    </MotionConfig>
  )
}
