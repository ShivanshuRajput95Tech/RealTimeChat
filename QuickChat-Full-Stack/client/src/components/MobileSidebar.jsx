import React, { useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { ChatContext } from '../context/ChatContext'
import { WorkspaceContext } from '../context/WorkspaceContext'
import { GroupContext } from '../context/GroupContext'

const MobileSidebar = ({ isOpen, onClose, view, setView }) => {
  const { authUser, logout } = useContext(AuthContext)
  const { users, unseenMessages } = useContext(ChatContext)
  const { workspaces } = useContext(WorkspaceContext)
  const { groups } = useContext(GroupContext)
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')

  const totalUnread = Object.values(unseenMessages).reduce((a, b) => a + b, 0)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const NavItem = ({ icon, label, badge, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
        isActive
          ? 'bg-gradient-to-r from-primary/20 to-accent/10 text-white border-l-2 border-primary'
          : 'text-zinc-400 hover:bg-surface-700/50 hover:text-white'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
        isActive ? 'bg-primary/20 text-primary' : 'bg-surface-700/50'
      }`}>
        {icon}
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-medium">{label}</p>
      </div>
      {badge > 0 && (
        <span className="unread-badge">{badge}</span>
      )}
    </button>
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[300] lg:hidden">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm fade-in-fast"
        onClick={onClose}
      />
      
      <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-[320px] bg-surface-800 border-r border-white/5 slide-in-left overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">QuickChat</h2>
                <p className="text-xs text-zinc-500">Real-time messaging</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-surface-700/50 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-surface-600 transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="flex gap-2 p-1 bg-surface-700/50 rounded-xl">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'chat'
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-zinc-400'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab('workspace')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'workspace'
                  ? 'bg-accent text-white shadow-lg shadow-accent/20'
                  : 'text-zinc-400'
              }`}
            >
              Workspaces
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3">
          {activeTab === 'chat' && (
            <div className="space-y-2">
              <NavItem
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                }
                label="Direct Messages"
                badge={totalUnread}
                isActive={view === 'dm'}
                onClick={() => { setView('dm'); onClose() }}
              />
              <NavItem
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                }
                label="Groups"
                badge={groups?.length || 0}
                isActive={view === 'group'}
                onClick={() => { setView('group'); onClose() }}
              />
            </div>
          )}

          {activeTab === 'workspace' && (
            <div className="space-y-2">
              <NavItem
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="14" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/>
                  </svg>
                }
                label="Workspaces"
                badge={workspaces?.length || 0}
                isActive={view === 'workspace'}
                onClick={() => { setView('workspace'); onClose() }}
              />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={() => { navigate('/profile'); onClose() }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-700/50 text-zinc-300 hover:bg-surface-600/50 transition-all"
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold">
              {authUser?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-white">{authUser?.fullName}</p>
              <p className="text-xs text-zinc-500">View Profile</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default MobileSidebar
