import * as React from "react"

type ScrollAreaProps = React.HTMLAttributes<HTMLDivElement>

export function ScrollArea({ className = "", children, ...props }: ScrollAreaProps) {
  return (
    <div className={`overflow-y-auto scroll-smooth ${className}`} {...props}>
      {children}
    </div>
  )
}
