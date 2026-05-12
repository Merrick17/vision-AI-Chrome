import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useVoiceStore } from "~/store/voice"

const MATRIX_CHARS = "ABCDEF0123456789VISION@#$%<>{}[]|\\/"

function randomChar() {
  return MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
}

function RainColumn({ delay, x }: { delay: number; x: string }) {
  const [chars, setChars] = useState(() => Array.from({ length: 12 }, randomChar))

  useEffect(() => {
    const id = setInterval(() => {
      setChars((prev) => {
        const next = [...prev]
        next[Math.floor(Math.random() * next.length)] = randomChar()
        return next
      })
    }, 80)
    return () => clearInterval(id)
  }, [])

  return (
    <motion.div
      className="absolute top-0 flex flex-col gap-0.5 font-mono text-xs leading-tight select-none"
      style={{ left: x }}
      initial={{ y: "-100%", opacity: 0 }}
      animate={{ y: "110%", opacity: [0, 1, 1, 0] }}
      transition={{ duration: 1.4, delay, ease: "linear" }}>
      {chars.map((ch, i) => (
        <span
          key={i}
          className="text-green-400"
          style={{ opacity: 1 - i * 0.07, textShadow: "0 0 6px #00ff41" }}>
          {ch}
        </span>
      ))}
    </motion.div>
  )
}

const ENERGIZED_LETTERS = "ENERGIZED".split("")

export function EnergizeAnimation() {
  const energized = useVoiceStore((s) => s.energized)

  return (
    <AnimatePresence>
      {energized && (
        <motion.div
          className="absolute inset-0 z-50 overflow-hidden flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
          transition={{ duration: 0.15 }}>
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/92" />

          {/* Screen flash */}
          <motion.div
            className="absolute inset-0 bg-green-500/30"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />

          {/* Digital rain columns */}
          <div className="absolute inset-0 overflow-hidden">
            <RainColumn delay={0} x="8%" />
            <RainColumn delay={0.1} x="22%" />
            <RainColumn delay={0.05} x="38%" />
            <RainColumn delay={0.15} x="55%" />
            <RainColumn delay={0.08} x="70%" />
            <RainColumn delay={0.2} x="85%" />
          </div>

          {/* Expanding ring */}
          <motion.div
            className="absolute rounded-full border-2 border-green-400"
            style={{ boxShadow: "0 0 20px #00ff4180, inset 0 0 20px #00ff4120" }}
            initial={{ width: 40, height: 40, opacity: 1 }}
            animate={{ width: 280, height: 280, opacity: 0 }}
            transition={{ duration: 1.0, ease: "easeOut" }}
          />

          {/* Secondary ring */}
          <motion.div
            className="absolute rounded-full border border-green-500/60"
            initial={{ width: 20, height: 20, opacity: 0.8 }}
            animate={{ width: 180, height: 180, opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
          />

          {/* ENERGIZED text */}
          <div className="relative z-10 flex items-center gap-0">
            {ENERGIZED_LETTERS.map((letter, i) => (
              <motion.span
                key={i}
                className="font-mono font-bold text-3xl text-green-400 tracking-widest"
                style={{ textShadow: "0 0 10px #00ff41, 0 0 20px #00ff4180" }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.06, duration: 0.15 }}>
                {letter}
              </motion.span>
            ))}
          </div>

          {/* Sub-text */}
          <motion.p
            className="absolute font-mono text-[10px] text-green-600 tracking-[0.3em] uppercase"
            style={{ top: "calc(50% + 30px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.3 }}>
            SYSTEM ACTIVATED
          </motion.p>

          {/* Bottom scanline effect */}
          <motion.div
            className="absolute inset-x-0 h-px bg-green-400/60"
            style={{ boxShadow: "0 0 8px #00ff41" }}
            initial={{ top: "0%", opacity: 1 }}
            animate={{ top: "100%", opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "linear" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
