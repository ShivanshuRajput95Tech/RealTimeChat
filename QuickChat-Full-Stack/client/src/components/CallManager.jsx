import { useContext, useState, useRef, useEffect, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ChatContext } from '../context/ChatContext';
import toast from 'react-hot-toast';

export const useCallManager = () => {
    const { socket, authUser } = useContext(AuthContext);
    const { selectedUser } = useContext(ChatContext);

    const [callState, setCallState] = useState('idle');
    const [callType, setCallType] = useState('audio');
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [incomingCall, setIncomingCall] = useState(null);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnection = useRef(null);
    const localStreamRef = useRef(null);

    const ICE_SERVERS = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ],
    };

    const cleanup = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
        }
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        setLocalStream(null);
        setRemoteStream(null);
        setIsMuted(false);
        setIsVideoOff(false);
        setIsScreenSharing(false);
        setCallState('idle');
        setIncomingCall(null);
    }, []);

    const startCall = async (type = 'audio') => {
        if (!selectedUser || !socket) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' });
            localStreamRef.current = stream;
            setLocalStream(stream);
            setCallType(type);
            setCallState('calling');

            const pc = new RTCPeerConnection(ICE_SERVERS);
            peerConnection.current = pc;
            stream.getTracks().forEach(t => pc.addTrack(t, stream));
            pc.onicecandidate = (e) => { if (e.candidate) socket.emit('ice-candidate', { candidate: e.candidate, to: selectedUser._id }); };
            pc.ontrack = (e) => setRemoteStream(e.streams[0]);

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('call-offer', { offer, to: selectedUser._id, type, from: authUser._id, fromName: authUser.fullName });
        } catch {
            toast.error('Could not access camera/microphone');
            cleanup();
        }
    };

    const answerCall = async () => {
        if (!incomingCall || !socket) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: incomingCall.type === 'video' });
            localStreamRef.current = stream;
            setLocalStream(stream);
            setCallType(incomingCall.type);
            setCallState('connected');

            const pc = new RTCPeerConnection(ICE_SERVERS);
            peerConnection.current = pc;
            stream.getTracks().forEach(t => pc.addTrack(t, stream));
            pc.onicecandidate = (e) => { if (e.candidate) socket.emit('ice-candidate', { candidate: e.candidate, to: incomingCall.from }); };
            pc.ontrack = (e) => setRemoteStream(e.streams[0]);

            await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('call-answer', { answer, to: incomingCall.from });
        } catch {
            toast.error('Could not access camera/microphone');
            cleanup();
        }
    };

    const rejectCall = () => {
        if (incomingCall && socket) socket.emit('call-rejected', { to: incomingCall.from });
        cleanup();
    };

    const endCall = () => {
        const other = incomingCall?.from || selectedUser?._id;
        if (socket && other) socket.emit('call-ended', { to: other });
        cleanup();
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
            setIsMuted(prev => !prev);
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
            setIsVideoOff(prev => !prev);
        }
    };

    const toggleScreenShare = async () => {
        if (isScreenSharing) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callType === 'video' });
                const track = stream.getVideoTracks()[0];
                const sender = peerConnection.current?.getSenders().find(s => s.track?.kind === 'video');
                if (sender && track) sender.replaceTrack(track);
                if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
                localStreamRef.current = stream;
                setLocalStream(stream);
                setIsScreenSharing(false);
            } catch { /* ignore */ }
        } else {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const screenTrack = screenStream.getVideoTracks()[0];
                const sender = peerConnection.current?.getSenders().find(s => s.track?.kind === 'video');
                if (sender) sender.replaceTrack(screenTrack);
                screenTrack.onended = () => toggleScreenShare();
                localStreamRef.current = screenStream;
                setLocalStream(screenStream);
                setIsScreenSharing(true);
            } catch {
                toast.error('Screen sharing cancelled');
            }
        }
    };

    useEffect(() => {
        if (!socket) return;

        const onOffer = (data) => { setIncomingCall(data); setCallState('incoming'); setCallType(data.type); };
        const onAnswer = async (data) => { if (peerConnection.current) { await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer)); setCallState('connected'); } };
        const onIce = async (data) => { if (peerConnection.current && data.candidate) await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(() => {}); };
        const onEnd = () => { cleanup(); toast('Call ended'); };
        const onReject = () => { cleanup(); toast.error('Call rejected'); };

        socket.on('call-offer', onOffer);
        socket.on('call-answer', onAnswer);
        socket.on('ice-candidate', onIce);
        socket.on('call-ended', onEnd);
        socket.on('call-rejected', onReject);

        return () => {
            socket.off('call-offer', onOffer);
            socket.off('call-answer', onAnswer);
            socket.off('ice-candidate', onIce);
            socket.off('call-ended', onEnd);
            socket.off('call-rejected', onReject);
        };
    }, [socket, cleanup]);

    useEffect(() => { if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream; }, [localStream]);
    useEffect(() => { if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream; }, [remoteStream]);

    return {
        callState, callType, localStream, remoteStream, isMuted, isVideoOff, isScreenSharing, incomingCall,
        localVideoRef, remoteVideoRef,
        startCall, answerCall, rejectCall, endCall, toggleMute, toggleVideo, toggleScreenShare,
    };
};
