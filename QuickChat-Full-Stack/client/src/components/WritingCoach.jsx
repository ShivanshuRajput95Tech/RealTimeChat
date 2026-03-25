import React, { useState, useContext, useCallback, useRef, useEffect } from 'react'
import { AIContext } from '../context/AIContext'
import { debounce } from '../lib/utils'

const WritingCoach = ({ text, onApply, onClose }) => {
  const { coachMessage, isLoading } = useContext(AIContext)
  const [tone, setTone] = useState('professional')
  const [result, setResult] = useState(null)
  const [autoAnalyze, setAutoAnalyze] = useState(true)
  const lastAnalyzedRef = useRef('')

  const analyze = useCallback(async (textToAnalyze) => {
    if (!textToAnalyze || textToAnalyze.length < 10) {
      setResult(null)
      return
    }
    if (textToAnalyze === lastAnalyzedRef.current) return
    lastAnalyzedRef.current = textToAnalyze
    const coaching = await coachMessage(textToAnalyze, tone)
    if (coaching) setResult(coaching)
  }, [coachMessage, tone])

  const debouncedAnalyze = useCallback(debounce(analyze, 1500), [analyze])

  useEffect(() => {
    if (autoAnalyze && text && text.length >= 10) {
      debouncedAnalyze(text)
    }
  }, [text, autoAnalyze, debouncedAnalyze])

  useEffect(() => {
    lastAnalyzedRef.current = ''
    if (text && text.length >= 10) {
      analyze(text)
    }
  }, [tone])

  const ScoreBar = ({ value, label, color }) => (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-zinc-500 w-14 font-medium">{label}</span>
      <div className="flex-1 h-2 bg-surface-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${(value / 10) * 100}%` }}
        />
      </div>
      <span className="text-xs text-zinc-400 font-mono w-6 text-right">{value}</span>
    </div>
  )

  return (
    <div className="bg-surface-800/95 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl shadow-black/40 overflow-hidden scale-in">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Writing Coach</h3>
            <p className="text-[10px] text-zinc-500">AI-powered writing improvement</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoAnalyze(!autoAnalyze)}
            className={`text-[10px] px-2 py-1 rounded-lg font-medium cursor-pointer transition-all ${autoAnalyze ? 'bg-success/20 text-success' : 'bg-surface-700 text-zinc-500'}`}
          >
            {autoAnalyze ? 'Auto ON' : 'Auto OFF'}
          </button>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-surface-700/60 cursor-pointer transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex gap-2">
          {['professional', 'casual', 'empathetic', 'persuasive'].map(t => (
            <button
              key={t}
              onClick={() => setTone(t)}
              className={`flex-1 py-2 text-xs rounded-xl cursor-pointer transition-all duration-300 font-medium capitalize ${
                tone === t
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20'
                  : 'text-zinc-400 bg-surface-700/50 hover:text-white hover:bg-surface-600/50 border border-transparent hover:border-white/5'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {isLoading && !result && (
          <div className="text-center py-6">
            <div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-zinc-500">Analyzing your writing...</p>
          </div>
        )}

        {result && (
          <div className="space-y-3 fade-in">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-700/50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  {result.overallScore}/10
                </div>
                <div className="text-[10px] text-zinc-500 mt-1 font-medium uppercase tracking-wider">Overall</div>
              </div>
              <div className="space-y-2">
                <ScoreBar value={result.clarity} label="Clarity" color="bg-blue-500" />
                <ScoreBar value={result.toneMatch} label="Tone" color="bg-amber-500" />
              </div>
            </div>

            {result.suggestions && result.suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  Suggestions
                </p>
                {result.suggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-zinc-300 bg-surface-700/30 rounded-xl px-3 py-2">
                    <span className="text-amber-500 mt-0.5 flex-shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                      </svg>
                    </span>
                    <span className="leading-relaxed">{s}</span>
                  </div>
                ))}
              </div>
            )}

            {result.revisedText && result.revisedText !== text && (
              <div className="space-y-2">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Suggested Revision
                </p>
                <div className="bg-success/5 border border-success/20 rounded-xl px-3 py-2.5 text-xs text-zinc-200 leading-relaxed">
                  {result.revisedText}
                </div>
                <button
                  onClick={() => onApply(result.revisedText)}
                  className="w-full py-2 bg-gradient-to-r from-success/20 to-cyan-500/20 text-success text-xs font-semibold rounded-xl cursor-pointer hover:from-success/30 hover:to-cyan-500/30 transition-all border border-success/20"
                >
                  Apply Revision
                </button>
              </div>
            )}
          </div>
        )}

        {!isLoading && !result && text && text.length < 10 && (
          <p className="text-xs text-zinc-600 text-center py-4">Type at least 10 characters to analyze</p>
        )}
      </div>
    </div>
  )
}

export default WritingCoach
