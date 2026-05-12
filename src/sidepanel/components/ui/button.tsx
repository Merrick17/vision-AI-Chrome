import * as React from "react"

type Variant = "default" | "ghost" | "destructive" | "outline"
type Size = "default" | "sm" | "icon"

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  asChild?: boolean
}

const VARIANT_CLASSES: Record<Variant, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  outline: "border border-border bg-transparent text-foreground hover:bg-muted"
}

const SIZE_CLASSES: Record<Size, string> = {
  default: "h-9 px-4 py-2 text-sm",
  sm: "h-8 px-3 text-xs",
  icon: "h-9 w-9"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", children, ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}>
      {children}
    </button>
  )
)
Button.displayName = "Button"