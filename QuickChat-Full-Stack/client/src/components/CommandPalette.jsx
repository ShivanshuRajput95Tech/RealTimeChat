import React, { useContext, useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChatContext } from '../../context/ChatContext'
import { WorkspaceContext } from '../../context/WorkspaceContext'
import { GroupContext } from '../../context/GroupContext'

const CommandPalette = ({ onClose, setView, onToggleAI, onOpenSearch, onOpenTemplates, onOpenNotes }) => {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  const { users, setSelectedUser, setUnseenMessages } = useContext(ChatContext)
  const { workspaces, channelsByWorkspace, setSelectedWorkspace, selectChannel } = useContext(WorkspaceContext)
  const { groups, selectGroup } = useContext(GroupContext)

  const getCommands = () => {
    const cmds = [
      { id: 'profile', label: 'Edit Profile', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, action: () => navigate('/profile'), category: 'Navigation' },
      { id: 'ai', label: 'Open AI Copilot', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>, action: onToggleAI, category: 'AI' },
      { id: 'search', label: 'Search Messages', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>, action: () => { onOpenSearch?.(); onClose() }, category: 'Features' },
      { id: 'templates', label: 'Quick Replies', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>, action: () => { onOpenTemplates?.(); onClose() }, category: 'Features' },
      { id: 'notes', label: 'Collaborative Notes', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>, action: () => { onOpenNotes?.(); onClose() }, category: 'Features' },
      { id: 'dm', label: 'Direct Messages', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, action: () => setView('dm'), category: 'Navigation' },
      { id: 'workspaces', label: 'Workspaces', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>, action: () => setView('workspace'), category: 'Navigation' },
      { id: 'groups', label: 'Groups', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, action: () => setView('group'), category: 'Navigation' },
    ]
    users.forEach(u => {
      cmds.push({ id: `dm-${u._id}`, label: u.fullName, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, action: () => { setSelectedUser(u); setSelectedWorkspace(null); setView('dm') }, category: 'Direct Messages' })
    })
    workspaces.forEach(ws => {
      cmds.push({ id: `ws-${ws._id}`, label: ws.name, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/></svg>, action: () => { setSelectedWorkspace(ws); setView('workspace') }, category: 'Workspaces' });
      (channelsByWorkspace[ws._id] || []).forEach(ch => {
        cmds.push({ id: `ch-${ch._id}`, label: `#${ch.name}`, icon: <span className="font-bold text-primary">#</span>, action: () => { setSelectedWorkspace(ws); selectChannel(ch, ws._id); setView('channel') }, category: 'Channels' })
      })
    })
    groups.forEach(g => {
      cmds.push({ id: `grp-${g._id}`, label: g.name, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>, action: () => { selectGroup(g); setView('group') }, category: 'Groups' })
    })
    return cmds
  }

  const commands = getCommands()
  const filtered = query ? commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase())) : commands
  const grouped = filtered.reduce((acc, cmd) => { if (!acc[cmd.category]) acc[cmd.category] = []; acc[cmd.category].push(cmd); return acc }, {})
  const flatFiltered = Object.values(grouped).flat()

  useEffect(() => {
    setQuery(''); setSelectedIndex(0)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  useEffect(() => { setSelectedIndex(0) }, [query])

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, flatFiltered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); flatFiltered[selectedIndex]?.action(); onClose() }
    else if (e.key === 'Escape') onClose()
  }

  useEffect(() => {
    const selectedEl = document.querySelector(`[data-index="${selectedIndex}"]`)
    selectedEl?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  let itemIndex = -1

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-start justify-center pt-[12vh] fade-in" onClick={onClose}>
      <div className="glass-strong rounded-2xl w-[560px] max-h-[70vh] overflow-hidden shadow-2xl scale-in-spring border border-white/5" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-white/[0.04] bg-surface-700/30">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search commands, people, channels..."
              className="flex-1 bg-transparent text-white text-base outline-none placeholder-zinc-500"
            />
            <kbd className="px-2 py-1 bg-surface-600/80 rounded-lg text-zinc-400 font-mono text-xs border border-white/5">Esc</kbd>
          </div>
        </div>
        <div className="overflow-y-auto max-h-[50vh] py-3">
          {Object.entries(grouped).map(([category, cmds]) => (
            <div key={category}>
              <p className="text-[10px] text-zinc-500 px-5 py-2 font-semibold uppercase tracking-wider flex items-center gap-2">
                <span className="w-px h-3 bg-primary/50" />
                {category}
              </p>
              {cmds.map((cmd) => {
                itemIndex++
                const idx = itemIndex
                return (
                  <button
                    key={cmd.id}
                    data-index={idx}
                    onClick={() => { cmd.action(); onClose() }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left px-5 py-2.5 flex items-center gap-4 cursor-pointer text-sm transition-all duration-200 ${
                      selectedIndex === idx 
                        ? 'bg-gradient-to-r from-primary/20 to-transparent text-white border-l-2 border-primary' 
                        : 'text-zinc-300 hover:bg-white/[0.03] border-l-2 border-transparent'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      selectedIndex === idx ? 'bg-primary/20 text-primary' : 'bg-surface-700/50 text-zinc-400'
                    }`}>
                      {cmd.icon}
                    </div>
                    <span className="flex-1">{cmd.label}</span>
                    {selectedIndex === idx && (
                      <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-surface-600 rounded text-[10px]">↵</kbd>
                        Select
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
          {flatFiltered.length === 0 && (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-surface-700/50 mx-auto mb-4 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-500">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <p className="text-zinc-500 text-sm">No results found for "{query}"</p>
            </div>
          )}
        </div>
        <div className="px-5 py-3 border-t border-white/[0.04] bg-surface-700/20 flex items-center gap-6 text-[11px] text-zinc-500">
          <span className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-surface-600/80 rounded text-zinc-400 font-mono border border-white/5">↑</kbd>
            <kbd className="px-1.5 py-0.5 bg-surface-600/80 rounded text-zinc-400 font-mono border border-white/5">↓</kbd>
            Navigate
          </span>
          <span className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-surface-600/80 rounded text-zinc-400 font-mono border border-white/5">↵</kbd>
            Select
          </span>
        </div>
      </div>
    </div>
  )
}

export default CommandPalette
