import React, { useState, useContext } from 'react'
import { AuthContext } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const ScheduleMessageModal = ({ isOpen, onClose, onSchedule, receiverId, channelId, groupId }) => {
  const { axios } = useContext(AuthContext)
  const [text, setText] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringPattern, setRecurringPattern] = useState('daily')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return toast.error('Enter a message')
    if (!date || !time) return toast.error('Select date and time')

    const scheduledAt = new Date(`${date}T${time}`)
    if (scheduledAt <= new Date()) return toast.error('Schedule time must be in the future')

    setIsSubmitting(true)
    try {
      const body = { text: text.trim(), scheduledAt: scheduledAt.toISOString() }
      if (receiverId) body.receiverId = receiverId
      if (channelId) body.channelId = channelId
      if (groupId) body.groupId = groupId

      const { data } = await axios.post('/api/messages/schedule', body)
      if (data.success) {
        toast.success(`Message scheduled for ${scheduledAt.toLocaleString()}`)
        onSchedule?.(data.message)
        setText('')
        setDate('')
        setTime('')
        onClose()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to schedule message')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getMinDateTime = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const quickTimes = [
    { label: 'In 1 hour', hours: 1 },
    { label: 'In 3 hours', hours: 3 },
    { label: 'Tomorrow 9AM', offset: () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d } },
    { label: 'Next Monday', offset: () => { const d = new Date(); const day = d.getDay(); const diff = day === 0 ? 1 : 8 - day; d.setDate(d.getDate() + diff); d.setHours(9, 0, 0, 0); return d } },
  ]

  const setQuickTime = (qt) => {
    let targetDate
    if (qt.offset) {
      targetDate = qt.offset()
    } else {
      targetDate = new Date(Date.now() + qt.hours * 3600000)
    }
    const year = targetDate.getFullYear()
    const month = String(targetDate.getMonth() + 1).padStart(2, '0')
    const day = String(targetDate.getDate()).padStart(2, '0')
    const hours = String(targetDate.getHours()).padStart(2, '0')
    const minutes = String(targetDate.getMinutes()).padStart(2, '0')
    setDate(`${year}-${month}-${day}`)
    setTime(`${hours}:${minutes}`)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-800/95 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-black/50 w-[480px] max-h-[90vh] overflow-hidden border border-white/10 scale-in" onClick={e => e.stopPropagation()}>
        <div className="relative px-6 py-5 border-b border-white/10">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-transparent" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Schedule Message</h3>
                <p className="text-xs text-zinc-500">Set a time to send your message</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-2 block">Message</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Type your scheduled message..."
              rows={3}
              className="w-full bg-surface-700/60 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none border border-white/5 focus:border-primary/40 transition-colors resize-none"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-400 mb-2 block">Quick Schedule</label>
            <div className="grid grid-cols-2 gap-2">
              {quickTimes.map(qt => (
                <button
                  key={qt.label}
                  type="button"
                  onClick={() => setQuickTime(qt)}
                  className="px-3 py-2 rounded-xl bg-surface-700/40 border border-white/5 text-xs text-zinc-300 hover:bg-primary/10 hover:border-primary/30 hover:text-white transition-all cursor-pointer"
                >
                  {qt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-2 block">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                min={getMinDateTime()}
                className="w-full bg-surface-700/60 rounded-xl px-4 py-3 text-sm text-white outline-none border border-white/5 focus:border-primary/40 transition-colors [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-2 block">Time</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full bg-surface-700/60 rounded-xl px-4 py-3 text-sm text-white outline-none border border-white/5 focus:border-primary/40 transition-colors [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-700/30 border border-white/5">
            <button
              type="button"
              onClick={() => setIsRecurring(!isRecurring)}
              className={`w-10 h-6 rounded-full transition-all relative cursor-pointer ${isRecurring ? 'bg-primary' : 'bg-surface-600'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all shadow-lg ${isRecurring ? 'left-5' : 'left-1'}`} />
            </button>
            <div className="flex-1">
              <p className="text-sm text-white">Recurring message</p>
              <p className="text-xs text-zinc-500">Send this message on a schedule</p>
            </div>
            {isRecurring && (
              <select
                value={recurringPattern}
                onChange={e => setRecurringPattern(e.target.value)}
                className="bg-surface-600 rounded-lg px-3 py-1.5 text-xs text-white outline-none border border-white/10 cursor-pointer"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="monthly">Monthly</option>
              </select>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl bg-surface-700/60 text-sm text-zinc-300 hover:text-white hover:bg-surface-600/60 transition-all cursor-pointer border border-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !text.trim() || !date || !time}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-sm text-white font-medium hover:shadow-lg hover:shadow-primary/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              )}
              Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ScheduleMessageModal
