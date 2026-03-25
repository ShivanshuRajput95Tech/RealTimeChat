import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";
import { formatError } from "../lib/utils";

export const WorkspaceContext = createContext();

export const WorkspaceProvider = ({ children }) => {
    const { axios, socket } = useContext(AuthContext);

    const [workspaces, setWorkspaces] = useState([]);
    const [channelsByWorkspace, setChannelsByWorkspace] = useState({});
    const [selectedWorkspace, setSelectedWorkspace] = useState(null);
    const [selectedChannel, setSelectedChannel] = useState(null);
    const [channelMessages, setChannelMessages] = useState([]);
    const [channelMembers, setChannelMembers] = useState([]);

    const selectedChannelRef = useRef(selectedChannel);
    useEffect(() => { selectedChannelRef.current = selectedChannel; }, [selectedChannel]);

    const getWorkspaces = useCallback(async () => {
        try {
            const { data } = await axios.get("/api/workspaces");
            if (data.success) {
                setWorkspaces(data.workspaces);
                setChannelsByWorkspace(data.channelsByWorkspace);
            }
        } catch {
            // Silent fail for workspaces
        }
    }, [axios]);

    const createWorkspace = useCallback(async (name, description) => {
        try {
            const { data } = await axios.post("/api/workspaces", { name, description });
            if (data.success) {
                setWorkspaces(prev => [...prev, data.workspace]);
                setChannelsByWorkspace(prev => ({
                    ...prev,
                    [data.workspace._id]: data.channels,
                }));
                toast.success("Workspace created");
                return data.workspace;
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(formatError(error));
        }
    }, [axios]);

    const joinWorkspace = useCallback(async (inviteCode) => {
        try {
            const { data } = await axios.post("/api/workspaces/join", { inviteCode });
            if (data.success) {
                setWorkspaces(prev => [...prev, data.workspace]);
                const chRes = await axios.get(`/api/channels/${data.workspace._id}`);
                if (chRes.data.success) {
                    setChannelsByWorkspace(prev => ({
                        ...prev,
                        [data.workspace._id]: chRes.data.channels,
                    }));
                }
                toast.success("Joined workspace");
                return data.workspace;
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(formatError(error));
        }
    }, [axios]);

    const leaveWorkspace = useCallback(async (workspaceId) => {
        try {
            const { data } = await axios.post(`/api/workspaces/${workspaceId}/leave`);
            if (data.success) {
                setWorkspaces(prev => prev.filter(w => w._id !== workspaceId));
                setChannelsByWorkspace(prev => {
                    const next = { ...prev };
                    delete next[workspaceId];
                    return next;
                });
                setSelectedWorkspace(prev => prev?._id === workspaceId ? null : prev);
                setSelectedChannel(prev => {
                    if (prev) {
                        const parentWs = Object.entries(channelsByWorkspace).find(([wsId, channels]) =>
                            channels.some(ch => ch._id === prev._id)
                        );
                        if (parentWs && parentWs[0] === workspaceId) return null;
                    }
                    return prev;
                });
                toast.success("Left workspace");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(formatError(error));
        }
    }, [axios, channelsByWorkspace]);

    const deleteWorkspace = useCallback(async (workspaceId) => {
        try {
            const { data } = await axios.delete(`/api/workspaces/${workspaceId}`);
            if (data.success) {
                setWorkspaces(prev => prev.filter(w => w._id !== workspaceId));
                setChannelsByWorkspace(prev => {
                    const next = { ...prev };
                    delete next[workspaceId];
                    return next;
                });
                setSelectedWorkspace(null);
                setSelectedChannel(null);
                toast.success("Workspace deleted");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(formatError(error));
        }
    }, [axios]);

    const createChannel = useCallback(async (workspaceId, name, topic, type) => {
        try {
            const { data } = await axios.post(`/api/channels/${workspaceId}`, { name, topic, type });
            if (data.success) {
                setChannelsByWorkspace(prev => ({
                    ...prev,
                    [workspaceId]: [...(prev[workspaceId] || []), data.channel],
                }));
                toast.success("Channel created");
                return data.channel;
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(formatError(error));
        }
    }, [axios]);

    const selectChannel = useCallback(async (channel, workspaceId) => {
        try {
            setSelectedChannel(channel);
            const { data } = await axios.get(`/api/channels/${channel._id}/messages`);
            if (data.success) {
                setChannelMessages(data.messages);
            }
        } catch (error) {
            toast.error(formatError(error));
        }
    }, [axios]);

    const sendChannelMessage = useCallback(async (text, image) => {
        if (!selectedChannelRef.current) return;
        try {
            const body = {};
            if (text) body.text = text;
            if (image) body.image = image;
            const { data } = await axios.post(`/api/channels/${selectedChannelRef.current._id}/messages`, body);
            if (data.success) {
                setChannelMessages(prev => [...prev, data.message]);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(formatError(error));
        }
    }, [axios]);

    const pinChannelMessage = useCallback(async (channelId, messageId) => {
        try {
            const { data } = await axios.put(`/api/channels/${channelId}/pin/${messageId}`);
            if (data.success) {
                setChannelMessages(prev => prev.map(m =>
                    m._id === messageId ? { ...m, pinned: !m.pinned } : m
                ));
            }
        } catch (error) {
            toast.error(formatError(error));
        }
    }, [axios]);

    const getWorkspaceMembers = useCallback(async (workspaceId) => {
        try {
            const { data } = await axios.get(`/api/workspaces/${workspaceId}`);
            if (data.success) {
                setChannelMembers(data.workspace.members);
                return data.workspace.members;
            }
        } catch (error) {
            toast.error(formatError(error));
        }
    }, [axios]);

    const updateMemberRole = useCallback(async (workspaceId, userId, role) => {
        try {
            const { data } = await axios.put(`/api/workspaces/${workspaceId}/members/${userId}/role`, { role });
            if (data.success) {
                toast.success("Role updated");
                await getWorkspaceMembers(workspaceId);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(formatError(error));
        }
    }, [axios, getWorkspaceMembers]);

    const removeWorkspaceMember = useCallback(async (workspaceId, userId) => {
        try {
            const { data } = await axios.delete(`/api/workspaces/${workspaceId}/members/${userId}`);
            if (data.success) {
                toast.success("Member removed");
                await getWorkspaceMembers(workspaceId);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(formatError(error));
        }
    }, [axios, getWorkspaceMembers]);

    const regenerateInvite = useCallback(async (workspaceId) => {
        try {
            const { data } = await axios.post(`/api/workspaces/${workspaceId}/regenerate-invite`);
            if (data.success) {
                toast.success("New invite code generated");
                return data.inviteCode;
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(formatError(error));
        }
    }, [axios]);

    // Socket subscriptions
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = ({ channelId, message }) => {
            if (selectedChannelRef.current?._id === channelId) {
                setChannelMessages(prev => {
                    if (prev.some(m => m._id === message._id)) return prev;
                    return [...prev, message];
                });
            }
        };

        const handleChannelCreated = ({ workspaceId, channel }) => {
            setChannelsByWorkspace(prev => ({
                ...prev,
                [workspaceId]: [...(prev[workspaceId] || []), channel],
            }));
            toast.success(`New channel: #${channel.name}`);
        };

        const handleMemberJoined = ({ workspaceId, user }) => {
            toast.success(`${user.fullName} joined the workspace`);
        };

        socket.on("channel:newMessage", handleNewMessage);
        socket.on("channel:created", handleChannelCreated);
        socket.on("workspace:memberJoined", handleMemberJoined);

        return () => {
            socket.off("channel:newMessage", handleNewMessage);
            socket.off("channel:created", handleChannelCreated);
            socket.off("workspace:memberJoined", handleMemberJoined);
        };
    }, [socket]);

    // Join channel rooms when workspace changes
    useEffect(() => {
        if (selectedWorkspace && socket) {
            const channels = channelsByWorkspace[selectedWorkspace._id] || [];
            channels.forEach(ch => {
                socket.emit("joinChannel", ch._id);
            });
        }
    }, [selectedWorkspace, channelsByWorkspace, socket]);

    const value = {
        workspaces, channelsByWorkspace,
        selectedWorkspace, setSelectedWorkspace,
        selectedChannel, setSelectedChannel,
        channelMessages, channelMembers,
        getWorkspaces, createWorkspace, joinWorkspace, leaveWorkspace, deleteWorkspace,
        createChannel, selectChannel, sendChannelMessage, pinChannelMessage,
        getWorkspaceMembers, updateMemberRole, removeWorkspaceMember,
        regenerateInvite,
    };

    return (
        <WorkspaceContext.Provider value={value}>
            {children}
        </WorkspaceContext.Provider>
    );
};
