'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-inc-accent/10 flex items-center justify-center text-3xl">
              😔
            </div>
            <h2 className="text-lg font-bold text-inc-text">Something hiccuped</h2>
            <p className="text-sm text-inc-muted max-w-sm">
              We ran into an unexpected issue. Try refreshing the page.
            </p>
            <button
              onClick={this.handleRetry}
              className="px-6 py-2 rounded-full bg-inc-accent text-black font-semibold hover:opacity-90 transition-opacity"
            >
              Try again
            </button>
          </div>
        )
      )
    }
    return this.props.children
  }
}
