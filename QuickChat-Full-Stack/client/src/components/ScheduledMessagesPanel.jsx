import React, { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import toast from 'react-hot-toast'

const ScheduledMessagesPanel = ({ isOpen, onClose }) => {
  const { axios } = useContext(AuthContext)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (isOpen) fetchScheduled()
  }, [isOpen])

  const fetchScheduled = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/messages/scheduled')
      if (data.success) setMessages(data.messages)
    } catch (error) {
      toast.error('Failed to load scheduled messages')
    } finally {
      setLoading(false)
    }
  }

  const cancelMessage = async (messageId) => {
    try {
      const { data } = await axios.delete(`/api/messages/schedule/${messageId}`)
      if (data.success) {
        setMessages(prev => prev.filter(m => m._id !== messageId))
        toast.success('Scheduled message cancelled')
      }
    } catch (error) {
      toast.error('Failed to cancel message')
    }
  }

  const getTargetLabel = (msg) => {
    if (msg.receiverId?.fullName) return `To ${msg.receiverId.fullName}`
    if (msg.channelId?.name) return `#${msg.channelId.name}`
    if (msg.groupId?.name) return msg.groupId.name
    return 'Direct Message'
  }

  const getTimeRemaining = (scheduledAt) => {
    const now = new Date()
    const target = new Date(scheduledAt)
    const diff = target - now
    if (diff < 0) return 'Overdue'
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const getTimeColor = (scheduledAt) => {
    const diff = new Date(scheduledAt) - new Date()
    if (diff < 0) return 'text-danger'
    if (diff < 3600000) return 'text-warning'
    return 'text-success'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-800/95 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-black/50 w-[520px] max-h-[80vh] overflow-hidden border border-white/10 scale-in" onClick={e => e.stopPropagation()}>
        <div className="relative px-6 py-5 border-b border-white/10">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-transparent" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Scheduled Messages</h3>
                <p className="text-xs text-zinc-500">{messages.length} pending message{messages.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-white/5">
          <div className="flex gap-2">
            {['all', 'today', 'upcoming'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  filter === f ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-surface-700/40 text-zinc-400 hover:text-white border border-white/5'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[50vh] overflow-y-auto custom-scrollbar p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-16 h-16 rounded-2xl bg-surface-700/50 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-600">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <p className="text-sm text-zinc-500">No scheduled messages</p>
            </div>
          ) : (
            messages
              .filter(msg => {
                if (filter === 'today') {
                  const d = new Date(msg.scheduledAt)
                  const now = new Date()
                  return d.toDateString() === now.toDateString()
                }
                if (filter === 'upcoming') {
                  return new Date(msg.scheduledAt) > new Date(Date.now() + 86400000)
                }
                return true
              })
              .map(msg => (
                <div key={msg._id} className="group relative bg-surface-700/40 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-all hover:bg-surface-700/60">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-zinc-400 font-medium">{getTargetLabel(msg)}</p>
                        <span className={`text-xs font-mono font-bold ${getTimeColor(msg.scheduledAt)}`}>
                          {getTimeRemaining(msg.scheduledAt)}
                        </span>
                      </div>
                      <p className="text-sm text-white line-clamp-2 mb-2">{msg.text || '[Image]'}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-zinc-500">
                          {new Date(msg.scheduledAt).toLocaleString()}
                        </p>
                        <button
                          onClick={() => cancelMessage(msg._id)}
                          className="opacity-0 group-hover:opacity-100 text-xs text-danger hover:text-danger/80 transition-all cursor-pointer flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-danger/10"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  )
}

export default ScheduledMessagesPanel
