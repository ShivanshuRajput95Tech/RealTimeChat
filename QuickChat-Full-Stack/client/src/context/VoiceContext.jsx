import { createContext, useContext, useState, useCallback, useRef } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const VoiceContext = createContext();

export const VoiceProvider = ({ children }) => {
    const { axios, socket } = useContext(AuthContext);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [playingVoice, setPlayingVoice] = useState(null);
    const [isSending, setIsSending] = useState(false);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);
    const audioRef = useRef(null);
    const streamRef = useRef(null);

    const startRecording = useCallback(async (receiverId, channelId, groupId) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "audio/webm" });
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.start(250);
            setIsRecording(true);
            setRecordingDuration(0);

            timerRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);

            if (socket) {
                socket.emit("voice-recording-start", { receiverId, channelId, groupId });
            }
        } catch {
            toast.error("Microphone access denied");
        }
    }, [socket]);

    const stopRecording = useCallback(async (receiverId, channelId, groupId) => {
        return new Promise((resolve) => {
            if (!mediaRecorderRef.current || !isRecording) {
                resolve(null);
                return;
            }

            mediaRecorderRef.current.onstop = async () => {
                clearInterval(timerRef.current);
                setIsRecording(false);

                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(t => t.stop());
                    streamRef.current = null;
                }

                if (socket) {
                    socket.emit("voice-recording-stop", { receiverId, channelId, groupId });
                }

                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                const reader = new FileReader();
                reader.onloadend = async () => {
                    const base64Audio = reader.result;
                    resolve({ audio: base64Audio, duration: recordingDuration });
                };
                reader.readAsDataURL(audioBlob);
            };

            mediaRecorderRef.current.stop();
        });
    }, [isRecording, recordingDuration, socket]);

    const sendVoiceMessage = useCallback(async (audio, duration, receiverId, channelId, groupId) => {
        try {
            setIsSending(true);
            const { data } = await axios.post("/api/voice/send", {
                audio,
                duration,
                receiverId,
                channelId,
                groupId,
            });
            if (data.success) {
                toast.success("Voice message sent");
                return data.newMessage;
            }
            return null;
        } catch {
            toast.error("Failed to send voice message");
            return null;
        } finally {
            setIsSending(false);
        }
    }, [axios]);

    const playVoice = useCallback((url) => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        if (playingVoice === url) {
            setPlayingVoice(null);
            return;
        }

        const audio = new Audio(url);
        audioRef.current = audio;
        setPlayingVoice(url);

        audio.onended = () => {
            setPlayingVoice(null);
            audioRef.current = null;
        };

        audio.play().catch(() => {
            toast.error("Failed to play voice message");
            setPlayingVoice(null);
        });
    }, [playingVoice]);

    const stopPlaying = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
            setPlayingVoice(null);
        }
    }, []);

    const cancelRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            clearInterval(timerRef.current);
            setIsRecording(false);
            audioChunksRef.current = [];
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }
        }
    }, [isRecording]);

    const value = {
        isRecording, recordingDuration, playingVoice, isSending,
        startRecording, stopRecording, sendVoiceMessage,
        playVoice, stopPlaying, cancelRecording,
    };

    return (
        <VoiceContext.Provider value={value}>
            {children}
        </VoiceContext.Provider>
    );
};
