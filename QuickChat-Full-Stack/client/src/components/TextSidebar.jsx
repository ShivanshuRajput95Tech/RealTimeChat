import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../context/AuthContext'
import { ChatContext } from '../context/ChatContext'
import { WorkspaceContext } from '../context/WorkspaceContext'
import { GroupContext } from '../context/GroupContext'
import MeetingsPanel from './MeetingsPanel'
import { USER_STATUS_OPTIONS as STATUS_OPTIONS } from '../constants'

const TextSidebar = ({ view, setView }) => {
  const { onlineUsers, authUser, changeStatus, userStatuses } = useContext(AuthContext)
  const { users, selectedUser, setSelectedUser, unseenMessages, setUnseenMessages, typingUsers, getUsers } = useContext(ChatContext)
  const {
    workspaces, channelsByWorkspace, selectedWorkspace, setSelectedWorkspace,
    selectedChannel, setSelectedChannel, getWorkspaces, createWorkspace, joinWorkspace, createChannel, selectChannel,
  } = useContext(WorkspaceContext)
  const { groups, selectedGroup, setSelectedGroup, getGroups, createGroup, selectGroup } = useContext(GroupContext)

  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createType, setCreateType] = useState('')
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [expandedWorkspace, setExpandedWorkspace] = useState(null)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [showMeetingsPanel, setShowMeetingsPanel] = useState(false)
  const [meetingsWorkspaceId, setMeetingsWorkspaceId] = useState(null)

  useEffect(() => {
    getUsers()
    getWorkspaces()
    getGroups()
  }, [])

  const currentStatus = authUser?.status || 'online'
  const currentStatusOpt = STATUS_OPTIONS.find(s => s.value === currentStatus) || STATUS_OPTIONS[0]

  const filteredUsers = search
    ? users.filter(u => u.fullName.toLowerCase().includes(search.toLowerCase()))
    : users

  const filteredWorkspaces = search
    ? workspaces.filter(ws => ws.name.toLowerCase().includes(search.toLowerCase()))
    : workspaces

  const filteredGroups = search
    ? groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()))
    : groups

  const handleCreate = async () => {
    if (!newName.trim()) return
    if (createType === 'workspace') {
      await createWorkspace(newName, newDesc)
    } else if (createType === 'group') {
      await createGroup(newName, newDesc, [])
    } else if (createType === 'channel') {
      if (!selectedWorkspace) return
      await createChannel(selectedWorkspace._id, newName, newDesc, 'text')
    } else if (createType === 'join') {
      await joinWorkspace(inviteCode)
    }
    setShowCreateModal(false)
    setNewName('')
    setNewDesc('')
    setInviteCode('')
  }

  const openCreate = (type) => {
    setCreateType(type)
    setShowCreateModal(true)
  }

  return (
    <div className="w-[300px] h-full flex flex-col bg-surface-800/50 border-r border-white/[0.04] flex-shrink-0 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-surface-800/80 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative z-10 px-4 py-4 border-b border-white/[0.04]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white tracking-tight">
            {view === 'dm' ? 'Messages' : view === 'workspace' ? 'Workspaces' : 'Groups'}
          </h2>
          <button
            onClick={() => openCreate(view === 'dm' ? 'group' : view === 'workspace' ? 'workspace' : 'group')}
            className="w-8 h-8 rounded-xl bg-surface-700/60 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-surface-600 cursor-pointer transition-all duration-200 hover:scale-105"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-3 bg-surface-700/40 rounded-xl px-4 py-2.5 border border-white/[0.03] focus-within:border-primary/30 focus-within:bg-surface-700/60 transition-all">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500 flex-shrink-0">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-sm text-white placeholder-zinc-500 flex-1 w-full"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-zinc-500 hover:text-white transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2 relative z-10">
        {view === 'dm' && (
          <>
            {filteredUsers.length > 0 ? (
              <div className="space-y-0.5 px-2">
                {filteredUsers.map((user) => {
                  const isOnline = onlineUsers.includes(user._id)
                  const unread = unseenMessages[user._id] || 0
                  const isTyping = typingUsers[user._id]
                  const userStatus = userStatuses[user._id]?.status || (isOnline ? 'online' : 'offline')
                  return (
                    <button
                      key={user._id}
                      onClick={() => {
                        setSelectedUser(user)
                        setUnseenMessages(prev => ({ ...prev, [user._id]: 0 }))
                        setSelectedChannel(null)
                        setSelectedGroup(null)
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group ${
                        selectedUser?._id === user._id 
                          ? 'bg-gradient-to-r from-primary/20 to-accent/10 border border-primary/20' 
                          : 'hover:bg-surface-700/50 border border-transparent'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-11 h-11 rounded-xl overflow-hidden ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                          {user.profilePic ? (
                            <img
                              src={user.profilePic}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold text-sm">
                              {user.fullName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-surface-800 status-${userStatus}`} />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm truncate pr-2 ${unread > 0 ? 'font-semibold text-white' : 'text-zinc-200'}`}>
                            {user.fullName}
                          </p>
                          {unread > 0 && (
                            <span className="unread-badge flex-shrink-0 ml-auto">{unread > 99 ? '99+' : unread}</span>
                          )}
                        </div>
                        {isTyping ? (
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-xs text-primary font-medium">typing</span>
                            <span className="w-1.5 h-1.5 bg-primary rounded-full typing-dot" />
                            <span className="w-1.5 h-1.5 bg-primary rounded-full typing-dot" />
                            <span className="w-1.5 h-1.5 bg-primary rounded-full typing-dot" />
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-500 truncate">
                            {user.statusText || (isOnline ? 'Active now' : 'Offline')}
                          </p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-surface-700/50 flex items-center justify-center mx-auto mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-500">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <p className="text-sm text-zinc-500">No conversations yet</p>
                <p className="text-xs text-zinc-600 mt-1">Start chatting with someone</p>
              </div>
            )}
          </>
        )}

        {view === 'workspace' && (
          <>
            <div className="px-4 py-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Your Workspaces</span>
              <button onClick={() => openCreate('join')} className="text-[11px] text-primary hover:text-primary-light cursor-pointer font-medium transition-colors">
                Join
              </button>
            </div>
            {filteredWorkspaces.map((ws) => (
              <div key={ws._id}>
                <button
                  onClick={() => {
                    setSelectedWorkspace(ws)
                    setExpandedWorkspace(expandedWorkspace === ws._id ? null : ws._id)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200 ${
                    selectedWorkspace?._id === ws._id 
                      ? 'bg-gradient-to-r from-primary/15 to-transparent border-r-2 border-primary' 
                      : 'hover:bg-surface-700/40'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-base font-bold text-primary shadow-lg shadow-primary/10 flex-shrink-0">
                    {ws.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-zinc-200 truncate">{ws.name}</p>
                    <p className="text-xs text-zinc-500">{ws.members?.length || 0} members</p>
                  </div>
                  <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className={`text-zinc-500 transition-transform duration-300 ${expandedWorkspace === ws._id ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {expandedWorkspace === ws._id && (
                  <div className="ml-6 border-l border-white/5 pl-3 py-2 space-y-0.5 fade-in">
                    {(channelsByWorkspace[ws._id] || []).map((ch) => (
                      <button
                        key={ch._id}
                        onClick={() => {
                          selectChannel(ch, ws._id)
                          setSelectedUser(null)
                          setSelectedGroup(null)
                          setView('channel')
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedChannel?._id === ch._id 
                            ? 'bg-primary/15 text-primary' 
                            : 'text-zinc-400 hover:text-white hover:bg-surface-700/40'
                        }`}
                      >
                        <span className="text-zinc-600 font-bold text-sm">#</span>
                        <span className="text-sm truncate">{ch.name}</span>
                      </button>
                    ))}
                    <button
                      onClick={() => { setCreateType('channel'); setShowCreateModal(true) }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-zinc-500 hover:text-zinc-300 hover:bg-surface-700/40 transition-all duration-200"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      <span className="text-xs">Add Channel</span>
                    </button>
                    <button
                      onClick={() => { setMeetingsWorkspaceId(ws._id); setShowMeetingsPanel(true) }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-200"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                      </svg>
                      <span className="text-xs">Meetings</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
            {workspaces.length === 0 && (
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-surface-700/50 flex items-center justify-center mx-auto mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-500">
                    <rect x="3" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="14" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/>
                  </svg>
                </div>
                <p className="text-sm text-zinc-500 mb-2">No workspaces yet</p>
                <button onClick={() => openCreate('workspace')} className="text-xs text-primary hover:text-primary-light cursor-pointer font-medium transition-colors">
                  Create one
                </button>
              </div>
            )}
          </>
        )}

        {view === 'group' && (
          <>
            {filteredGroups.length > 0 ? (
              <div className="space-y-0.5 px-2">
                {filteredGroups.map((group) => (
                  <button
                    key={group._id}
                    onClick={() => {
                      selectGroup(group)
                      setSelectedUser(null)
                      setSelectedChannel(null)
                      setView('group')
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group ${
                      selectedGroup?._id === group._id 
                        ? 'bg-gradient-to-r from-accent/15 to-transparent border border-accent/20' 
                        : 'hover:bg-surface-700/50 border border-transparent'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center text-base flex-shrink-0 shadow-lg shadow-accent/10">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-zinc-200 truncate">{group.name}</p>
                      <p className="text-xs text-zinc-500">{group.members?.length || 0} members</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-surface-700/50 flex items-center justify-center mx-auto mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-500">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <p className="text-sm text-zinc-500 mb-2">No groups yet</p>
                <button onClick={() => openCreate('group')} className="text-xs text-primary hover:text-primary-light cursor-pointer font-medium transition-colors">
                  Create one
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {view === 'dm' && (
        <div className="relative z-10 px-3 py-3 border-t border-white/[0.04]">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-surface-700/50 cursor-pointer transition-all duration-200 group"
          >
            <span className={`w-3 h-3 rounded-full ${currentStatusOpt.color} flex-shrink-0`} />
            <span className="text-sm text-zinc-400 group-hover:text-white transition-colors">{currentStatusOpt.label}</span>
            {authUser?.statusText && <span className="text-xs text-zinc-500 italic truncate">({authUser.statusText})</span>}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-auto text-zinc-500">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {showStatusMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowStatusMenu(false)} />
              <div className="absolute bottom-full left-3 z-50 w-48 glass-strong rounded-xl shadow-2xl py-1.5 scale-in mb-2 overflow-hidden">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { changeStatus(opt.value); setShowStatusMenu(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 flex items-center gap-3 cursor-pointer transition-colors"
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${opt.color}`} />
                    {opt.label}
                    {currentStatus === opt.value && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-auto text-primary">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center fade-in" onClick={() => setShowCreateModal(false)}>
          <div className="glass-card rounded-2xl p-6 w-[420px] max-w-[90vw] scale-in-spring" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                {createType === 'workspace' && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                    <rect x="3" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="14" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/>
                  </svg>
                )}
                {createType === 'group' && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                )}
                {createType === 'channel' && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                )}
                {createType === 'join' && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                    <polyline points="10 17 15 12 10 7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {createType === 'join' ? 'Join Workspace' : `Create ${createType.charAt(0).toUpperCase() + createType.slice(1)}`}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {createType === 'workspace' && 'Create a new workspace for your team'}
                  {createType === 'group' && 'Create a group to chat with friends'}
                  {createType === 'channel' && 'Add a channel to your workspace'}
                  {createType === 'join' && 'Enter the invite code to join'}
                </p>
              </div>
            </div>
            {createType === 'join' ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Invite Code</label>
                  <input
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Enter invite code"
                    className="w-full bg-surface-700/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none input-glow"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    {createType.charAt(0).toUpperCase() + createType.slice(1)} Name
                  </label>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={`${createType.charAt(0).toUpperCase() + createType.slice(1)} name`}
                    className="w-full bg-surface-700/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none input-glow"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Description (optional)</label>
                  <input
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Add a description..."
                    className="w-full bg-surface-700/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none input-glow"
                  />
                </div>
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 py-3 rounded-xl bg-surface-700/60 text-sm text-zinc-300 hover:bg-surface-600 cursor-pointer transition-all font-medium border border-white/5">
                Cancel
              </button>
              <button onClick={handleCreate} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-sm text-white font-semibold cursor-pointer transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30">
                {createType === 'join' ? 'Join' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
      <MeetingsPanel
        workspaceId={meetingsWorkspaceId}
        members={selectedWorkspace?.members || []}
        isOpen={showMeetingsPanel}
        onClose={() => setShowMeetingsPanel(false)}
      />
    </div>
  )
}

export default TextSidebar
