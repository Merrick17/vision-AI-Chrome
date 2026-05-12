import { motion } from "framer-motion"

type Props = {
  active: boolean
  barCount?: number
  color?: string
  className?: string
}

export function AudioWaveform({ active, barCount = 5, color = "bg-indigo-500", className = "" }: Props) {
  return (
    <div className={`flex items-center gap-0.5 h-5 ${className}`}>
      {Array.from({ length: barCount }).map((_, i) => (
        <motion.div
          key={i}
          className={`w-[3px] rounded-full ${active ? color : "bg-zinc-600"}`}
          animate={
            active
              ? {
                  height: [4, 8 + (i % 3) * 6, 4],
                }
              : { height: 4 }
          }
          transition={
            active
              ? {
                  duration: 0.6 + i * 0.08,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  )
}