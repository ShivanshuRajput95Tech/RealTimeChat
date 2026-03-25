import React from "react"

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-surface-900 text-white gap-4">
          <div className="w-16 h-16 rounded-2xl bg-danger/10 flex items-center justify-center text-3xl">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-danger"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="text-gray-400 text-sm max-w-md text-center">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload() }}
            className="mt-4 px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-xl cursor-pointer hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
          >
            Reload Page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
