import React, { useContext, useCallback } from 'react'
import { VoiceContext } from '../../context/VoiceContext'
import { ChatContext } from '../../context/ChatContext'
import { WorkspaceContext } from '../../context/WorkspaceContext'
import toast from 'react-hot-toast'

const VoiceRecorderButton = () => {
  const { isRecording, recordingDuration, isSending, startRecording, stopRecording, sendVoiceMessage, cancelRecording } = useContext(VoiceContext)
  const { selectedUser, sendMessage } = useContext(ChatContext)
  const { selectedChannel } = useContext(WorkspaceContext)

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleRecord = useCallback(async () => {
    if (isRecording) {
      const receiverId = selectedUser?._id
      const channelId = selectedChannel?._id
      const result = await stopRecording(receiverId, channelId)
      if (result) {
        const msg = await sendVoiceMessage(
          result.audio,
          result.duration,
          receiverId,
          channelId
        )
      }
    } else {
      const receiverId = selectedUser?._id
      const channelId = selectedChannel?._id
      if (!receiverId && !channelId) {
        toast.error('Select a conversation first')
        return
      }
      await startRecording(receiverId, channelId)
    }
  }, [isRecording, selectedUser, selectedChannel, startRecording, stopRecording, sendVoiceMessage])

  if (isRecording) {
    return (
      <div className="flex items-center gap-2 animate-in">
        <button
          onClick={cancelRecording}
          className="w-10 h-10 rounded-xl bg-danger/20 text-danger flex items-center justify-center cursor-pointer hover:bg-danger/30 transition-all"
          title="Cancel recording"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="flex items-center gap-2 bg-danger/10 rounded-xl px-3 py-2 border border-danger/20">
          <div className="w-3 h-3 bg-danger rounded-full animate-pulse" />
          <span className="text-sm text-danger font-mono font-medium">{formatDuration(recordingDuration)}</span>
        </div>
        <button
          onClick={handleRecord}
          disabled={isSending}
          className="w-10 h-10 rounded-xl bg-gradient-to-r from-success to-emerald-500 text-white flex items-center justify-center cursor-pointer hover:shadow-lg hover:shadow-success/30 transition-all disabled:opacity-50"
          title="Send voice message"
        >
          {isSending ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleRecord}
      className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-surface-700/60 cursor-pointer transition-all duration-300 hover:scale-110"
      title="Record voice message"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    </button>
  )
}

export default VoiceRecorderButton
