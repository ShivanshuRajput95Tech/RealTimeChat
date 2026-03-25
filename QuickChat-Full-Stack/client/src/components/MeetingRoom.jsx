import React, { useState, useEffect, useRef, useContext, useCallback } from 'react'
import { AuthContext } from '../context/AuthContext'
import toast from 'react-hot-toast'

const ParticipantTile = ({ participant, isLocal, videoRef, isMuted, isVideoOff, isHost }) => {
  return (
    <div className={`relative rounded-2xl overflow-hidden bg-surface-800 border-2 transition-all duration-300 ${
      isLocal ? 'border-primary/40 shadow-lg shadow-primary/20' : 'border-white/5 hover:border-white/10'
    }`}>
      {videoRef ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
        />
      ) : null}
      {(isVideoOff || !videoRef) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-surface-700 to-surface-800">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-white text-2xl font-bold shadow-xl">
            {participant?.fullName?.charAt(0)?.toUpperCase() || '?'}
          </div>
        </div>
      )}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-white font-medium truncate">
              {participant?.fullName || 'User'} {isLocal && '(You)'}
            </span>
            {isHost && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">Host</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {isMuted && (
              <div className="w-6 h-6 rounded-full bg-danger/20 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-danger">
                  <line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const MeetingRoom = ({ meeting, isOpen, onClose, onLeave }) => {
  const { axios, authUser, socket } = useContext(AuthContext)
  const [participants, setParticipants] = useState([])
  const [localStream, setLocalStream] = useState(null)
  const [remoteStreams, setRemoteStreams] = useState({})
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [viewMode, setViewMode] = useState('grid')

  const localVideoRef = useRef(null)
  const peerConnections = useRef({})
  const localStreamRef = useRef(null)
  const screenTrackRef = useRef(null)

  const isHost = meeting?.host?._id === authUser?._id

  const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]

  useEffect(() => {
    if (!isOpen || !meeting) return
    joinRoom()
    const timer = setInterval(() => setElapsed(prev => prev + 1), 1000)
    return () => {
      clearInterval(timer)
      cleanup()
    }
  }, [isOpen, meeting])

  useEffect(() => {
    if (!socket || !meeting) return
    const room = `meeting:${meeting._id}`

    socket.emit('joinChannel', room)

    socket.on('meeting:userJoined', handleUserJoined)
    socket.on('meeting:userLeft', handleUserLeft)
    socket.on('meeting:ended', handleMeetingEnded)
    socket.on('call-offer', handleOffer)
    socket.on('call-answer', handleAnswer)
    socket.on('ice-candidate', handleIceCandidate)

    return () => {
      socket.emit('leaveChannel', room)
      socket.off('meeting:userJoined', handleUserJoined)
      socket.off('meeting:userLeft', handleUserLeft)
      socket.off('meeting:ended', handleMeetingEnded)
      socket.off('call-offer', handleOffer)
      socket.off('call-answer', handleAnswer)
      socket.off('ice-candidate', handleIceCandidate)
    }
  }, [socket, meeting])

  const joinRoom = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      localStreamRef.current = stream
      setLocalStream(stream)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      await axios.post(`/api/meetings/${meeting._id}/join`)
      setParticipants(meeting.participants?.filter(p => p.status === 'joined' || p.status === 'accepted') || [])
    } catch (error) {
      toast.error('Could not access camera/microphone')
    }
  }

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop())
    }
    if (screenTrackRef.current) {
      screenTrackRef.current.stop()
    }
    Object.values(peerConnections.current).forEach(pc => pc.close())
    peerConnections.current = {}
  }

  const createPeerConnection = useCallback((userId) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    peerConnections.current[userId] = pc

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current)
      })
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', { candidate: event.candidate, to: userId })
      }
    }

    pc.ontrack = (event) => {
      setRemoteStreams(prev => ({ ...prev, [userId]: event.streams[0] }))
    }

    return pc
  }, [socket])

  const handleUserJoined = useCallback(async ({ user }) => {
    toast.success(`${user.fullName} joined`)
    const pc = createPeerConnection(user._id)
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    if (socket) {
      socket.emit('call-offer', { offer, to: user._id, type: 'meeting', from: authUser._id })
    }
  }, [socket, authUser, createPeerConnection])

  const handleUserLeft = useCallback(({ userId }) => {
    toast('A participant left')
    if (peerConnections.current[userId]) {
      peerConnections.current[userId].close()
      delete peerConnections.current[userId]
    }
    setRemoteStreams(prev => {
      const updated = { ...prev }
      delete updated[userId]
      return updated
    })
  }, [])

  const handleMeetingEnded = useCallback(() => {
    toast.success('Meeting ended')
    cleanup()
    onClose()
  }, [onClose])

  const handleOffer = useCallback(async ({ offer, from }) => {
    const pc = createPeerConnection(from)
    await pc.setRemoteDescription(new RTCSessionDescription(offer))
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    if (socket) {
      socket.emit('call-answer', { answer, to: from })
    }
  }, [socket, createPeerConnection])

  const handleAnswer = useCallback(async ({ answer, from }) => {
    const pc = peerConnections.current[from]
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer))
    }
  }, [])

  const handleIceCandidate = useCallback(async ({ candidate, from }) => {
    const pc = peerConnections.current[from]
    if (pc && candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate))
    }
  }, [])

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoOff(!videoTrack.enabled)
      }
    }
  }

  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        if (screenTrackRef.current) {
          screenTrackRef.current.stop()
          const videoTrack = localStreamRef.current?.getVideoTracks()[0]
          Object.values(peerConnections.current).forEach(pc => {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video')
            if (sender && videoTrack) sender.replaceTrack(videoTrack)
          })
          setIsScreenSharing(false)
        }
      } else {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        const screenTrack = screenStream.getVideoTracks()[0]
        screenTrackRef.current = screenTrack
        Object.values(peerConnections.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video')
          if (sender) sender.replaceTrack(screenTrack)
        })
        setIsScreenSharing(true)
        screenTrack.onended = () => toggleScreenShare()
      }
    } catch {
      toast.error('Could not share screen')
    }
  }

  const handleEndCall = async () => {
    if (isHost) {
      await axios.post(`/api/meetings/${meeting._id}/end`)
    } else {
      await axios.post(`/api/meetings/${meeting._id}/leave`)
    }
    cleanup()
    onLeave?.()
    onClose()
  }

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  if (!isOpen) return null

  const allParticipants = [
    { user: authUser, isLocal: true, isMuted, isVideoOff },
    ...Object.entries(remoteStreams).map(([id, stream]) => ({
      user: { _id: id },
      stream,
      isLocal: false,
    }))
  ]

  return (
    <div className="fixed inset-0 z-[300] bg-surface-900 flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 bg-surface-800/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-danger animate-pulse" />
            <span className="text-sm text-white font-medium">{meeting?.title || 'Meeting'}</span>
          </div>
          <span className="text-xs text-zinc-500 bg-surface-700/50 px-2 py-1 rounded-lg font-mono">
            {meeting?.meetingCode}
          </span>
          <span className="text-xs text-zinc-400 font-mono">{formatTime(elapsed)}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode(v => v === 'grid' ? 'speaker' : 'grid')}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
            </svg>
          </button>
          <button onClick={() => setIsChatOpen(!isChatOpen)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${isChatOpen ? 'bg-primary/20 text-primary' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
          <div className="w-px h-6 bg-white/10 mx-1" />
          <span className="text-xs text-zinc-500">{allParticipants.length} participant{allParticipants.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className={`flex-1 p-4 ${viewMode === 'grid' ? 'grid gap-3' : 'flex flex-col gap-3'}`}
          style={viewMode === 'grid' ? {
            gridTemplateColumns: allParticipants.length <= 1 ? '1fr' : allParticipants.length <= 4 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gridTemplateRows: allParticipants.length <= 2 ? '1fr' : 'repeat(2, 1fr)',
          } : {}}>
          {allParticipants.map((p, i) => (
            <ParticipantTile
              key={p.user?._id || i}
              participant={p.user}
              isLocal={p.isLocal}
              videoRef={p.isLocal ? localVideoRef : null}
              isMuted={p.isMuted}
              isVideoOff={p.isVideoOff}
              isHost={meeting?.host?._id === p.user?._id}
            />
          ))}
        </div>

        {isChatOpen && (
          <div className="w-80 border-l border-white/5 bg-surface-800/50 flex flex-col">
            <div className="px-4 py-3 border-b border-white/5">
              <p className="text-sm font-medium text-white">Meeting Chat</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {chatMessages.map((msg, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <span className="text-[10px] text-zinc-500">{msg.sender}</span>
                  <p className="text-sm text-white bg-surface-700/50 rounded-xl px-3 py-2">{msg.text}</p>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-white/5">
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && chatInput.trim()) {
                      setChatMessages(prev => [...prev, { sender: authUser.fullName, text: chatInput.trim() }])
                      setChatInput('')
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 bg-surface-700/60 rounded-xl px-3 py-2 text-sm text-white outline-none border border-white/5"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 py-4 bg-surface-800/80 backdrop-blur-xl border-t border-white/5">
        <button onClick={toggleMute}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${isMuted ? 'bg-danger/20 text-danger hover:bg-danger hover:text-white' : 'bg-surface-700 text-white hover:bg-surface-600'}`}>
          {isMuted ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          )}
        </button>
        <button onClick={toggleVideo}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${isVideoOff ? 'bg-danger/20 text-danger hover:bg-danger hover:text-white' : 'bg-surface-700 text-white hover:bg-surface-600'}`}>
          {isVideoOff ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
          )}
        </button>
        <button onClick={toggleScreenShare}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${isScreenSharing ? 'bg-primary/20 text-primary' : 'bg-surface-700 text-white hover:bg-surface-600'}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        </button>
        <div className="w-px h-8 bg-white/10 mx-2" />
        <button onClick={handleEndCall}
          className="w-14 h-12 rounded-2xl bg-danger text-white flex items-center justify-center cursor-pointer hover:bg-danger/80 transition-all shadow-lg shadow-danger/30">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 2.59 3.4z" transform="rotate(135 12 12)"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

export default MeetingRoom
