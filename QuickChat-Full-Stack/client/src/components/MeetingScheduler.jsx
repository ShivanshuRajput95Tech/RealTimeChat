import React, { useState, useContext } from 'react'
import { AuthContext } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const MeetingScheduler = ({ isOpen, onClose, workspaceId, channelId, members, onMeetingCreated }) => {
  const { axios, authUser } = useContext(AuthContext)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('instant')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [selectedParticipants, setSelectedParticipants] = useState([])
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringPattern, setRecurringPattern] = useState('weekly')
  const [settings, setSettings] = useState({
    allowScreenShare: true,
    allowRecording: false,
    muteOnJoin: true,
    waitingRoom: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState(1)

  if (!isOpen) return null

  const toggleParticipant = (userId) => {
    setSelectedParticipants(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  const selectAll = () => {
    if (selectedParticipants.length === availableMembers.length) {
      setSelectedParticipants([])
    } else {
      setSelectedParticipants(availableMembers.map(m => m.user?._id || m._id))
    }
  }

  const availableMembers = members?.filter(m => {
    const uid = m.user?._id || m._id
    return uid !== authUser?._id
  }) || []

  const handleSubmit = async () => {
    if (!title.trim()) return toast.error('Enter a meeting title')
    if (type === 'scheduled' && (!date || !time)) return toast.error('Select date and time')

    setIsSubmitting(true)
    try {
      const body = {
        title: title.trim(),
        description: description.trim(),
        workspaceId,
        channelId,
        type,
        participants: selectedParticipants,
        settings,
        isRecurring,
        recurringPattern: isRecurring ? recurringPattern : null,
      }

      if (type === 'scheduled') {
        body.scheduledAt = new Date(`${date}T${time}`).toISOString()
      }

      const { data } = await axios.post('/api/meetings', body)
      if (data.success) {
        toast.success(type === 'instant' ? 'Meeting started!' : 'Meeting scheduled!')
        onMeetingCreated?.(data.meeting)
        resetForm()
        onClose()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create meeting')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setType('instant')
    setDate('')
    setTime('')
    setSelectedParticipants([])
    setIsRecurring(false)
    setStep(1)
  }

  const getMinDate = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-800/95 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-black/50 w-[520px] max-h-[85vh] overflow-hidden border border-white/10 scale-in" onClick={e => e.stopPropagation()}>
        <div className="relative px-6 py-5 border-b border-white/10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-transparent" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
                  <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {type === 'instant' ? 'Start Meeting' : 'Schedule Meeting'}
                </h3>
                <p className="text-xs text-zinc-500">Step {step} of 2</p>
              </div>
            </div>
            <button onClick={() => { resetForm(); onClose() }} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {step === 1 && (
            <>
              <div className="flex gap-2 p-1 bg-surface-700/50 rounded-xl">
                <button onClick={() => setType('instant')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${type === 'instant' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-zinc-400 hover:text-white'}`}>
                  Start Now
                </button>
                <button onClick={() => setType('scheduled')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${type === 'scheduled' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-zinc-400 hover:text-white'}`}>
                  Schedule
                </button>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400 mb-2 block">Meeting Title</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., Weekly Standup, Project Review..."
                  className="w-full bg-surface-700/60 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none border border-white/5 focus:border-primary/40 transition-colors"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400 mb-2 block">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What's this meeting about?"
                  rows={2}
                  className="w-full bg-surface-700/60 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none border border-white/5 focus:border-primary/40 transition-colors resize-none"
                />
              </div>

              {type === 'scheduled' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-zinc-400 mb-2 block">Date</label>
                      <input type="date" value={date} onChange={e => setDate(e.target.value)} min={getMinDate()}
                        className="w-full bg-surface-700/60 rounded-xl px-4 py-3 text-sm text-white outline-none border border-white/5 focus:border-primary/40 transition-colors [color-scheme:dark]" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-400 mb-2 block">Time</label>
                      <input type="time" value={time} onChange={e => setTime(e.target.value)}
                        className="w-full bg-surface-700/60 rounded-xl px-4 py-3 text-sm text-white outline-none border border-white/5 focus:border-primary/40 transition-colors [color-scheme:dark]" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-700/30 border border-white/5">
                    <button onClick={() => setIsRecurring(!isRecurring)}
                      className={`w-10 h-6 rounded-full transition-all relative cursor-pointer ${isRecurring ? 'bg-primary' : 'bg-surface-600'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all shadow-lg ${isRecurring ? 'left-5' : 'left-1'}`} />
                    </button>
                    <div className="flex-1">
                      <p className="text-sm text-white">Recurring meeting</p>
                    </div>
                    {isRecurring && (
                      <select value={recurringPattern} onChange={e => setRecurringPattern(e.target.value)}
                        className="bg-surface-600 rounded-lg px-3 py-1.5 text-xs text-white outline-none border border-white/10 cursor-pointer">
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Biweekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    )}
                  </div>
                </>
              )}

              <div className="space-y-3">
                <label className="text-xs font-medium text-zinc-400 block">Meeting Settings</label>
                {Object.entries({
                  allowScreenShare: 'Allow screen sharing',
                  muteOnJoin: 'Mute participants on join',
                  waitingRoom: 'Enable waiting room',
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-700/20">
                    <button onClick={() => setSettings(s => ({ ...s, [key]: !s[key] }))}
                      className={`w-9 h-5 rounded-full transition-all relative cursor-pointer ${settings[key] ? 'bg-primary' : 'bg-surface-600'}`}>
                      <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all shadow ${settings[key] ? 'left-4' : 'left-0.5'}`} />
                    </button>
                    <span className="text-sm text-zinc-300">{label}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-400">Invite Participants</label>
                <button onClick={selectAll} className="text-xs text-primary hover:text-primary/80 cursor-pointer">
                  {selectedParticipants.length === availableMembers.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                {availableMembers.map(member => {
                  const user = member.user || member
                  const isSelected = selectedParticipants.includes(user._id)
                  return (
                    <button key={user._id} onClick={() => toggleParticipant(user._id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${isSelected ? 'bg-primary/10 border border-primary/30' : 'bg-surface-700/30 border border-white/5 hover:bg-surface-700/50'}`}>
                      <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                        {user.profilePic ? (
                          <img src={user.profilePic} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
                            {user.fullName?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm text-white font-medium">{user.fullName}</p>
                        <p className="text-xs text-zinc-500">{member.role || 'Member'}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary' : 'border-zinc-600'}`}>
                        {isSelected && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                      </div>
                    </button>
                  )
                })}
                {availableMembers.length === 0 && (
                  <p className="text-center text-zinc-500 text-sm py-8">No other members in this workspace</p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-white/10 flex gap-3">
          {step === 1 ? (
            <>
              <button onClick={() => { resetForm(); onClose() }}
                className="flex-1 px-4 py-3 rounded-xl bg-surface-700/60 text-sm text-zinc-300 hover:text-white transition-all cursor-pointer border border-white/5">
                Cancel
              </button>
              <button onClick={() => { if (!title.trim()) return toast.error('Enter a title'); setStep(2) }}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-sm text-white font-medium hover:shadow-lg hover:shadow-primary/30 transition-all cursor-pointer">
                Next: Participants
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setStep(1)}
                className="flex-1 px-4 py-3 rounded-xl bg-surface-700/60 text-sm text-zinc-300 hover:text-white transition-all cursor-pointer border border-white/5">
                Back
              </button>
              <button onClick={handleSubmit} disabled={isSubmitting}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-sm text-white font-medium hover:shadow-lg hover:shadow-primary/30 transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                    </svg>
                    {type === 'instant' ? 'Start Meeting' : 'Schedule'}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default MeetingScheduler
