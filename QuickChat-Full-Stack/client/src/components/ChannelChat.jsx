import React, { useContext, useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { AuthContext } from '../../context/AuthContext'
import { WorkspaceContext } from '../../context/WorkspaceContext'
import { ChatContext } from '../../context/ChatContext'
import { formatMessageTime } from '../lib/utils'
import toast from 'react-hot-toast'

const VoiceBubble = ({ url, duration, isOwn }) => {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef(null)
  const toggle = () => {
    if (!audioRef.current) { audioRef.current = new Audio(url); audioRef.current.onended = () => setPlaying(false) }
    if (playing) { audioRef.current.pause(); setPlaying(false) } else { audioRef.current.play(); setPlaying(true) }
  }
  const fmt = (s) => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl max-w-[200px] ${isOwn ? 'message-bubble-sent' : 'message-bubble-received'}`}>
      <button onClick={toggle} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center cursor-pointer flex-shrink-0">
        {playing ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
        : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>}
      </button>
      <span className="text-[10px] text-zinc-400">{fmt(duration || 0)}</span>
    </div>
  )
}

const MessageItem = React.memo(({ msg, isOwn, showAvatar, onContextMenu, onMouseEnter, onMouseLeave, selectedChannel, pinChannelMessage }) => {
  if (msg.deleted) {
    return (
      <div className="flex justify-start mb-3">
        <p className="px-5 py-2.5 text-sm italic text-zinc-600/60 bg-surface-700/30 rounded-full backdrop-blur-sm">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-1.5">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          Message deleted
        </p>
      </div>
    )
  }

  return (
    <div
      className={`flex gap-3 mb-1.5 ${isOwn ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-4' : ''} group/message`}
      onContextMenu={(e) => onContextMenu(e, msg)}
      onMouseEnter={() => onMouseEnter(msg._id)}
      onMouseLeave={onMouseLeave}
    >
      {!isOwn && showAvatar && (
        <div className="w-9 h-9 rounded-xl overflow-hidden shadow-lg shadow-black/10 flex-shrink-0">
          {msg.senderId?.profilePic ? (
            <img src={msg.senderId.profilePic} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-semibold">
              {msg.senderId?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
        </div>
      )}
      {!isOwn && !showAvatar && <div className="w-9 flex-shrink-0" />}

      <div className="max-w-[65%] relative">
        {!isOwn && showAvatar && (
          <p className="text-xs font-medium text-cyan mb-1.5 ml-1">{msg.senderId?.fullName}</p>
        )}

        {msg.image && (
          <div className="rounded-2xl overflow-hidden max-w-[300px] shadow-lg shadow-black/10 group-hover/message:shadow-xl transition-shadow">
            <img src={msg.image} alt="" className="w-full object-cover" />
          </div>
        )}
        {msg.file?.isVoice && (
          <VoiceBubble url={msg.file.url} duration={msg.file.duration} isOwn={isOwn} />
        )}
        {!msg.file?.isVoice && msg.file?.url && (
          <a href={msg.file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-700/60 border border-white/5 hover:bg-surface-600/60 transition-colors max-w-[250px]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary flex-shrink-0"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span className="text-xs text-zinc-300 truncate">{msg.file.name}</span>
          </a>
        )}
        {msg.text && (
          <div className={`px-4 py-2.5 text-sm leading-relaxed ${
            isOwn ? 'message-bubble-sent text-white' : 'message-bubble-received text-zinc-100'
          }`}>
            <p className="break-words">{msg.text}</p>
            <div className={`flex items-center gap-2 mt-1 ${isOwn ? 'justify-end' : ''}`}>
              {msg.edited && <span className="text-[10px] opacity-50">edited</span>}
              {msg.pinned && <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-400"><path d="M12 17v5"/><path d="M9 2h6l-1.5 6h-3L9 2z"/></svg>}
              <span className="text-[10px] opacity-40">{formatMessageTime(msg.createdAt)}</span>
            </div>
          </div>
        )}

        {msg.reactions?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {msg.reactions.map((r, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded-full bg-surface-700/80 border border-white/5 flex items-center gap-1 hover:scale-105 transition-transform cursor-pointer">
                {r.emoji} {r.users?.length > 1 && <span className="text-[10px] text-zinc-400">{r.users.length}</span>}
              </span>
            ))}
          </div>
        )}
        {msg.threadCount > 0 && (
          <p className="text-xs text-cyan/70 mt-1.5 cursor-pointer hover:text-cyan flex items-center gap-1.5 transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            {msg.threadCount} {msg.threadCount === 1 ? 'reply' : 'replies'}
          </p>
        )}
      </div>
    </div>
  )
})

const ChannelChat = () => {
  const { authUser } = useContext(AuthContext)
  const {
    selectedWorkspace, selectedChannel, channelMessages,
    sendChannelMessage, pinChannelMessage,
  } = useContext(WorkspaceContext)
  const { openThread } = useContext(ChatContext)

  const [input, setInput] = useState('')
  const [contextMenu, setContextMenu] = useState(null)
  const [hoveredMsg, setHoveredMsg] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isFocused, setIsFocused] = useState(false)
  const scrollEnd = useRef()

  const handleSend = useCallback(async (e) => {
    e?.preventDefault()
    if (!input.trim() && !imagePreview) return
    await sendChannelMessage(input.trim() || undefined, imagePreview || undefined)
    setInput('')
    setImagePreview(null)
  }, [input, imagePreview, sendChannelMessage])

  const handleSendImage = useCallback((e) => {
    const file = e.target.files[0]
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Select an image file')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [])

  const handleContextMenu = useCallback((e, msg) => {
    e.preventDefault()
    setContextMenu({ messageId: msg._id, isOwn: msg.senderId?._id === authUser._id, x: e.clientX, y: e.clientY })
  }, [authUser._id])

  const handleMouseEnter = useCallback((msgId) => setHoveredMsg(msgId), [])
  const handleMouseLeave = useCallback(() => setHoveredMsg(null), [])

  useEffect(() => {
    scrollEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [channelMessages])

  useEffect(() => {
    const close = () => setContextMenu(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [])

  const messageList = useMemo(() => {
    return channelMessages.map((msg, index) => {
      const isOwn = msg.senderId?._id === authUser._id
      const showAvatar = index === 0 || channelMessages[index - 1]?.senderId?._id !== msg.senderId?._id
      return (
        <MessageItem
          key={msg._id || index}
          msg={msg}
          isOwn={isOwn}
          showAvatar={showAvatar}
          onContextMenu={handleContextMenu}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          selectedChannel={selectedChannel}
          pinChannelMessage={pinChannelMessage}
        />
      )
    })
  }, [channelMessages, authUser._id, handleContextMenu, handleMouseEnter, handleMouseLeave, selectedChannel, pinChannelMessage])

  if (!selectedChannel) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 relative overflow-hidden">
        <div className="chat-gradient-orb chat-gradient-orb-3 opacity-10" />
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan/20 to-primary/20 flex items-center justify-center backdrop-blur-xl border border-white/5 shadow-2xl">
            <span className="text-3xl font-bold text-cyan">#</span>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-white">Select a channel</h2>
        <p className="text-sm text-zinc-400">Pick a channel from the sidebar</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="chat-gradient-orb chat-gradient-orb-1 opacity-[0.03]" />
      </div>

      <div className="relative z-10 flex items-center gap-3 px-5 py-4 border-b border-white/[0.04] bg-surface-800/50 backdrop-blur-xl flex-shrink-0">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan/20 to-primary/20 flex items-center justify-center text-xl font-bold text-cyan shadow-lg shadow-cyan/10">#</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{selectedChannel.name}</p>
          {selectedChannel.topic && <p className="text-xs text-zinc-500 truncate">{selectedChannel.topic}</p>}
        </div>
        {selectedChannel.slowMode > 0 && (
          <span className="text-xs text-warning bg-warning/10 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            Slow: {selectedChannel.slowMode}s
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-1 relative z-10">
        {messageList}
        <div ref={scrollEnd} />
      </div>

      {contextMenu && (
        <div
          className="fixed glass-strong rounded-xl shadow-2xl z-[100] py-1.5 min-w-[180px] scale-in overflow-hidden"
          style={{ top: Math.min(contextMenu.y, window.innerHeight - 150), left: Math.min(contextMenu.x, window.innerWidth - 200) }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={() => { pinChannelMessage(selectedChannel._id, contextMenu.messageId); setContextMenu(null) }} className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 flex items-center gap-3 cursor-pointer transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 17v5"/><path d="M9 2h6l-1.5 6h-3L9 2z"/></svg>
            Pin Message
          </button>
          <button onClick={() => { openThread(contextMenu.messageId); setContextMenu(null) }} className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 flex items-center gap-3 cursor-pointer transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Reply in Thread
          </button>
        </div>
      )}

      {imagePreview && (
        <div className="relative z-10 px-5 pb-2 fade-in">
          <div className="relative inline-block group">
            <img src={imagePreview} alt="" className="max-h-40 rounded-2xl border border-white/10 shadow-xl" />
            <button onClick={() => setImagePreview(null)} className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-danger text-white flex items-center justify-center text-xs cursor-pointer hover:bg-danger/80 transition-all shadow-lg shadow-danger/20 opacity-0 group-hover:opacity-100">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
      )}

      <div className="relative z-10 px-5 py-4 border-t border-white/[0.04] bg-gradient-to-t from-surface-900/80 to-transparent backdrop-blur-xl flex-shrink-0">
        <form onSubmit={handleSend} className="flex items-end gap-3">
          <div className={`flex-1 flex items-end gap-3 bg-surface-700/60 rounded-2xl px-4 py-3 border transition-all duration-300 ${
            isFocused ? 'border-cyan/30 shadow-lg shadow-cyan/5 bg-surface-700/80' : 'border-white/[0.03]'
          }`}>
            <input type="file" id="channel-image" accept="image/*" hidden onChange={handleSendImage} />
            <label htmlFor="channel-image" className="cursor-pointer text-zinc-400 hover:text-white transition-all pb-0.5 hover:scale-110">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </label>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e) }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={`Message #${selectedChannel.name}`}
              className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-zinc-500"
            />
          </div>
          <button type="submit" disabled={!input.trim() && !imagePreview} className="w-12 h-12 rounded-2xl bg-gradient-to-r from-cyan to-primary flex items-center justify-center cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-cyan/30 hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-cyan/20">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChannelChat
