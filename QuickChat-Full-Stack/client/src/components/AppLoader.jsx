import { useState, useEffect } from 'react'

export default function AppLoader() {
  const [progress, setProgress] = useState(0)
  const [loadingText, setLoadingText] = useState('Initializing...')

  useEffect(() => {
    const texts = [
      'Initializing...',
      'Loading resources...',
      'Preparing interface...',
      'Almost ready...'
    ]
    let currentText = 0
    const interval = setInterval(() => {
      if (currentText < texts.length - 1) {
        currentText++
        setLoadingText(texts[currentText])
        setProgress(prev => Math.min(prev + 25, 90))
      }
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col items-center justify-center gap-8">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary rounded-full blur-xl opacity-30 animate-pulse" />
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center relative">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="animate-pulse">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            <path d="M8 10h8M8 14h4" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
      
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white mb-2">QuickChat</h2>
        <p className="text-sm text-zinc-400">{loadingText}</p>
      </div>

      <div className="w-48 h-1.5 bg-surface-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
