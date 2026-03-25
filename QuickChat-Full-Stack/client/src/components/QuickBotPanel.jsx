import React, { useState, useContext, useRef, useEffect, useCallback } from 'react'
import { AIContext } from '../context/AIContext'
import { AuthContext } from '../context/AuthContext'
import toast from 'react-hot-toast'

const QuickBotPanel = ({ channelId, groupId, conversationId, onClose }) => {
  const { aiMessages, isLoading, quickBotChat, clearAIChat } = useContext(AIContext)
  const { socket } = useContext(AuthContext)
  const [input, setInput] = useState('')
  const [showActions, setShowActions] = useState(false)
  const scrollEnd = useRef()

  useEffect(() => {
    scrollEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [aiMessages])

  const handleSend = async (e) => {
    e?.preventDefault()
    if (!input.trim()) return
    const message = input.trim()
    setInput('')
    const action = await quickBotChat(message, channelId, groupId, conversationId)
    if (action) {
      if (action.type === 'reminder_created') {
        toast.success('Reminder set!')
      } else if (action.type === 'create_poll') {
        setShowActions(true)
      }
    }
  }

  const quickActions = [
    { label: 'Summarize chat', icon: 'M4 6h16M4 12h8m-8 6h16', action: () => setInput('Summarize the recent conversation') },
    { label: 'Create poll', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', action: () => setInput('Create a poll: ') },
    { label: 'Set reminder', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', action: () => setInput('Remind me in 1 hour to ') },
    { label: 'Find message', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', action: () => setInput('Find messages about ') },
  ]

  return (
    <div className="h-full flex flex-col bg-surface-800/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-surface-800 animate-pulse" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">QuickBot</h3>
            <p className="text-[10px] text-zinc-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              AI-powered assistant
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={clearAIChat} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-surface-700/60 cursor-pointer transition-all" title="Clear chat">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-surface-700/60 cursor-pointer transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {aiMessages.length === 0 && (
        <div className="px-4 py-3 border-b border-white/[0.04] flex-shrink-0">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-2">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((qa, i) => (
              <button
                key={i}
                onClick={qa.action}
                className="flex items-center gap-2 px-3 py-2.5 bg-surface-700/50 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-surface-600/50 cursor-pointer transition-all border border-transparent hover:border-white/5 text-left"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 text-emerald-400">
                  <path d={qa.icon} />
                </svg>
                <span className="font-medium truncate">{qa.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {aiMessages.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 mx-auto mb-4 flex items-center justify-center shadow-lg">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-400">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            </div>
            <p className="text-sm text-zinc-400 mb-2">Hey! I'm QuickBot</p>
            <p className="text-xs text-zinc-600 max-w-xs mx-auto">I can help you summarize chats, create polls, set reminders, find messages, and answer questions about your workspace.</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {aiMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} fade-in`}>
              <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' ? 'message-bubble-sent text-white' : 'message-bubble-received text-zinc-200'
              }`}>
                {msg.type === 'meeting-notes' && (
                  <span className="text-[10px] font-semibold text-emerald-400 block mb-2 uppercase tracking-wider flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                    </svg>
                    Meeting Notes
                  </span>
                )}
                <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                {msg.streaming && (
                  <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse ml-1 rounded" />
                )}
              </div>
            </div>
          ))}
          {isLoading && !aiMessages.some(m => m.streaming) && (
            <div className="flex justify-start fade-in">
              <div className="bg-surface-700/80 backdrop-blur-sm rounded-2xl rounded-bl-md px-5 py-4 flex items-end gap-2 shadow-lg">
                <span className="w-2 h-2 bg-zinc-400 rounded-full typing-dot" />
                <span className="w-2 h-2 bg-zinc-400 rounded-full typing-dot" />
                <span className="w-2 h-2 bg-zinc-400 rounded-full typing-dot" />
              </div>
            </div>
          )}
          <div ref={scrollEnd} />
        </div>
      </div>

      <form onSubmit={handleSend} className="px-4 py-3 border-t border-white/[0.04] flex-shrink-0 bg-surface-800/50 backdrop-blur-xl">
        <div className="flex items-center gap-2 bg-surface-700/60 rounded-xl px-4 py-2.5 border border-white/[0.03] focus-within:border-emerald-500/30 focus-within:shadow-lg focus-within:shadow-emerald-500/5 transition-all">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e) }}
            placeholder="Ask QuickBot anything..."
            className="flex-1 text-sm bg-transparent border-none outline-none text-white placeholder-zinc-500"
          />
          <button type="submit" disabled={isLoading || !input.trim()} className="text-emerald-400 hover:text-emerald-300 cursor-pointer transition-all disabled:opacity-30 hover:scale-110">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
}

export default QuickBotPanel
