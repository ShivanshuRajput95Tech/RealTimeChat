import React, { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import MeetingScheduler from './MeetingScheduler'
import MeetingRoom from './MeetingRoom'
import toast from 'react-hot-toast'

const MeetingsPanel = ({ workspaceId, channelId, members, isOpen, onClose }) => {
  const { axios, authUser } = useContext(AuthContext)
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showScheduler, setShowScheduler] = useState(false)
  const [activeMeeting, setActiveMeeting] = useState(null)
  const [filter, setFilter] = useState('upcoming')
  const [joinCode, setJoinCode] = useState('')
  const [showJoinInput, setShowJoinInput] = useState(false)

  useEffect(() => {
    if (isOpen && workspaceId) fetchMeetings()
  }, [isOpen, workspaceId, filter])

  const fetchMeetings = async () => {
    setLoading(true)
    try {
      const params = filter === 'upcoming' ? '?upcoming=true' : filter === 'active' ? '?status=active' : ''
      const { data } = await axios.get(`/api/meetings/workspace/${workspaceId}${params}`)
      if (data.success) setMeetings(data.meetings)
    } catch {
      toast.error('Failed to load meetings')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async (meeting) => {
    setActiveMeeting(meeting)
  }

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) return
    try {
      const { data } = await axios.get(`/api/meetings/code/${joinCode.trim()}`)
      if (data.success) {
        setActiveMeeting(data.meeting)
        setShowJoinInput(false)
        setJoinCode('')
      }
    } catch {
      toast.error('Meeting not found')
    }
  }

  const handleMeetingCreated = (meeting) => {
    setMeetings(prev => [meeting, ...prev])
    if (meeting.type === 'instant') {
      setActiveMeeting(meeting)
    }
  }

  const handleDelete = async (meetingId) => {
    try {
      await axios.delete(`/api/meetings/${meetingId}`)
      setMeetings(prev => prev.filter(m => m._id !== meetingId))
      toast.success('Meeting deleted')
    } catch {
      toast.error('Failed to delete meeting')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-success/20 text-success'
      case 'waiting': return 'bg-warning/20 text-warning'
      case 'ended': return 'bg-zinc-500/20 text-zinc-400'
      default: return 'bg-zinc-500/20 text-zinc-400'
    }
  }

  const formatDateTime = (date) => {
    const d = new Date(date)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    if (d.toDateString() === today.toDateString()) return `Today at ${timeStr}`
    if (d.toDateString() === tomorrow.toDateString()) return `Tomorrow at ${timeStr}`
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-surface-800/95 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-black/50 w-[600px] max-h-[85vh] overflow-hidden border border-white/10 scale-in" onClick={e => e.stopPropagation()}>
          <div className="relative px-6 py-5 border-b border-white/10">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-transparent" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
                    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Meetings</h3>
                  <p className="text-xs text-zinc-500">{meetings.length} meeting{meetings.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowJoinInput(!showJoinInput)}
                  className="px-3 py-2 rounded-xl bg-surface-700/60 text-xs text-zinc-300 hover:text-white border border-white/5 hover:bg-surface-600/60 transition-all cursor-pointer flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                  Join
                </button>
                <button onClick={() => setShowScheduler(true)}
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-xs text-white font-medium hover:shadow-lg hover:shadow-primary/30 transition-all cursor-pointer flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  New Meeting
                </button>
                <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
          </div>

          {showJoinInput && (
            <div className="px-6 py-4 border-b border-white/5 bg-surface-700/20">
              <div className="flex gap-2">
                <input
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter meeting code (e.g., ABCD-1234)"
                  className="flex-1 bg-surface-700/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none border border-white/5 focus:border-primary/40 font-mono tracking-wider"
                  autoFocus
                />
                <button onClick={handleJoinByCode}
                  className="px-4 py-2.5 rounded-xl bg-primary text-sm text-white font-medium hover:bg-primary/80 transition-all cursor-pointer">
                  Join
                </button>
              </div>
            </div>
          )}

          <div className="p-4 border-b border-white/5">
            <div className="flex gap-2">
              {['upcoming', 'active', 'all'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    filter === f ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-surface-700/40 text-zinc-400 hover:text-white border border-white/5'
                  }`}>
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
            ) : meetings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-16 h-16 rounded-2xl bg-surface-700/50 flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-600">
                    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                </div>
                <p className="text-sm text-zinc-500">No meetings found</p>
                <button onClick={() => setShowScheduler(true)}
                  className="text-xs text-primary hover:text-primary/80 cursor-pointer">Create your first meeting</button>
              </div>
            ) : (
              meetings.map(meeting => (
                <div key={meeting._id} className="group bg-surface-700/40 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
                        <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm text-white font-medium truncate">{meeting.title}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getStatusColor(meeting.status)}`}>
                          {meeting.status}
                        </span>
                        {meeting.isRecurring && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500">
                            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                          </svg>
                        )}
                      </div>
                      {meeting.description && <p className="text-xs text-zinc-500 mb-1 line-clamp-1">{meeting.description}</p>}
                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <span>{meeting.scheduledAt ? formatDateTime(meeting.scheduledAt) : 'Instant'}</span>
                        <span>Host: {meeting.host?.fullName}</span>
                        <span>{meeting.participants?.length || 0} invited</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-zinc-600 font-mono bg-surface-600/50 px-2 py-0.5 rounded">{meeting.meetingCode}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      {meeting.status !== 'ended' && (
                        <button onClick={() => handleJoin(meeting)}
                          className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-medium hover:bg-primary/30 transition-all cursor-pointer">
                          Join
                        </button>
                      )}
                      {meeting.host?._id === authUser?._id && (
                        <button onClick={() => handleDelete(meeting._id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-danger hover:bg-danger/10 transition-all cursor-pointer">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <MeetingScheduler
        isOpen={showScheduler}
        onClose={() => setShowScheduler(false)}
        workspaceId={workspaceId}
        channelId={channelId}
        members={members}
        onMeetingCreated={handleMeetingCreated}
      />

      <MeetingRoom
        meeting={activeMeeting}
        isOpen={!!activeMeeting}
        onClose={() => setActiveMeeting(null)}
        onLeave={() => fetchMeetings()}
      />
    </>
  )
}

export default MeetingsPanel
