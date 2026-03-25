import React, { useContext, useEffect, useRef, useState } from 'react'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'
import { formatMessageTime } from '../lib/utils'

const ThreadPanel = () => {
  const { activeThread, threadMessages, closeThread, sendThreadReply, messages } = useContext(ChatContext)
  const { authUser } = useContext(AuthContext)
  const [input, setInput] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const scrollEnd = useRef()

  const parentMessage = messages.find(m => m._id === activeThread)

  useEffect(() => {
    scrollEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [threadMessages])

  if (!activeThread || !parentMessage) return null

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    await sendThreadReply(activeThread, input.trim())
    setInput('')
  }

  return (
    <div className="h-full flex flex-col bg-surface-800/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04] flex-shrink-0">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <h3 className="text-white font-semibold text-sm">Thread</h3>
        </div>
        <button onClick={closeThread} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-surface-700/60 cursor-pointer transition-all duration-300 hover:scale-105">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div className="px-4 py-4 border-b border-white/[0.04] bg-surface-700/20 flex-shrink-0">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-black/10 flex-shrink-0">
            {parentMessage.senderId?.profilePic || parentMessage.senderId === authUser._id || parentMessage.senderId?._id === authUser._id ? (
              <img
                src={parentMessage.senderId?.profilePic || authUser?.profilePic}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold text-sm">
                {(parentMessage.senderId?.fullName || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-primary flex items-center gap-1.5">
              {parentMessage.senderId?.fullName || (parentMessage.senderId === authUser._id || parentMessage.senderId?._id === authUser._id ? authUser.fullName : 'User')}
              <span className="text-zinc-600 font-normal">·</span>
              <span className="text-zinc-500 font-normal">{formatMessageTime(parentMessage.createdAt)}</span>
            </p>
            <p className="text-sm text-zinc-300 mt-1.5 break-words leading-relaxed">
              {parentMessage.text || (parentMessage.image ? '[Image]' : '[Deleted]')}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {threadMessages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-2xl bg-surface-700/50 mx-auto mb-3 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-500">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p className="text-xs text-zinc-500">No replies yet. Start the thread!</p>
          </div>
        )}
        {threadMessages.map((msg, idx) => (
          <div key={msg._id || idx} className="flex items-start gap-3 fade-in group">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-lg shadow-black/10 flex-shrink-0">
              {msg.senderId?.profilePic ? (
                <img
                  src={msg.senderId.profilePic}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold text-xs">
                  {(msg.senderId?.fullName || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-primary">{msg.senderId?.fullName || 'Unknown'}</p>
                <span className="text-[10px] text-zinc-500">{formatMessageTime(msg.createdAt)}</span>
              </div>
              <p className="text-sm text-zinc-300 mt-1 break-words leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={scrollEnd} />
      </div>

      <form onSubmit={handleSend} className="px-4 py-3 border-t border-white/[0.04] flex-shrink-0 bg-surface-800/50 backdrop-blur-xl">
        <div className={`flex items-center gap-2 bg-surface-700/60 rounded-xl px-4 py-2.5 border transition-all duration-300 ${
          isFocused ? 'border-primary/30 shadow-lg shadow-primary/5' : 'border-white/[0.03]'
        }`}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e) }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Reply in thread..."
            className="flex-1 text-sm bg-transparent border-none outline-none text-white placeholder-zinc-500"
          />
          <button type="submit" disabled={!input.trim()} className="text-primary hover:text-primary-light cursor-pointer transition-all duration-300 disabled:opacity-30 hover:scale-110">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
}

export default ThreadPanel
