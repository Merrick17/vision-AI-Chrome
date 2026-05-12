import { Component, type ErrorInfo, type ReactNode } from "react"
import { logVisionError } from "~/lib/log"

type Props = { children: ReactNode }
type State = { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logVisionError("sidepanel", error, { componentStack: info.componentStack })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-foreground">
          <span className="text-3xl">⚠</span>
          <p className="text-sm text-foreground">Something went wrong.</p>
          <p className="max-w-[280px] text-center text-xs text-muted-foreground">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="rounded-lg bg-primary px-4 py-2 text-xs text-primary-foreground transition-colors hover:bg-primary/90">
            Restart
          </button>
        </div>
      )
    }
    return this.props.children
  }
}