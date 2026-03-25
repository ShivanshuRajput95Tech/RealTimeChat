import React, { useState, useEffect, useContext, useRef } from 'react'
import axios from 'axios'
import { AuthContext } from '../context/AuthContext'
import { ChatContext } from '../context/ChatContext'

const SearchModal = ({ isOpen, onClose }) => {
  const { authUser } = useContext(AuthContext)
  const { setSelectedUser, setView, setSelectedChannel, setSelectedGroup } = useContext(ChatContext)
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    channelId: '',
    groupId: '',
    userId: '',
    startDate: '',
    endDate: '',
  })
  const [showFilters, setShowFilters] = useState(false)

  const searchMessages = async () => {
    if (!query && !filters.channelId && !filters.groupId) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.append('query', query)
      if (filters.channelId) params.append('channelId', filters.channelId)
      if (filters.groupId) params.append('groupId', filters.groupId)
      if (filters.userId) params.append('userId', filters.userId)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      params.append('limit', 50)

      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/messages/enhanced/search?${params}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      )
      setMessages(res.data.messages || [])
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && query) {
      const debounce = setTimeout(searchMessages, 500)
      return () => clearTimeout(debounce)
    }
  }, [query, isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-surface-800 rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search messages..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-surface-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-primary"
                autoFocus
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 rounded-xl border transition-all ${showFilters ? 'bg-primary border-primary' : 'border-white/10 hover:border-white/20'}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
          </div>
          
          {showFilters && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="bg-surface-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="bg-surface-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : messages.length > 0 ? (
            <div className="divide-y divide-white/5">
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className="p-4 hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => {
                    if (msg.channelId) {
                      setSelectedChannel(msg.channelId)
                      setView('channel')
                    } else if (msg.groupId) {
                      setSelectedGroup(msg.groupId)
                      setView('group')
                    } else {
                      const otherUser = msg.senderId._id === authUser._id ? msg.receiverId : msg.senderId
                      setSelectedUser(otherUser)
                      setView('dm')
                    }
                    onClose()
                  }}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={msg.senderId?.profilePic || '/default-avatar.png'}
                      alt={msg.senderId?.fullName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{msg.senderId?.fullName}</span>
                        <span className="text-xs text-zinc-500">
                          {new Date(msg.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-400 truncate mt-1">
                        {msg.text || msg.image ? '[Media]' : msg.file?.name}
                      </p>
                      {msg.channelId && (
                        <span className="text-xs text-primary mt-1 inline-block">
                          #{msg.channelId.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : query ? (
            <div className="p-8 text-center text-zinc-500">
              No messages found
            </div>
          ) : (
            <div className="p-8 text-center text-zinc-500">
              Start typing to search...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchModal