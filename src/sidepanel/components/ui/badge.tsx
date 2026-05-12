import * as React from "react"

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  const VARIANTS = {
    default: "bg-primary/15 text-primary border border-primary/35",
    secondary: "bg-muted text-muted-foreground border border-border",
    destructive: "bg-destructive/20 text-destructive-foreground border border-destructive/45",
    outline: "border border-border text-foreground"
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  )
}