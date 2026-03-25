import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";
import { formatError } from "../lib/utils";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});
    const [typingUsers, setTypingUsers] = useState({});
    const [threadMessages, setThreadMessages] = useState([]);
    const [activeThread, setActiveThread] = useState(null);
    const [pinnedMessages, setPinnedMessages] = useState([]);
    const [editingMessage, setEditingMessage] = useState(null);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    const { socket, axios } = useContext(AuthContext);
    const selectedUserRef = useRef(selectedUser);
    const messagesRef = useRef(messages);

    // Keep refs in sync
    useEffect(() => {
        selectedUserRef.current = selectedUser;
    }, [selectedUser]);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    // Fetch users for sidebar
    const getUsers = useCallback(async () => {
        try {
            const { data } = await axios.get("/api/messages/users");
            if (data.success) {
                setUsers(data.users);
                setUnseenMessages(data.unseenMessages);
            }
        } catch {
            // Silent fail for users list
        }
    }, [axios]);

    // Fetch messages for a conversation
    const getMessages = useCallback(async (userId) => {
        if (!userId) return;
        setIsLoadingMessages(true);
        try {
            const { data } = await axios.get(`/api/messages/${userId}`);
            if (data.success) {
                setMessages(data.messages);
                setPinnedMessages(data.messages.filter(m => m.pinned && !m.deleted));
            }
        } catch (error) {
            toast.error(formatError(error));
        } finally {
            setIsLoadingMessages(false);
        }
    }, [axios]);

    // Send a message
    const sendMessage = useCallback(async (messageData) => {
        if (!selectedUserRef.current) return;
        try {
            const { data } = await axios.post(
                `/api/messages/send/${selectedUserRef.current._id}`,
                messageData
            );
            if (data.success) {
                setMessages(prev => [...prev, data.newMessage]);
                return data.newMessage;
            }
            toast.error(data.message);
            return null;
        } catch (error) {
            toast.error(formatError(error));
            return null;
        }
    }, [axios]);

    // Toggle reaction on message
    const toggleReaction = useCallback(async (messageId, emoji) => {
        if (!messageId || !emoji) return;
        try {
            const { data } = await axios.post(`/api/messages/${messageId}/reactions`, { emoji });
            if (data.success) {
                setMessages(prev => prev.map(m =>
                    m._id === messageId ? { ...m, reactions: data.reactions } : m
                ));
                if (selectedUserRef.current && socket) {
                    socket.emit("messageReacted", {
                        messageId,
                        reactions: data.reactions,
                        targetId: selectedUserRef.current._id,
                    });
                }
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(formatError(error));
        }
    }, [axios, socket]);

    // Edit a message
    const editMessage = useCallback(async (messageId, newText) => {
        if (!messageId || !newText?.trim()) return;
        try {
            const { data } = await axios.put(`/api/messages/${messageId}`, { text: newText.trim() });
            if (data.success) {
                setMessages(prev => prev.map(m =>
                    m._id === messageId
                        ? { ...m, text: newText.trim(), edited: true, editedAt: new Date() }
                        : m
                ));
                setEditingMessage(null);
                toast.success("Message edited");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(formatError(error));
        }
    }, [axios]);

    // Delete a message
    const deleteMessage = useCallback(async (messageId) => {
        if (!messageId) return;
        try {
            const { data } = await axios.delete(`/api/messages/${messageId}`);
            if (data.success) {
                setMessages(prev => prev.map(m =>
                    m._id === messageId
                        ? { ...m, deleted: true, text: "", image: "", file: null }
                        : m
                ));
                toast.success("Message deleted");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(formatError(error));
        }
    }, [axios]);

    // Open thread for a message
    const openThread = useCallback(async (messageId) => {
        if (!messageId) return;
        try {
            setActiveThread(messageId);
            const { data } = await axios.get(`/api/messages/${messageId}/thread`);
            if (data.success) {
                setThreadMessages(data.messages);
            }
        } catch (error) {
            toast.error(formatError(error));
        }
    }, [axios]);

    // Send reply in thread
    const sendThreadReply = useCallback(async (messageId, text) => {
        if (!messageId || !text?.trim()) return;
        try {
            const { data } = await axios.post(`/api/messages/${messageId}/thread`, { text: text.trim() });
            if (data.success) {
                setThreadMessages(prev => [...prev, data.message]);
                setMessages(prev => prev.map(m =>
                    m._id === messageId
                        ? { ...m, threadCount: (m.threadCount || 0) + 1 }
                        : m
                ));
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(formatError(error));
        }
    }, [axios]);

    // Close thread panel
    const closeThread = useCallback(() => {
        setActiveThread(null);
        setThreadMessages([]);
    }, []);

    // Send typing indicator
    const sendTyping = useCallback((isTyping) => {
        if (!socket || !selectedUserRef.current) return;
        if (isTyping) {
            socket.emit("typing", { receiverId: selectedUserRef.current._id });
        } else {
            socket.emit("stopTyping", { receiverId: selectedUserRef.current._id });
        }
    }, [socket]);

    // Toggle pin on message
    const togglePin = useCallback(async (messageId) => {
        if (!messageId) {
            toast.error("Invalid message");
            return;
        }

        try {
            const { data } = await axios.put(`/api/messages/${messageId}/pin`);
            if (data.success) {
                setMessages(prev => prev.map(m =>
                    m._id === messageId ? { ...m, pinned: data.pinned } : m
                ));

                if (data.pinned) {
                    setPinnedMessages(prev => {
                        if (prev.some(m => m._id === messageId)) return prev;
                        const msg = messagesRef.current.find(m => m._id === messageId);
                        return msg ? [...prev, { ...msg, pinned: true }] : prev;
                    });
                    toast.success("Message pinned");
                } else {
                    setPinnedMessages(prev => prev.filter(m => m._id !== messageId));
                    toast.success("Message unpinned");
                }
            } else {
                toast.error(data.message || "Failed to pin message");
            }
        } catch (error) {
            toast.error(formatError(error));
        }
    }, [axios]);

    // Forward a message
    const forwardMessage = useCallback(async (messageId, target) => {
        if (!messageId || !target) return;
        try {
            const { data } = await axios.post(`/api/messages/${messageId}/forward`, target);
            if (data.success) {
                toast.success("Message forwarded");
                return true;
            }
            toast.error(data.message);
            return false;
        } catch (error) {
            toast.error(formatError(error));
            return false;
        }
    }, [axios]);

    // Toggle bookmark on message
    const bookmarkMessage = useCallback(async (messageId) => {
        if (!messageId) return;
        try {
            const { data } = await axios.post(`/api/messages/${messageId}/bookmark`);
            if (data.success) {
                toast.success(data.bookmarked ? "Message bookmarked" : "Bookmark removed");
                return data.bookmarked;
            }
        } catch (error) {
            toast.error(formatError(error));
        }
        return null;
    }, [axios]);

    // Subscribe to socket events
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (newMessage) => {
            const currentSelected = selectedUserRef.current;
            const senderId = typeof newMessage.senderId === "object"
                ? newMessage.senderId._id
                : newMessage.senderId;

            if (currentSelected && senderId === currentSelected._id) {
                newMessage.seen = true;
                setMessages(prev => [...prev, newMessage]);
                // Mark as seen
                axios.put(`/api/messages/mark/${newMessage._id}`).catch(() => {});
            } else {
                setUnseenMessages(prev => ({
                    ...prev,
                    [senderId]: (prev[senderId] || 0) + 1,
                }));
            }
        };

        const handleTyping = ({ userId }) => {
            setTypingUsers(prev => ({ ...prev, [userId]: true }));
        };

        const handleStopTyping = ({ userId }) => {
            setTypingUsers(prev => {
                const next = { ...prev };
                delete next[userId];
                return next;
            });
        };

        const handleReactions = ({ messageId, reactions }) => {
            setMessages(prev => prev.map(m =>
                m._id === messageId ? { ...m, reactions } : m
            ));
        };

        const handleEdited = ({ messageId, text, edited, editedAt }) => {
            setMessages(prev => prev.map(m =>
                m._id === messageId ? { ...m, text, edited, editedAt } : m
            ));
        };

        const handleDeleted = ({ messageId }) => {
            setMessages(prev => prev.map(m =>
                m._id === messageId
                    ? { ...m, deleted: true, text: "", image: "", file: null }
                    : m
            ));
        };

        const handlePinned = ({ messageId, pinned }) => {
            setMessages(prev => prev.map(m =>
                m._id === messageId ? { ...m, pinned } : m
            ));
            setPinnedMessages(prev => {
                if (pinned) {
                    if (prev.some(m => m._id === messageId)) return prev;
                    const msg = messagesRef.current.find(m => m._id === messageId);
                    return msg ? [...prev, { ...msg, pinned: true }] : prev;
                }
                return prev.filter(m => m._id !== messageId);
            });
        };

        const handleMessagesSeen = ({ by }) => {
            setMessages(prev => prev.map(m => {
                const senderId = typeof m.senderId === "object" ? m.senderId._id : m.senderId;
                if (senderId === by) {
                    return { ...m, seen: true, seenAt: new Date() };
                }
                return m;
            }));
        };

        // Subscribe to events
        socket.on("newMessage", handleNewMessage);
        socket.on("userTyping", handleTyping);
        socket.on("userStopTyping", handleStopTyping);
        socket.on("messageReactions", handleReactions);
        socket.on("messageReactionUpdated", handleReactions);
        socket.on("messageUpdated", handleEdited);
        socket.on("messageEdited", handleEdited);
        socket.on("messageDeleted", handleDeleted);
        socket.on("messagePinned", handlePinned);
        socket.on("messagesSeen", handleMessagesSeen);

        // Cleanup
        return () => {
            socket.off("newMessage", handleNewMessage);
            socket.off("userTyping", handleTyping);
            socket.off("userStopTyping", handleStopTyping);
            socket.off("messageReactions", handleReactions);
            socket.off("messageReactionUpdated", handleReactions);
            socket.off("messageUpdated", handleEdited);
            socket.off("messageEdited", handleEdited);
            socket.off("messageDeleted", handleDeleted);
            socket.off("messagePinned", handlePinned);
            socket.off("messagesSeen", handleMessagesSeen);
        };
    }, [socket, axios]);

    const value = {
        messages,
        users,
        selectedUser,
        setSelectedUser,
        unseenMessages,
        setUnseenMessages,
        typingUsers,
        isLoadingMessages,
        getUsers,
        getMessages,
        sendMessage,
        toggleReaction,
        editMessage,
        deleteMessage,
        openThread,
        sendThreadReply,
        closeThread,
        threadMessages,
        activeThread,
        sendTyping,
        togglePin,
        pinnedMessages,
        editingMessage,
        setEditingMessage,
        forwardMessage,
        bookmarkMessage,
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};

export default ChatProvider;