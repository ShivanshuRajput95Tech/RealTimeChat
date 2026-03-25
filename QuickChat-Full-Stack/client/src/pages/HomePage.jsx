import React, { useState, useEffect, useContext, Suspense, lazy, useCallback, useRef, useMemo } from 'react'
import IconSidebar from '../components/IconSidebar'
import TextSidebar from '../components/TextSidebar'
import MobileSidebar from '../components/MobileSidebar'
import ChatContainer from '../components/ChatContainer'
import ChannelChat from '../components/ChannelChat'
import GroupChat from '../components/GroupChat'
import ThreadPanel from '../components/ThreadPanel'
import AICopilotPanel from '../components/AICopilotPanel'
import CommandPalette from '../components/CommandPalette'
import NotificationBell from '../components/NotificationBell'
import SearchModal from '../components/SearchModal'
import MessageTemplatesPanel from '../components/MessageTemplatesPanel'
import NotesPanel from '../components/NotesPanel'
import { useCallManager } from '../components/CallManager'
import { ChatContext } from '../../context/ChatContext'
import { WorkspaceContext } from '../../context/WorkspaceContext'
import { GroupContext } from '../../context/GroupContext'
import { AuthContext } from '../../context/AuthContext'
import { AIContext } from '../../context/AIContext'

const ChatThreeBackground = lazy(() => import('../components/ChatThreeBackground').catch(() => ({ default: () => null })))

/* ── 3D Tilt Card ─────────────────────────────── */
const TiltCard = ({ children, className, style, onClick, intensity = 12 }) => {
  const ref = useRef(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [glare, setGlare] = useState({ x: 50, y: 50 })

  const handleMove = useCallback((e) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setTilt({ x: (y - 0.5) * -intensity, y: (x - 0.5) * intensity })
    setGlare({ x: x * 100, y: y * 100 })
  }, [intensity])

  const handleLeave = useCallback(() => setTilt({ x: 0, y: 0 }), [])

  return (
    <div ref={ref} onMouseMove={handleMove} onMouseLeave={handleLeave} onClick={onClick}
      className={className} style={{
        ...style,
        transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: 'transform 0.15s ease-out',
      }}>
      <div className="absolute inset-0 rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.06), transparent 60%)` }} />
      {children}
    </div>
  )
}

/* ── Animated Counter ─────────────────────────── */
const AnimatedCounter = ({ end, duration = 2000, suffix = '', prefix = '' }) => {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const start = Date.now()
        const tick = () => {
          const elapsed = Date.now() - start
          const progress = Math.min(elapsed / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setCount(Math.round(eased * end))
          if (progress < 1) requestAnimationFrame(tick)
        }
        tick()
      }
    }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration])

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>
}

/* ── Live Dot ─────────────────────────────────── */
const LiveDot = ({ color = '#22c55e' }) => (
  <span className="relative flex h-2 w-2">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: color }} />
    <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: color }} />
  </span>
)

/* ── Stagger Children ─────────────────────────── */
const Stagger = ({ children, baseDelay = 0.08, className = '' }) => (
  <div className={className}>
    {React.Children.map(children, (child, i) =>
      React.isValidElement(child)
        ? React.cloneElement(child, { style: { ...child.props.style, animation: `slideUp 0.6s cubic-bezier(0.16,1,0.3,1) ${baseDelay * i}s both` } })
        : child
    )}
  </div>
)

/* ── Bento Feature Card ───────────────────────── */
const BentoCard = ({ icon, title, desc, gradient, onClick, span = '', badge, children }) => (
  <TiltCard
    onClick={onClick}
    intensity={8}
    className={`group relative rounded-2xl cursor-pointer overflow-hidden ${span}`}
    style={{ animation: 'slideUp 0.6s cubic-bezier(0.16,1,0.3,1) both' }}>
    <div className="absolute inset-0 bg-surface-800/80 backdrop-blur-sm" />
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: gradient }} />
    <div className="absolute inset-0 border border-white/[0.04] group-hover:border-white/[0.08] rounded-2xl transition-colors duration-500" />
    {/* Corner glow */}
    <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-700 blur-3xl" style={{ background: gradient }} />
    <div className="relative z-10 p-5 h-full flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" style={{ background: gradient }}>
          {icon}
        </div>
        {badge && <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full" style={{ background: `${gradient}22`, color: gradient.includes('#6366f1') ? '#818cf8' : gradient.includes('#a855f7') ? '#c084fc' : gradient.includes('#22c55e') ? '#4ade80' : gradient.includes('#22d3ee') ? '#67e8f9' : '#fbbf24' }}>{badge}</span>}
      </div>
      <h3 className="text-sm font-bold text-white mb-1 group-hover:text-white transition-colors">{title}</h3>
      <p className="text-[11px] text-zinc-500 leading-relaxed flex-1">{desc}</p>
      {children}
      <div className="flex items-center gap-1.5 mt-3 text-[10px] text-zinc-600 group-hover:text-zinc-400 transition-colors">
        <span>Open</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-x-0.5 transition-transform"><polyline points="9 18 15 12 9 6" /></svg>
      </div>
    </div>
  </TiltCard>
)

/* ── Mini Activity Bar ────────────────────────── */
const ActivityBar = () => {
  const data = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    day: i,
    height: Math.random() * 60 + 20,
    active: i >= 7,
  })), [])
  return (
    <div className="flex items-end gap-[3px] h-12">
      {data.map((d, i) => (
        <div key={i} className="flex-1 rounded-sm transition-all duration-500" style={{
          height: `${d.height}%`,
          background: d.active ? 'linear-gradient(to top, #6366f1, #a855f7)' : 'rgba(255,255,255,0.04)',
          animationDelay: `${i * 0.05}s`,
        }} />
      ))}
    </div>
  )
}

/* ── MAIN HOME PAGE ───────────────────────────── */
const HomePage = () => {
  const { selectedUser, activeThread } = useContext(ChatContext)
  const { selectedChannel } = useContext(WorkspaceContext)
  const { selectedGroup } = useContext(GroupContext)
  const { socket, authUser } = useContext(AuthContext)
  const { aiMessages } = useContext(AIContext)

  const [view, setView] = useState('dm')
  const [showAI, setShowAI] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const {
    callState, callType, localStream, remoteStream, isMuted, isVideoOff, isScreenSharing, incomingCall,
    localVideoRef, remoteVideoRef,
    startCall, answerCall, rejectCall, endCall, toggleMute, toggleVideo, toggleScreenShare,
  } = useCallManager()

  const showDM = view === 'dm' && selectedUser
  const showChannel = view === 'channel' && selectedChannel
  const showGroup = view === 'group' && selectedGroup
  const showEmpty = !showDM && !showChannel && !showGroup
  const showThread = activeThread && (showDM || showChannel)
  const showRightPanel = showThread || showAI

  useEffect(() => { const t = setTimeout(() => setLoaded(true), 300); return () => clearTimeout(t) }, [])

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowCommandPalette(p => !p) }
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') { e.preventDefault(); setShowSearch(true) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const greeting = useCallback(() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const firstName = authUser?.fullName?.split(' ')[0] || 'there'

  return (
    <div className="h-screen w-screen flex overflow-hidden relative bg-surface-900">
      <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center bg-surface-900"><div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>}>
        <ChatThreeBackground intensity="low">
          <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
            <div className="chat-gradient-orb chat-gradient-orb-1 opacity-[0.015]" />
            <div className="chat-gradient-orb chat-gradient-orb-2 opacity-[0.015]" />
          </div>

          <div className="hidden lg:flex">
            <IconSidebar view={view} setView={setView} onOpenCommandPalette={() => setShowCommandPalette(true)} onToggleAI={() => setShowAI(!showAI)} showAI={showAI} />
            <TextSidebar view={view} setView={setView} />
          </div>

          <MobileSidebar isOpen={showMobileSidebar} onClose={() => setShowMobileSidebar(false)} view={view} setView={setView} />

          <div className="flex-1 flex flex-col min-w-0 relative">
            {/* Mobile header */}
            <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-surface-800/50 backdrop-blur-xl">
              <button onClick={() => setShowMobileSidebar(true)} className="w-10 h-10 rounded-xl bg-surface-700/50 flex items-center justify-center text-zinc-400 hover:text-white transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
              <div className="flex-1"><h2 className="text-sm font-semibold text-white">{view === 'dm' ? 'Messages' : view === 'channel' ? 'Workspaces' : 'Groups'}</h2></div>
              <button onClick={() => setShowCommandPalette(true)} className="w-10 h-10 rounded-xl bg-surface-700/50 flex items-center justify-center text-zinc-400 hover:text-white transition-all">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </button>
              <NotificationBell />
            </div>

            {showDM && <ChatContainer startCall={startCall} />}
            {showChannel && <ChannelChat />}
            {showGroup && <GroupChat />}

            {showEmpty && (
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className={`min-h-full transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  {/* ═══════ HERO HEADER ═══════ */}
                  <div className="relative px-6 md:px-10 pt-8 md:pt-12 pb-6">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent pointer-events-none" />
                    <Stagger baseDelay={0.1}>
                      <div style={{}} className="flex items-center gap-2 mb-2">
                        <LiveDot />
                        <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-semibold">Live</span>
                      </div>
                      <h1 style={{}} className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.1]">
                        {greeting()},<br />
                        <span className="bg-gradient-to-r from-primary via-accent to-cyan bg-clip-text text-transparent">{firstName}</span>
                      </h1>
                      <p style={{}} className="text-zinc-500 text-sm md:text-base mt-3 max-w-xl leading-relaxed">
                        Your AI-native communication hub. Pick a conversation, explore a workspace, or let QuickBot help you stay in flow.
                      </p>
                    </Stagger>

                    {/* Quick actions row */}
                    <div className="flex flex-wrap items-center gap-2 mt-6" style={{ animation: 'slideUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.4s both' }}>
                      <button onClick={() => setShowCommandPalette(true)}
                        className="flex items-center gap-2.5 px-4 py-2.5 bg-surface-700/50 backdrop-blur-sm rounded-xl border border-white/[0.06] hover:border-primary/20 hover:bg-surface-700/70 transition-all cursor-pointer group text-left">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500 group-hover:text-primary transition-colors"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">Search</span>
                        <kbd className="px-1.5 py-0.5 bg-surface-600/50 rounded text-[9px] text-zinc-600 font-mono border border-white/5 ml-4">⌘K</kbd>
                      </button>
                      <button onClick={() => setShowAI(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 rounded-xl border border-primary/10 hover:border-primary/20 hover:bg-primary/15 transition-all cursor-pointer text-xs text-primary font-medium">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/></svg>
                        AI Copilot
                      </button>
                      <button onClick={() => setView('dm')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-surface-700/40 rounded-xl border border-white/[0.04] hover:border-white/[0.08] transition-all cursor-pointer text-xs text-zinc-400 hover:text-white">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        New Chat
                      </button>
                      <button onClick={() => setShowSearch(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-surface-700/40 rounded-xl border border-white/[0.04] hover:border-white/[0.08] transition-all cursor-pointer text-xs text-zinc-400 hover:text-white">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        Search
                        <kbd className="px-1.5 py-0.5 bg-surface-600/50 rounded text-[9px] text-zinc-600 font-mono border border-white/5 ml-2">⌘F</kbd>
                      </button>
                      <button onClick={() => setShowTemplates(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-surface-700/40 rounded-xl border border-white/[0.04] hover:border-white/[0.08] transition-all cursor-pointer text-xs text-zinc-400 hover:text-white">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        Quick Replies
                      </button>
                      <button onClick={() => setShowNotes(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-surface-700/40 rounded-xl border border-white/[0.04] hover:border-white/[0.08] transition-all cursor-pointer text-xs text-zinc-400 hover:text-white">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Notes
                      </button>
                    </div>
                  </div>

                  {/* ═══════ BENTO GRID ═══════ */}
                  <div className="px-6 md:px-10 pb-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 auto-rows-auto">

                      {/* Row 1: Large feature cards */}
                      <BentoCard
                        span="md:col-span-2"
                        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
                        title="Direct Messages"
                        desc="Private 1-on-1 conversations with real-time delivery, read receipts, emoji reactions, threaded replies, and voice messages."
                        gradient="linear-gradient(135deg, #6366f1, #4f46e5)"
                        onClick={() => setView('dm')}
                        badge="Core"
                      />

                      <BentoCard
                        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><circle cx="12" cy="12" r="2" fill="white"/></svg>}
                        title="AI Copilot"
                        desc="Smart replies, auto-translate, writing coach, RAG search, meeting notes, and QuickBot assistant."
                        gradient="linear-gradient(135deg, #22c55e, #16a34a)"
                        onClick={() => setShowAI(true)}
                        badge="AI"
                      />

                      <BentoCard
                        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>}
                        title="Workspaces"
                        desc="Organize teams with text & voice channels, role-based permissions, and workspace-level settings."
                        gradient="linear-gradient(135deg, #a855f7, #9333ea)"
                        onClick={() => setView('channel')}
                      />

                      {/* Row 2 */}
                      <BentoCard
                        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>}
                        title="Voice & Video"
                        desc="Crystal-clear P2P WebRTC calls with screen sharing and noise suppression."
                        gradient="linear-gradient(135deg, #f59e0b, #d97706)"
                        onClick={() => setView('dm')}
                      />

                      <BentoCard
                        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
                        title="Group Chats"
                        desc="Create groups for teams, friends, or communities. Admin controls, disappearing messages, and more."
                        gradient="linear-gradient(135deg, #22d3ee, #0891b2)"
                        onClick={() => setView('group')}
                      />

                      {/* Activity card (wide) */}
                      <TiltCard intensity={6} className="group relative rounded-2xl md:col-span-2 overflow-hidden" style={{ animation: 'slideUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.6s both' }}>
                        <div className="absolute inset-0 bg-surface-800/80 backdrop-blur-sm" />
                        <div className="absolute inset-0 border border-white/[0.04] group-hover:border-white/[0.08] rounded-2xl transition-colors" />
                        <div className="relative z-10 p-5">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-cyan/10 flex items-center justify-center">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                              </div>
                              <h3 className="text-xs font-bold text-white">This Week's Activity</h3>
                            </div>
                            <span className="text-[10px] text-zinc-600 font-medium">Last 14 days</span>
                          </div>
                          <ActivityBar />
                          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/[0.04]">
                            <div>
                              <div className="text-lg font-bold text-white"><AnimatedCounter end={247} /></div>
                              <div className="text-[10px] text-zinc-600 uppercase tracking-wider">Messages</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-white"><AnimatedCounter end={12} /></div>
                              <div className="text-[10px] text-zinc-600 uppercase tracking-wider">Channels</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-white"><AnimatedCounter end={3} suffix="h" /></div>
                              <div className="text-[10px] text-zinc-600 uppercase tracking-wider">Voice time</div>
                            </div>
                          </div>
                        </div>
                      </TiltCard>

                      {/* Row 3: Smaller cards */}
                      <BentoCard
                        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>}
                        title="Polls"
                        desc="Create multi-choice polls with anonymous voting and real-time results."
                        gradient="linear-gradient(135deg, #ef4444, #dc2626)"
                        onClick={() => setView('dm')}
                      />

                      <BentoCard
                        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>}
                        title="Voice Notes"
                        desc="Record and send voice messages with AI-powered transcription."
                        gradient="linear-gradient(135deg, #ec4899, #db2777)"
                        onClick={() => setView('dm')}
                      />

                      <BentoCard
                        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>}
                        title="Writing Coach"
                        desc="AI analyzes your tone, clarity, and suggests improvements before you send."
                        gradient="linear-gradient(135deg, #eab308, #ca8a04)"
                        onClick={() => setShowAI(true)}
                      />

                      <BentoCard
                        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
                        title="Threads"
                        desc="Keep conversations organized with threaded replies and auto-archiving."
                        gradient="linear-gradient(135deg, #3b82f6, #2563eb)"
                        onClick={() => setView('dm')}
                      />
                    </div>

                    {/* ═══════ STATS FOOTER ═══════ */}
                    <div className="mt-8 flex flex-wrap items-center justify-between gap-4 px-1">
                      <div className="flex items-center gap-6">
                        {[
                          { label: 'Latency', value: '<50ms' },
                          { label: 'Uptime', value: '99.99%' },
                          { label: 'Encrypted', value: 'E2E' },
                          { label: 'AI Models', value: 'GPT-4o' },
                        ].map((s, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-zinc-700" />
                            <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-medium">{s.label}</span>
                            <span className="text-[10px] text-zinc-400 font-mono">{s.value}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-zinc-800 font-mono">v2.0.0 — built with ♡</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {showRightPanel && (
            <div className="w-[400px] border-l border-white/[0.04] flex-shrink-0 slide-in-right overflow-hidden relative hidden md:block">
              <div className="absolute inset-0 bg-gradient-to-l from-surface-900/50 to-transparent pointer-events-none" />
              {showThread && <ThreadPanel />}
              {showAI && !showThread && <AICopilotPanel onClose={() => setShowAI(false)} />}
            </div>
          )}

          {callState === 'incoming' && incomingCall && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center fade-in">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-3xl animate-pulse" />
                <div className="glass-card rounded-3xl p-8 md:p-10 text-center relative scale-in-spring">
                  <div className="w-24 md:w-28 h-24 md:h-28 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 mx-auto mb-5 md:mb-6 flex items-center justify-center animate-bounce shadow-2xl shadow-primary/20">
                    {callType === 'video' ? (
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                    ) : (
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    )}
                  </div>
                  <h2 className="text-white text-lg md:text-xl font-semibold mb-1">Incoming {callType} call</h2>
                  <p className="text-zinc-400 mb-6 md:mb-8">{incomingCall.fromName || 'Unknown'}</p>
                  <div className="flex gap-6 justify-center">
                    <button onClick={rejectCall} className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-danger/20 border border-danger/30 text-danger flex items-center justify-center cursor-pointer hover:bg-danger hover:text-white transition-all duration-300 hover:scale-110 shadow-lg shadow-danger/20">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 2.59 3.4z" transform="rotate(135 12 12)"/></svg>
                    </button>
                    <button onClick={answerCall} className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-success/20 border border-success/30 text-success flex items-center justify-center cursor-pointer hover:bg-success hover:text-white transition-all duration-300 hover:scale-110 shadow-lg shadow-success/20 animate-pulse">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(callState === 'connected' || callState === 'calling') && (
            <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex flex-col items-center justify-center fade-in p-4">
              {callType === 'video' && (
                <>
                  <video ref={remoteVideoRef} autoPlay playsInline className="w-full max-w-4xl md:max-w-5xl max-h-[60vh] md:max-h-[70vh] rounded-2xl md:rounded-3xl bg-surface-800 shadow-2xl" />
                  <div className="absolute top-4 right-4 md:top-8 md:right-8 w-32 h-24 md:w-56 md:h-40 rounded-xl md:rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl shadow-black/50 transition-all duration-300 hover:scale-105">
                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover bg-surface-700" />
                  </div>
                </>
              )}
              {callType === 'audio' && (
                <div className="text-center relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full blur-3xl" />
                  <div className="w-28 md:w-36 h-28 md:h-36 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 mx-auto mb-5 md:mb-6 flex items-center justify-center relative shadow-2xl shadow-primary/20">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  </div>
                  <p className="text-white text-base md:text-lg font-medium">Audio Call</p>
                </div>
              )}
              {callState === 'calling' && (
                <p className="text-zinc-400 mt-5 md:mt-6 animate-pulse flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" /><span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} /><span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />Connecting...
                </p>
              )}
              <div className="flex gap-3 md:gap-4 mt-8 md:mt-10">
                <button onClick={toggleMute} className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 ${isMuted ? 'bg-danger/20 text-danger border border-danger/30 hover:bg-danger hover:text-white' : 'bg-surface-700 text-white hover:bg-surface-600 border border-white/5'}`}>
                  {isMuted ? (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>) : (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>)}
                </button>
                {callType === 'video' && (<>
                  <button onClick={toggleVideo} className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 ${isVideoOff ? 'bg-danger/20 text-danger border border-danger/30 hover:bg-danger hover:text-white' : 'bg-surface-700 text-white hover:bg-surface-600 border border-white/5'}`}>
                    {isVideoOff ? (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"/></svg>) : (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>)}
                  </button>
                  <button onClick={toggleScreenShare} className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 ${isScreenSharing ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-surface-700 text-white hover:bg-surface-600 border border-white/5'}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                  </button>
                </>)}
                <button onClick={endCall} className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-danger text-white flex items-center justify-center cursor-pointer hover:bg-danger/80 transition-all duration-300 hover:scale-110 shadow-lg shadow-danger/30">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 2.59 3.4z" transform="rotate(135 12 12)"/></svg>
                </button>
              </div>
            </div>
          )}

          {showCommandPalette && <CommandPalette onClose={() => setShowCommandPalette(false)} setView={setView} onToggleAI={() => setShowAI(true)} onOpenSearch={() => setShowSearch(true)} onOpenTemplates={() => setShowTemplates(true)} onOpenNotes={() => setShowNotes(true)} />}
          
          <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
          <MessageTemplatesPanel isOpen={showTemplates} onClose={() => setShowTemplates(false)} onSelectTemplate={() => {}} />
          <NotesPanel isOpen={showNotes} onClose={() => setShowNotes(false)} />
        </ChatThreeBackground>
      </Suspense>
    </div>
  )
}

export default HomePage
