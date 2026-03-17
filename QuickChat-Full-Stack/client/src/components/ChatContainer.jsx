import React, { useContext, useEffect, useRef, useState } from 'react'
import assets from '../assets/assets'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'
import { ThemeContext } from '../../context/ThemeContext'
import MessageBubble from './ui/MessageBubble'
import TypingIndicator from './ui/TypingIndicator'
import toast from 'react-hot-toast'

const ChatContainer = () => {
  const { messages, selectedUser, setSelectedUser, sendMessage, getMessages, isTyping, typingTimeout, setTypingTimeout } = useContext(ChatContext)
  const { authUser, onlineUsers, socket } = useContext(AuthContext)
  const { isDark } = useContext(ThemeContext)

  const scrollEnd = useRef(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (input.trim() === '') return
    
    setLoading(true)
    // Stop typing when sending
    if (socket && selectedUser) {
      socket.emit('stopTyping', { userId: authUser._id, receiverId: selectedUser._id })
    }
    try {
      await sendMessage({ text: input.trim() })
      setInput('')
    } catch (error) {
      toast.error('Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const value = e.target.value
    setInput(value)

    // Emit typing event
    if (socket && selectedUser && value.trim()) {
      socket.emit('typing', { userId: authUser._id, receiverId: selectedUser._id })

      // Clear previous timeout
      if (typingTimeout) clearTimeout(typingTimeout)

      // Set new timeout to stop typing after 3 seconds of inactivity
      const timeout = setTimeout(() => {
        socket.emit('stopTyping', { userId: authUser._id, receiverId: selectedUser._id })
      }, 3000)
      setTypingTimeout(timeout)
    } else if (!value.trim() && socket && selectedUser) {
      socket.emit('stopTyping', { userId: authUser._id, receiverId: selectedUser._id })
      if (typingTimeout) clearTimeout(typingTimeout)
    }
  }

  const handleSendImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please select an image (PNG/JPG)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = async () => {
      setLoading(true)
      try {
        await sendMessage({ image: reader.result })
        if (socket && selectedUser) {
          socket.emit('stopTyping', { userId: authUser._id, receiverId: selectedUser._id })
        }
      } catch (error) {
        toast.error('Failed to send image')
      } finally {
        setLoading(false)
        e.target.value = ''
      }
    }
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    if (!selectedUser) return
    getMessages(selectedUser._id)
  }, [selectedUser])

  useEffect(() => {
    scrollEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    return () => {
      if (typingTimeout) clearTimeout(typingTimeout)
    }
  }, [])

  if (!selectedUser) {
    return (
      <main className={`flex h-full flex-col items-center justify-center text-center px-6 ${isDark ? 'bg-slate-950/30' : 'bg-slate-100'}`}>
        <div className='text-6xl mb-4'>💬</div>
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Select a chat to start</h2>
        <p className={`text-sm mt-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Choose a contact from the sidebar to begin messaging.</p>
      </main>
    )
  }

  const isOnline = onlineUsers.includes(selectedUser._id)
  const peerIsTyping = isTyping[selectedUser._id]

  return (
    <section className={`relative h-full flex flex-col ${isDark ? 'bg-slate-950/40' : 'bg-white'}`}>
      {/* Header */}
      <header className={`flex items-center justify-between gap-3 border-b ${isDark ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-slate-50'} px-4 py-3 backdrop-blur-sm`}>
        <div className='flex items-center gap-3'>
          <button
            type='button'
            onClick={() => setSelectedUser(null)}
            className={`md:hidden rounded-lg p-1 transition ${isDark ? 'hover:bg-slate-700/40' : 'hover:bg-slate-200'}`}
          >
            <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
              <path fillRule='evenodd' d='M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z' clipRule='evenodd'/>
            </svg>
          </button>
          
          <div className='relative'>
            <img
              src={selectedUser.profilePic || assets.avatar_icon}
              alt='selected user'
              className={`w-11 h-11 rounded-full object-cover border-2 ${isDark ? 'border-cyan-400/40' : 'border-cyan-500/50'} shadow-md`}
            />
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border border-white ${isOnline ? (isDark ? 'bg-emerald-500' : 'bg-emerald-400') : (isDark ? 'bg-slate-500' : 'bg-slate-400')}`}/>
          </div>
          
          <div>
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedUser.fullName}</h3>
            {peerIsTyping ? (
              <TypingIndicator />
            ) : (
              <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {isOnline ? '🟢 Online' : '⚫ Offline'}
              </p>
            )}
          </div>
        </div>
        
        <button 
          className={`p-2 rounded-full transition ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-200'}`}
          title='More options'
        >
          <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
            <path d='M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z'/>
          </svg>
        </button>
      </header>

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto px-4 py-4 space-y-2 scrollbar-thin ${isDark ? 'scrollbar-thumb-slate-600 scrollbar-track-slate-800' : 'scrollbar-thumb-slate-300 scrollbar-track-slate-100'}`}>
        {messages.length === 0 && (
          <div className={`text-center mt-12 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <div className='text-4xl mb-2'>👋</div>
            <p className='font-semibold'>Say hello to {selectedUser.fullName}!</p>
            <p className='text-sm mt-1'>Start your conversation now.</p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg._id || `${msg.senderId}-${msg.createdAt}`}
            msg={msg}
            isMine={msg.senderId === authUser._id}
            peerAvatar={selectedUser.profilePic}
            myAvatar={authUser.profilePic}
          />
        ))}

        <div ref={scrollEnd} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSendMessage}
        className={`flex items-center gap-2 px-4 py-3 border-t ${isDark ? 'border-white/10 bg-slate-900/70' : 'border-slate-200 bg-slate-50'} backdrop-blur-sm`}
      >
        <label 
          htmlFor='image' 
          className={`p-2 rounded-full cursor-pointer transition ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-200'}`}
          title='Send image'
        >
          <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
            <path d='M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z'/>
          </svg>
        </label>
        
        <input onChange={handleSendImage} id='image' type='file' accept='image/png,image/jpeg,image/gif,image/webp' hidden />

        <input
          value={input}
          onChange={handleInputChange}
          className={`flex-1 rounded-full px-4 py-2 text-sm border outline-none transition ${isDark ? 'bg-slate-800/70 border-slate-700 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'} focus:ring-2 focus:ring-violet-500`}
          placeholder='Type your message...'
          disabled={loading}
        />

        <button
          type='submit'
          disabled={loading || !input.trim()}
          className='rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 px-5 py-2 text-xs uppercase text-white font-semibold hover:from-violet-600 hover:to-indigo-600 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg'
          title='Send message'
        >
          {loading ? (
            <svg className='w-4 h-4 animate-spin' fill='none' viewBox='0 0 24 24'>
              <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'/>
              <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'/>
            </svg>
          ) : (
            '📤'
          )}
        </button>
      </form>
    </section>
  )
}

export default ChatContainer
