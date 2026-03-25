import React, { useState, useEffect, useCallback, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { formatMessageTime } from '../lib/utils'

const NotificationBell = () => {
  const { axios, socket } = useContext(AuthContext)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await axios.get('/api/notifications?limit=20')
      if (data.success) {
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch {
      // Silent fail for notifications
    } finally {
      setLoading(false)
    }
  }, [axios])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  useEffect(() => {
    if (!socket) return
    const handleNotification = (notif) => {
      setNotifications(prev => [notif, ...prev])
      setUnreadCount(prev => prev + 1)
    }
    socket.on("notification", handleNotification)
    return () => socket.off("notification", handleNotification)
  }, [socket])

  const getTypeIcon = (type) => {
    switch (type) {
      case 'message': return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      )
      case 'mention': return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/>
        </svg>
      )
      case 'reaction': return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
        </svg>
      )
      case 'reply': return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
        </svg>
      )
      default: return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      )
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) fetchNotifications() }}
        className="w-11 h-11 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-surface-700/60 cursor-pointer transition-all duration-300 hover:scale-110 relative"
        title="Notifications"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-lg shadow-danger/40 animate-bounce">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[380px] max-h-[480px] bg-surface-800/95 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-black/40 z-[100] overflow-hidden border border-white/10 scale-in">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-white font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary hover:text-primary-light cursor-pointer transition-colors">
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} className="text-xs text-zinc-500 hover:text-danger cursor-pointer transition-colors">
                  Clear all
                </button>
              )}
            </div>
          </div>
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-40">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif._id}
                  onClick={() => !notif.read && markRead(notif._id)}
                  className={`px-5 py-3 border-b border-white/5 cursor-pointer transition-colors hover:bg-white/[0.03] ${
                    !notif.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      !notif.read ? 'bg-primary/20 text-primary' : 'bg-surface-700 text-zinc-400'
                    }`}>
                      {getTypeIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notif.read ? 'text-white font-medium' : 'text-zinc-400'}`}>
                        {notif.title}
                      </p>
                      {notif.body && (
                        <p className="text-xs text-zinc-500 mt-0.5 truncate">{notif.body}</p>
                      )}
                      <p className="text-[10px] text-zinc-600 mt-1">
                        {formatMessageTime(notif.createdAt)}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
