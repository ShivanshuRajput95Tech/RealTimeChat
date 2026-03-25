import React, { useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { formatMessageTime } from '../lib/utils'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'
import EmojiPicker from './EmojiPicker'
import VoiceRecorderButton from './VoiceRecorderButton'
import WritingCoach from './WritingCoach'
import ScheduleMessageModal from './ScheduleMessageModal'
import ScheduledMessagesPanel from './ScheduledMessagesPanel'
import toast from 'react-hot-toast'

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉']

const MessageStatus = React.memo(({ status }) => {
  if (status === 'sending') {
    return (
      <svg className="w-3.5 h-3.5 text-zinc-400 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="20">
          <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
        </circle>
      </svg>
    )
  }
  if (status === 'sent') {
    return (
      <svg className="w-3.5 h-3.5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round">
          <animate attributeName="stroke-dasharray" from="0,50" to="50,0" dur="0.2s" fill="freeze"/>
        </polyline>
      </svg>
    )
  }
  if (status === 'delivered') {
    return (
      <svg className="w-3.5 h-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="20 12 9 23 4 18" strokeLinecap="round" strokeLinejoin="round">
          <animate attributeName="stroke-dasharray" from="0,50" to="50,0" dur="0.2s" fill="freeze"/>
        </polyline>
      </svg>
    )
  }
  if (status === 'seen') {
    return (
      <div className="flex items-center -space-x-1">
        <svg className="w-3.5 h-3.5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" fill="currentColor" opacity="0.3"/>
          <circle cx="12" cy="12" r="4" fill="currentColor"/>
        </svg>
        <svg className="w-3.5 h-3.5 text-success -ml-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" fill="currentColor" opacity="0.3"/>
          <circle cx="12" cy="12" r="4" fill="currentColor"/>
        </svg>
      </div>
    )
  }
  return null
})

const TypingIndicator = React.memo(({ userName }) => (
  <div className="flex items-end gap-3 mb-3 fade-in" role="status" aria-label={`${userName} is typing`}>
    <div className="relative">
      <div className="w-10 h-10 rounded-2xl overflow-hidden ring-2 ring-primary/20 shadow-lg shadow-primary/10">
        <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
    <div className="bg-surface-700/80 backdrop-blur-xl rounded-3xl rounded-bl-md px-5 py-4 flex items-center gap-1.5 shadow-xl shadow-black/20 border border-white/5">
      <span className="w-2.5 h-2.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2.5 h-2.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2.5 h-2.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  </div>
))

const MessageBubble = React.memo(({ msg, isOwn, showAvatar, avatar, name, onReact, onThread, onEdit, onDelete, isHovered, isEditing, editInput, setEditInput, onEditSubmit, onCancelEdit, authUserId }) => {
  const inputRef = useRef(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  if (isEditing) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3 scale-in`}>
        <form onSubmit={onEditSubmit} className="max-w-[75%]">
          <div className="relative overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 animate-shimmer opacity-50" />
            <div className="relative bg-gradient-to-br from-surface-700/90 to-surface-750/90 backdrop-blur-xl rounded-2xl p-4 shadow-2xl shadow-black/30 border border-primary/20">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-white/5 to-transparent pointer-events-none" />
              <textarea
                ref={inputRef}
                value={editInput}
                onChange={(e) => setEditInput(e.target.value)}
                className="relative bg-transparent text-white text-sm outline-none w-full resize-none min-h-[60px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    onEditSubmit(e)
                  }
                  if (e.key === 'Escape') onCancelEdit()
                }}
              />
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/10">
                <button type="submit" className="text-xs font-semibold text-success hover:text-success-light cursor-pointer flex items-center gap-1.5 transition-all hover:scale-105">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Save
                </button>
                <button type="button" onClick={onCancelEdit} className="text-xs text-zinc-400 hover:text-white cursor-pointer transition-colors">Cancel</button>
                <span className="text-[10px] text-zinc-600 ml-auto flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-surface-600/50 rounded text-zinc-500">Enter</kbd> to send
                </span>
              </div>
            </div>
          </div>
        </form>
      </div>
    )
  }

  if (msg.deleted) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
        <div className="px-5 py-3 text-sm italic text-zinc-500/60 bg-surface-700/20 rounded-2xl backdrop-blur-sm border border-white/5 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-50">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
          This message was deleted
        </div>
      </div>
    )
  }

  return (
    <div className={`flex gap-3 mb-1.5 ${isOwn ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-4' : ''} group/message`}>
      {!isOwn && (
        <div className="w-10 flex-shrink-0">
          {showAvatar && (
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-xl shadow-black/20 ring-2 ring-white/5 transform transition-transform group-hover/message:scale-105">
                {avatar ? (
                  <img src={avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary via-accent to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                    {name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-surface-700 rounded-full flex items-center justify-center ring-2 ring-surface-800">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              </div>
            </div>
          )}
        </div>
      )}

      <div className={`max-w-[70%] relative ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {showAvatar && !isOwn && (
          <p className="text-xs text-zinc-500 mb-1.5 ml-1 font-medium">{name}</p>
        )}

        <div className={`relative ${isOwn ? 'order-2' : ''}`}>
          {isHovered && !msg.deleted && (
            <div className={`absolute -top-12 z-20 flex items-center gap-0.5 bg-surface-800/95 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-black/40 px-1.5 py-1.5 scale-in border border-white/10`}>
              {QUICK_EMOJIS.slice(0, 3).map((emoji, idx) => (
                <button
                  key={emoji}
                  onClick={() => onReact(msg._id, emoji)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-surface-600/80 cursor-pointer transition-all duration-200 text-lg hover:scale-110 hover:rotate-6"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  {emoji}
                </button>
              ))}
              <div className="w-px h-6 bg-white/10 mx-1" />
              <button
                onClick={() => onThread(msg._id)}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-surface-600/80 cursor-pointer transition-colors text-zinc-400 hover:text-white"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </button>
              <button
                onClick={() => onPin(msg._id)}
                className={`w-8 h-8 rounded-xl flex items-center justify-center hover:bg-surface-600/80 cursor-pointer transition-colors ${msg.pinned ? 'text-yellow-400' : 'text-zinc-400 hover:text-white'}`}
                title={msg.pinned ? "Unpin message" : "Pin message"}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill={msg.pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M12 17v5"/>
                  <path d="M9 2h6l-1.5 6h-3L9 2z"/>
                </svg>
              </button>
              {isOwn && (
                <>
                  <div className="w-px h-6 bg-white/10 mx-1" />
                  <button
                    onClick={() => onEdit(msg)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-surface-600/80 cursor-pointer transition-colors text-zinc-400 hover:text-white"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(msg._id)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-danger/20 cursor-pointer transition-colors text-danger/60 hover:text-danger"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </>
              )}
            </div>
          )}

          {msg.image && (
            <div className={`relative overflow-hidden rounded-2xl max-w-[300px] ${isOwn ? 'rounded-br-md' : 'rounded-bl-md'} shadow-xl shadow-black/25 group-hover/message:shadow-2xl group-hover/message:shadow-black/40 transition-all duration-300`}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              <img src={msg.image} alt="" className="w-full object-cover hover:scale-[1.02] transition-transform duration-300" />
            </div>
          )}
          {msg.file?.isVoice && (
            <VoiceMessageBubble url={msg.file.url} duration={msg.file.duration} isOwn={isOwn} />
          )}
          {!msg.file?.isVoice && msg.file?.url && (
            <a href={msg.file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-700/60 border border-white/5 hover:bg-surface-600/60 transition-colors max-w-[300px]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary flex-shrink-0">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
              <div className="min-w-0">
                <p className="text-sm text-white truncate">{msg.file.name}</p>
                <p className="text-[10px] text-zinc-500">{msg.file.size ? `${(msg.file.size / 1024).toFixed(1)} KB` : ''}</p>
              </div>
            </a>
          )}
          {msg.text && (
            <div className={`relative px-5 py-3.5 text-sm leading-relaxed ${
              isOwn
                ? 'message-bubble-sent'
                : 'message-bubble-received'
            }`}>
              {isOwn && (
                <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-50" />
                </div>
              )}
              <p className="relative break-words">
                {msg.forwardedFrom && (
                  <span className="block text-[10px] opacity-50 mb-1 flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="15 17 20 12 15 7"/>
                      <path d="M4 20v-5a4 4 0 0 1 4-4h12"/>
                    </svg>
                    Forwarded{msg.forwardedFromUser?.fullName ? ` from ${msg.forwardedFromUser.fullName}` : ''}
                  </span>
                )}
                {msg.text}
              </p>
              <div className={`relative flex items-center gap-2 mt-1.5 ${isOwn ? 'justify-end' : ''}`}>
                <span className="text-[10px] opacity-40">{formatMessageTime(msg.createdAt)}</span>
                {msg.edited && (
                  <span className="text-[10px] opacity-40 flex items-center gap-0.5">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    edited
                  </span>
                )}
                {msg.pinned && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-400">
                    <path d="M12 17v5M9 2h6l-1.5 6h-3L9 2z"/>
                  </svg>
                )}
                {isOwn && (
                  <MessageStatus status={msg.seen ? 'seen' : msg.delivered ? 'delivered' : 'sent'} />
                )}
              </div>
            </div>
          )}

          {msg.reactions && msg.reactions.length > 0 && (
            <div className={`flex flex-wrap gap-1.5 mt-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              {msg.reactions.map((r, i) => (
                <button
                  key={i}
                  onClick={() => onReact(msg._id, r.emoji)}
                  className={`text-xs px-2.5 py-1.5 rounded-full cursor-pointer transition-all duration-200 flex items-center gap-1 hover:scale-105 ${
                    r.users?.some(u => (typeof u === 'string' ? u : u._id) === authUserId)
                      ? 'bg-primary/25 border border-primary/40 text-white shadow-lg shadow-primary/20'
                      : 'bg-surface-700/80 border border-white/5 hover:bg-surface-600/80 backdrop-blur-sm'
                  }`}
                >
                  <span className="text-base">{r.emoji}</span>
                  {r.users?.length > 1 && <span className="text-[10px] text-zinc-400 font-medium">{r.users.length}</span>}
                </button>
              ))}
            </div>
          )}

          {msg.threadCount > 0 && (
            <button
              onClick={() => onThread(msg._id)}
              className="flex items-center gap-2 mt-2 text-xs text-primary/70 hover:text-primary cursor-pointer transition-colors group/thread"
            >
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <span className="font-medium">{msg.threadCount} {msg.threadCount === 1 ? 'reply' : 'replies'}</span>
              <span className="text-primary/50 group-hover/thread:underline">View thread</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
})

const ChatContainer = ({ startCall }) => {
  const {
    messages, selectedUser, sendMessage, getMessages,
    toggleReaction, editMessage, deleteMessage,
    openThread, sendTyping, typingUsers,
    togglePin, pinnedMessages,
    editingMessage, setEditingMessage,
    forwardMessage, bookmarkMessage,
  } = useContext(ChatContext)

  const { authUser, onlineUsers, userStatuses } = useContext(AuthContext)

  const scrollEnd = useRef()
  const typingTimeout = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)
  const messagesContainerRef = useRef(null)

   const [input, setInput] = useState('')
   const [reactionPicker, setReactionPicker] = useState(null)
   const [contextMenu, setContextMenu] = useState(null)
   const [editInput, setEditInput] = useState('')
   const [showPinned, setShowPinned] = useState(false)
   const [hoveredMsg, setHoveredMsg] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [isFocused, setIsFocused] = useState(false)
    const [isNearBottom, setIsNearBottom] = useState(true)
    const [messageStatus, setMessageStatus] = useState({})
    const [forwardModal, setForwardModal] = useState(null)
    const [showWritingCoach, setShowWritingCoach] = useState(false)
    const [showScheduleModal, setShowScheduleModal] = useState(false)
    const [showScheduledPanel, setShowScheduledPanel] = useState(false)

  const handleScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight
      setIsNearBottom(distanceFromBottom < 100)
    }
  }, [])

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    scrollEnd.current?.scrollIntoView({ behavior })
  }, [])

  const handleSendMessage = useCallback(async (e) => {
    e?.preventDefault()
    if (input.trim() === '' && !imagePreview) return
    
    if (imagePreview) {
      const tempId = Date.now().toString()
      setMessageStatus(prev => ({ ...prev, [tempId]: 'sending' }))
      await sendMessage({ image: imagePreview })
      setImagePreview(null)
    }
    if (input.trim()) {
      const tempId = Date.now().toString()
      setMessageStatus(prev => ({ ...prev, [tempId]: 'sending' }))
      await sendMessage({ text: input.trim() })
      setMessageStatus(prev => ({ ...prev, [tempId]: 'sent' }))
      setTimeout(() => {
        setMessageStatus(prev => {
          const updated = { ...prev }
          delete updated[tempId]
          return updated
        })
      }, 2000)
    }
    setInput('')
    sendTyping(false)
  }, [input, imagePreview, sendMessage, sendTyping])

  const handleInputChange = useCallback((e) => {
    setInput(e.target.value)
    sendTyping(true)
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => sendTyping(false), 2000)
  }, [sendTyping])

  const handleSendImage = useCallback(async (e) => {
    const file = e.target.files[0]
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Select an image file')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [])

  const handleContextMenu = useCallback((e, msg) => {
    e.preventDefault()
    if (msg.deleted) return
    setContextMenu({
      messageId: msg._id,
      isOwn: msg.senderId === authUser._id || msg.senderId?._id === authUser._id,
      x: e.clientX,
      y: e.clientY,
    })
  }, [authUser._id])

  const handleStartEdit = useCallback((msg) => {
    setEditingMessage(msg._id)
    setEditInput(msg.text)
    setContextMenu(null)
  }, [setEditingMessage])

  const handleEditSubmit = useCallback(async (e) => {
    e.preventDefault()
    if (!editInput.trim()) return
    await editMessage(editingMessage, editInput.trim())
  }, [editInput, editingMessage, editMessage])

  const handleDelete = useCallback(async (messageId) => {
    setContextMenu(null)
    await deleteMessage(messageId)
  }, [deleteMessage])

  const handleReaction = useCallback(async (messageId, emoji) => {
    await toggleReaction(messageId, emoji)
    setReactionPicker(null)
  }, [toggleReaction])

  const isSelectedUserTyping = selectedUser && typingUsers[selectedUser._id]

  useEffect(() => {
    if (selectedUser) getMessages(selectedUser._id)
  }, [selectedUser, getMessages])

  useEffect(() => {
    if (isNearBottom) {
      scrollToBottom('smooth')
    }
  }, [messages, isNearBottom, scrollToBottom])

  useEffect(() => {
    const close = () => { setContextMenu(null); setReactionPicker(null) }
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [])

  const userStatus = useMemo(() => {
    if (!selectedUser) return 'offline'
    return userStatuses[selectedUser._id]?.status || (onlineUsers.includes(selectedUser._id) ? 'online' : 'offline')
  }, [selectedUser, userStatuses, onlineUsers])

  const groupedMessages = useMemo(() => {
    const groups = []
    let currentGroup = []
    
    messages.forEach((msg, index) => {
      const isOwn = msg.senderId === authUser._id || msg.senderId?._id === authUser._id
      const prevMsg = messages[index - 1]
      const isFirstOfGroup = !prevMsg || prevMsg.senderId !== msg.senderId
      
      if (isFirstOfGroup && currentGroup.length > 0) {
        groups.push(currentGroup)
        currentGroup = []
      }
      currentGroup.push({ ...msg, isOwn, showAvatar: isFirstOfGroup })
    })
    
    if (currentGroup.length > 0) {
      groups.push(currentGroup)
    }
    
    return groups
  }, [messages, authUser._id])

  if (!selectedUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-8 relative overflow-hidden aurora-bg">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        
        <div className="relative">
          <div className="w-28 h-28 rounded-[32px] bg-gradient-to-br from-primary/20 via-accent/10 to-cyan-500/20 flex items-center justify-center backdrop-blur-2xl border border-white/10 shadow-2xl shadow-primary/20 transform hover:scale-105 transition-transform duration-500 liquid-glass">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/30">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="transform hover:scale-110 transition-transform">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                <path d="M8 10h8M8 14h4" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-gradient-to-br from-success to-cyan-500 flex items-center justify-center shadow-lg shadow-success/30 border-2 border-surface-900 liquid-glass">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </div>
        </div>
        
        <div className="text-center relative z-10">
          <h2 className="text-2xl font-bold text-white mb-3 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Welcome to QuickChat
          </h2>
          <p className="text-sm text-zinc-400 max-w-xs">
            Select a conversation from the sidebar to start messaging in real-time
          </p>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <div className="flex -space-x-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-accent border-2 border-surface-900 flex items-center justify-center text-white font-bold text-sm shadow-lg hover-lift">
                {String.fromCharCode(64 + i)}
              </div>
            ))}
          </div>
          <span className="text-sm text-zinc-500 ml-2">Join your team</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/3 via-transparent to-accent/3 pointer-events-none" />
      
      <div className="relative z-10 flex items-center gap-4 px-6 py-4 border-b border-white/[0.06] bg-surface-800/60 backdrop-blur-2xl flex-shrink-0">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-primary/20 shadow-xl shadow-primary/10 transform hover:scale-105 transition-transform duration-300">
            {selectedUser.profilePic ? (
              <img
                src={selectedUser.profilePic}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary via-accent to-cyan-500 flex items-center justify-center text-white font-bold">
                {selectedUser.fullName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-3 border-surface-800 status-${userStatus} shadow-lg`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-white flex items-center gap-2">
            {selectedUser.fullName}
            {userStatus === 'online' && (
              <span className="w-2 h-2 bg-success rounded-full animate-pulse shadow-lg shadow-success/50" />
            )}
          </p>
          {isSelectedUserTyping ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-primary font-medium">typing</span>
            </div>
          ) : (
            <p className="text-xs text-zinc-500 flex items-center gap-2">
              {userStatuses[selectedUser._id]?.statusText || (onlineUsers.includes(selectedUser._id) ? (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-success rounded-full" />
                  Active now
                </span>
              ) : 'Offline')}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPinned(!showPinned)}
            className={`w-11 h-11 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 ${
              showPinned 
                ? 'bg-primary/20 text-primary shadow-lg shadow-primary/20 ring-2 ring-primary/30' 
                : 'text-zinc-400 hover:text-white hover:bg-surface-700/60'
            }`}
            title="Pinned messages"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 17v5"/>
              <path d="M9 2h6l-1.5 6h-3L9 2z"/>
              <path d="M5.5 8h13a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v0a2 2 0 0 1 2-2z"/>
            </svg>
          </button>
          {startCall && (
            <>
              <button
                onClick={() => startCall('audio')}
                className="w-11 h-11 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-surface-700/60 cursor-pointer transition-all duration-300 hover:scale-110 hover:rotate-12"
                title="Audio call"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </button>
              <button
                onClick={() => startCall('video')}
                className="w-11 h-11 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-surface-700/60 cursor-pointer transition-all duration-300 hover:scale-110 hover:-rotate-12"
                title="Video call"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {showPinned && (
        <div className="relative z-10 mx-4 mt-3 p-4 bg-surface-800/80 backdrop-blur-2xl rounded-2xl max-h-[180px] overflow-y-auto scale-in border border-white/5 shadow-xl shadow-black/20">
          <div className="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-400">
              <path d="M12 17v5M9 2h6l-1.5 6h-3L9 2z"/>
            </svg>
            <p className="text-xs text-zinc-400 font-medium">Pinned Messages ({pinnedMessages.length})</p>
          </div>
          {pinnedMessages.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-4">No pinned messages yet</p>
          ) : (
            pinnedMessages.map((msg) => (
              <div key={msg._id} className="flex items-start gap-3 mb-2 last:mb-0 p-2.5 rounded-xl hover:bg-white/[0.03] transition-colors group cursor-pointer">
                <p className="text-sm text-zinc-300 flex-1 line-clamp-2">{msg.text || '[Image]'}</p>
                <button onClick={() => togglePin(msg._id)} className="text-xs text-zinc-500 hover:text-danger cursor-pointer flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all px-2 py-1 rounded-lg hover:bg-danger/10">
                  Unpin
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {!isNearBottom && messages.length > 0 && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className="absolute z-20 bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-surface-700/90 backdrop-blur-xl rounded-full shadow-lg border border-white/10 hover:bg-surface-600 transition-all hover:scale-105"
          aria-label="Scroll to latest messages"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
          <span className="text-sm">New messages</span>
        </button>
      )}

       <div 
         ref={messagesContainerRef}
         onScroll={handleScroll}
         className="flex-1 overflow-y-auto px-6 py-5 space-y-1 relative z-10 custom-scrollbar"
         role="log"
         aria-label="Chat messages"
         aria-live="polite"
       >
         {groupedMessages.map((group, groupIndex) => {
           return group.map((msg, msgIndex) => (
            <MessageBubble
               key={msg._id || `msg-${groupIndex}-${msgIndex}`}
               msg={msg}
               isOwn={msg.isOwn}
               showAvatar={msg.showAvatar}
               avatar={selectedUser.profilePic}
               name={selectedUser.fullName}
               onReact={handleReaction}
               onThread={openThread}
               onEdit={handleStartEdit}
               onDelete={handleDelete}
               onPin={togglePin}
               isHovered={hoveredMsg === msg._id}
               isEditing={editingMessage === msg._id}
               editInput={editInput}
               setEditInput={setEditInput}
               onEditSubmit={handleEditSubmit}
               onCancelEdit={() => setEditingMessage(null)}
               authUserId={authUser._id}
             />
          ))
        })}

        {isSelectedUserTyping && <TypingIndicator userName={selectedUser.fullName} />}

        <div ref={scrollEnd} />
      </div>

      {contextMenu && (
        <div
          className="fixed bg-surface-800/95 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-black/40 z-[100] py-2 min-w-[200px] max-h-[70vh] overflow-y-auto custom-scrollbar scale-in border border-white/10"
          style={{
            top: Math.max(8, Math.min(contextMenu.y, window.innerHeight - 380)),
            left: Math.max(8, Math.min(contextMenu.x, window.innerWidth - 220)),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={() => { setReactionPicker(contextMenu.messageId); setContextMenu(null) }} className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 flex items-center gap-3 cursor-pointer transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
            Add Reaction
          </button>
          <button onClick={() => { openThread(contextMenu.messageId); setContextMenu(null) }} className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 flex items-center gap-3 cursor-pointer transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Reply in Thread
          </button>
           <button onClick={() => { togglePin(contextMenu.messageId); setContextMenu(null) }} className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 flex items-center gap-3 cursor-pointer transition-colors">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
               <path d="M12 17v5"/>
               <path d="M9 2h6l-1.5 6h-3L9 2z"/>
             </svg>
             {messages.find(m => m._id === contextMenu.messageId)?.pinned ? 'Unpin' : 'Pin Message'}
           </button>
           <button onClick={() => { setForwardModal(contextMenu.messageId); setContextMenu(null) }} className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 flex items-center gap-3 cursor-pointer transition-colors">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
               <polyline points="15 17 20 12 15 7"/>
               <path d="M4 20v-5a4 4 0 0 1 4-4h12"/>
             </svg>
             Forward Message
           </button>
           <button onClick={() => { bookmarkMessage(contextMenu.messageId); setContextMenu(null) }} className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 flex items-center gap-3 cursor-pointer transition-colors">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
               <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
             </svg>
             Bookmark Message
           </button>
          {contextMenu.isOwn && (
            <>
              <div className="h-px bg-white/10 my-1" />
              <button onClick={() => handleStartEdit(messages.find(m => m._id === contextMenu.messageId))} className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 flex items-center gap-3 cursor-pointer transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit Message
              </button>
              <button onClick={() => handleDelete(contextMenu.messageId)} className="w-full text-left px-4 py-2.5 text-sm text-danger hover:bg-danger/10 flex items-center gap-3 cursor-pointer transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                Delete Message
              </button>
            </>
          )}
        </div>
      )}

       {reactionPicker && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setReactionPicker(null)}>
           <div onClick={(e) => e.stopPropagation()} className="scale-in">
             <EmojiPicker onSelect={(emoji) => handleReaction(reactionPicker, emoji)} onClose={() => setReactionPicker(null)} />
           </div>
         </div>
       )}

       {forwardModal && (
         <ForwardModal
           messageId={forwardModal}
           onForward={(target) => { forwardMessage(forwardModal, target); setForwardModal(null) }}
           onClose={() => setForwardModal(null)}
         />
       )}

       <ScheduleMessageModal
         isOpen={showScheduleModal}
         onClose={() => setShowScheduleModal(false)}
         receiverId={selectedUser?._id}
         onSchedule={() => {}}
       />

       <ScheduledMessagesPanel
         isOpen={showScheduledPanel}
         onClose={() => setShowScheduledPanel(false)}
       />

      {imagePreview && (
        <div className="relative z-10 px-5 pb-2 fade-in">
          <div className="relative inline-block group">
            <img src={imagePreview} alt="" className="max-h-48 rounded-2xl border-2 border-white/10 shadow-2xl transform hover:scale-[1.02] transition-transform" />
            <button
              onClick={() => setImagePreview(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-danger text-white flex items-center justify-center cursor-pointer hover:bg-danger/80 transition-all shadow-xl shadow-danger/30 opacity-0 group-hover:opacity-100"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="relative z-10 px-5 py-4 border-t border-white/[0.06] bg-gradient-to-t from-surface-900/90 via-surface-900/95 to-transparent backdrop-blur-2xl flex-shrink-0">
        {showWritingCoach && input.trim().length >= 10 && (
          <div className="mb-3">
            <WritingCoach text={input} onApply={(text) => { setInput(text); setShowWritingCoach(false) }} onClose={() => setShowWritingCoach(false)} />
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex items-end gap-3">
          <div className={`flex-1 flex items-end gap-3 bg-surface-700/60 rounded-2xl px-4 py-3 border transition-all duration-300 ${
            isFocused ? 'border-primary/40 shadow-lg shadow-primary/10 bg-surface-700/90' : 'border-white/[0.05]'
          }`}>
            <input
              type="file"
              id="dm-image-modern"
              accept="image/png, image/jpeg, image/gif, image/webp"
              hidden
              ref={fileInputRef}
              onChange={handleSendImage}
            />
            <label 
              htmlFor="dm-image-modern" 
              className="cursor-pointer text-zinc-400 hover:text-white transition-all pb-0.5 hover:scale-110 hover:rotate-12"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeDasharray="4 2"/>
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </label>
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => { 
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage(e)
                }
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              type="text"
              placeholder="Type a message..."
              rows={1}
              className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-zinc-500 min-h-[24px] max-h-[120px] resize-none"
              style={{ height: 'auto' }}
            />
          </div>
          <button
            onClick={(e) => { e.preventDefault(); setShowWritingCoach(!showWritingCoach) }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 ${
              showWritingCoach ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-zinc-400 hover:text-white hover:bg-surface-700/60'
            }`}
            title="Writing Coach"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.preventDefault(); setShowScheduleModal(true) }}
            className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 text-zinc-400 hover:text-white hover:bg-surface-700/60"
            title="Schedule Message"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </button>
          <button
            onClick={(e) => { e.preventDefault(); setShowScheduledPanel(true) }}
            className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 text-zinc-400 hover:text-white hover:bg-surface-700/60 relative"
            title="View Scheduled Messages"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
            </svg>
          </button>
          <VoiceRecorderButton />
          <button
            type="submit"
            disabled={!input.trim() && !imagePreview}
            className="w-12 h-12 rounded-2xl bg-gradient-to-r from-primary via-primary-dark to-accent flex items-center justify-center cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-primary/30 hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none shadow-xl shadow-primary/20 transform hover:-rotate-3 press-effect"
            aria-label="Send message"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="transform translate-x-0.5">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}

const VoiceMessageBubble = ({ url, duration, isOwn }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef(null)

  const togglePlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(url)
      audioRef.current.onended = () => { setIsPlaying(false); setProgress(0) }
      audioRef.current.ontimeupdate = () => {
        if (audioRef.current) setProgress((audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100)
      }
    }
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false) }
    else { audioRef.current.play(); setIsPlaying(true) }
  }

  const formatDuration = (s) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl max-w-[280px] ${isOwn ? 'message-bubble-sent' : 'message-bubble-received'}`}>
      <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors flex-shrink-0">
        {isPlaying ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        )}
      </button>
      <div className="flex-1">
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-[10px] text-zinc-400 mt-1 block">{formatDuration(duration || 0)}</span>
      </div>
    </div>
  )
}

const ForwardModal = ({ messageId, onForward, onClose }) => {
  const { users } = useContext(ChatContext)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('users')

  const filteredUsers = useMemo(() => {
    if (!search) return users
    return users.filter(u => u.fullName.toLowerCase().includes(search.toLowerCase()))
  }, [users, search])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-800/95 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-black/40 w-[400px] max-h-[500px] overflow-hidden border border-white/10 scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-white font-semibold text-lg">Forward Message</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white cursor-pointer transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="p-3">
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-700/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none border border-white/5 focus:border-primary/40 transition-colors"
              autoFocus
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            {filteredUsers.map(user => (
              <button
                key={user._id}
                onClick={() => onForward({ receiverId: user._id })}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                  {user.profilePic ? (
                    <img src={user.profilePic} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
                      {user.fullName?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{user.fullName}</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500">
                  <polyline points="15 17 20 12 15 7"/><path d="M4 20v-5a4 4 0 0 1 4-4h12"/>
                </svg>
              </button>
            ))}
            {filteredUsers.length === 0 && (
              <p className="text-center text-zinc-500 text-sm py-6">No users found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatContainer
