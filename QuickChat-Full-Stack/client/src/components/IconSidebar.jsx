import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { ChatContext } from '../context/ChatContext'
import { WorkspaceContext } from '../context/WorkspaceContext'
import { GroupContext } from '../context/GroupContext'

const IconSidebar = ({ view, setView, onOpenCommandPalette, onToggleAI, showAI }) => {
  const { authUser, logout } = useContext(AuthContext)
  const isAdmin = authUser?.email?.includes('admin')
  const { unseenMessages } = useContext(ChatContext)
  const { workspaces } = useContext(WorkspaceContext)
  const { groups } = useContext(GroupContext)
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)

  const totalUnread = Object.values(unseenMessages).reduce((a, b) => a + b, 0)

  const NavButton = ({ icon, label, active, onClick, badge }) => (
    <button
      onClick={onClick}
      data-tooltip={label}
      className="tooltip w-12 h-12 rounded-2xl flex items-center justify-center text-lg cursor-pointer transition-all duration-300 relative group"
      style={{
        background: active ? 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)' : 'transparent',
        boxShadow: active ? '0 4px 20px var(--color-primary-glow), inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
      }}
    >
      <span className="transition-all duration-300 group-hover:scale-110" style={{ opacity: active ? 1 : 0.5 }}>
        {icon}
      </span>
      {badge > 0 && view !== 'dm' && (
        <span className="absolute -top-1 -right-1 unread-badge scale-90">{badge > 99 ? '99+' : badge}</span>
      )}
    </button>
  )

  return (
    <div className="w-[72px] h-full flex flex-col items-center py-4 gap-1.5 bg-surface-850 border-r border-white/[0.04] flex-shrink-0 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-primary-dark to-accent flex items-center justify-center mb-2 shadow-xl shadow-primary/25 cursor-pointer hover:scale-105 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 group relative overflow-hidden">
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="relative z-10">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          <path d="M8 10h8M8 14h4" strokeLinecap="round"/>
        </svg>
      </div>

      <div className="w-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-1" />

      <div className="flex flex-col gap-1.5 flex-1 w-full px-2">
        <NavButton
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              <path d="M8 10h8" strokeLinecap="round"/>
            </svg>
          }
          label="Direct Messages"
          active={view === 'dm'}
          onClick={() => setView('dm')}
          badge={totalUnread}
        />
        <NavButton
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
            </svg>
          }
          label="Workspaces"
          active={view === 'workspace'}
          onClick={() => setView('workspace')}
          badge={workspaces?.length || 0}
        />
        <NavButton
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          }
          label="Groups"
          active={view === 'group'}
          onClick={() => setView('group')}
          badge={groups?.length || 0}
        />
      </div>

      <div className="w-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-1" />

      <div className="flex flex-col gap-1.5 w-full px-2">
        <NavButton
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          }
          label="Search (Ctrl+K)"
          onClick={onOpenCommandPalette}
        />
        <NavButton
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a10 10 0 1 0 10 10H12V2z"/>
              <path d="M20 12a8 8 0 0 0-8-8v8h8z"/>
              <circle cx="12" cy="12" r="2" fill="currentColor"/>
            </svg>
          }
          label="AI Copilot"
          active={showAI}
          onClick={onToggleAI}
        />

        <div className="w-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mx-auto my-1" />

        <div className="relative flex justify-center">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-12 h-12 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:ring-2 hover:ring-primary/50 hover:scale-105 group relative"
          >
            {authUser?.profilePic ? (
              <img
                src={authUser.profilePic}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold text-lg">
                {authUser?.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-surface-850 status-${authUser?.status || 'online'}`} />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 w-56 glass-strong rounded-2xl shadow-2xl py-2 scale-in-spring overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-sm font-semibold text-white truncate">{authUser?.fullName}</p>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">{authUser?.email}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { navigate('/profile'); setShowMenu(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 flex items-center gap-3 cursor-pointer transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    Edit Profile
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => { navigate('/admin'); setShowMenu(false) }}
                      className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 flex items-center gap-3 cursor-pointer transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                      Admin Dashboard
                    </button>
                  )}
                  <button
                    onClick={() => { logout(); setShowMenu(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm text-danger hover:bg-danger/10 flex items-center gap-3 cursor-pointer transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default IconSidebar
