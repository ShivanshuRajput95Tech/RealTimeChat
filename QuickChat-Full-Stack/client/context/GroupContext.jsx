import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

const formatError = (error) => {
    if (!error.response) {
        return "Cannot connect to server. Please check your connection and try again.";
    }
    return error.response.data?.message || "Something went wrong. Please try again.";
};

export const GroupContext = createContext();

export const GroupProvider = ({ children }) => {
    const { axios, socket } = useContext(AuthContext);

    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groupMessages, setGroupMessages] = useState([]);

    const selectedGroupRef = useRef(selectedGroup);
    useEffect(() => { selectedGroupRef.current = selectedGroup; }, [selectedGroup]);

    const getGroups = useCallback(async () => {
        try {
            const { data } = await axios.get("/api/groups");
            if (data.success) {
                setGroups(data.groups);
            }
        } catch {
            // Silent fail for groups
        }
    }, [axios]);

    const createGroup = useCallback(async (name, description, members) => {
        try {
            const { data } = await axios.post("/api/groups", { name, description, members });
            if (data.success) {
                setGroups(prev => [data.group, ...prev]);
                toast.success("Group created");
                return data.group;
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(formatError(error));
        }
    }, [axios]);

    const selectGroup = useCallback(async (group) => {
        try {
            setSelectedGroup(group);
            const { data } = await axios.get(`/api/groups/${group._id}/messages`);
            if (data.success) {
                setGroupMessages(data.messages);
            }
            if (socket) {
                socket.emit("joinGroup", group._id);
            }
        } catch (error) {
            toast.error(formatError(error));
        }
    }, [axios, socket]);

    const sendGroupMessage = useCallback(async (text, image) => {
        if (!selectedGroupRef.current) return;
        try {
            const body = {};
            if (text) body.text = text;
            if (image) body.image = image;
            const { data } = await axios.post(`/api/groups/${selectedGroupRef.current._id}/messages`, body);
            if (data.success) {
                setGroupMessages(prev => [...prev, data.message]);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(formatError(error));
        }
    }, [axios]);

    const updateGroup = useCallback(async (groupId, updates) => {
        try {
            const { data } = await axios.put(`/api/groups/${groupId}`, updates);
            if (data.success) {
                setGroups(prev => prev.map(g => g._id === groupId ? data.group : g));
                if (selectedGroupRef.current?._id === groupId) setSelectedGroup(data.group);
                toast.success("Group updated");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(formatError(error));
        }
    }, [axios]);

    const deleteGroup = useCallback(async (groupId) => {
        try {
            const { data } = await axios.delete(`/api/groups/${groupId}`);
            if (data.success) {
                setGroups(prev => prev.filter(g => g._id !== groupId));
                if (selectedGroupRef.current?._id === groupId) {
                    setSelectedGroup(null);
                    setGroupMessages([]);
                }
                toast.success("Group deleted");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(formatError(error));
        }
    }, [axios]);

    const addGroupMembers = useCallback(async (groupId, members) => {
        try {
            const { data } = await axios.post(`/api/groups/${groupId}/members`, { members });
            if (data.success) {
                setGroups(prev => prev.map(g => g._id === groupId ? data.group : g));
                if (selectedGroupRef.current?._id === groupId) setSelectedGroup(data.group);
                toast.success("Members added");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(formatError(error));
        }
    }, [axios]);

    const removeGroupMember = useCallback(async (groupId, userId) => {
        try {
            const { data } = await axios.delete(`/api/groups/${groupId}/members/${userId}`);
            if (data.success) {
                await getGroups();
                toast.success("Member removed");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(formatError(error));
        }
    }, [axios, getGroups]);

    const leaveGroup = useCallback(async (groupId) => {
        try {
            const { data } = await axios.post(`/api/groups/${groupId}/leave`);
            if (data.success) {
                setGroups(prev => prev.filter(g => g._id !== groupId));
                if (selectedGroupRef.current?._id === groupId) {
                    setSelectedGroup(null);
                    setGroupMessages([]);
                }
                toast.success("Left group");
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

        const handleNewMessage = ({ groupId, message }) => {
            if (selectedGroupRef.current?._id === groupId) {
                setGroupMessages(prev => {
                    if (prev.some(m => m._id === message._id)) return prev;
                    return [...prev, message];
                });
            }
        };

        const handleGroupCreated = ({ group }) => {
            setGroups(prev => {
                if (prev.some(g => g._id === group._id)) return prev;
                return [group, ...prev];
            });
            toast.success(`You were added to group: ${group.name}`);
        };

        const handleGroupAdded = ({ groupId, group }) => {
            setGroups(prev => {
                if (prev.some(g => g._id === groupId)) return prev;
                return [group, ...prev];
            });
            toast.success(`You were added to group: ${group.name}`);
        };

        const handleGroupRemoved = ({ groupId }) => {
            setGroups(prev => prev.filter(g => g._id !== groupId));
            if (selectedGroupRef.current?._id === groupId) {
                setSelectedGroup(null);
                setGroupMessages([]);
            }
        };

        const handleGroupUpdated = ({ groupId, group }) => {
            setGroups(prev => prev.map(g => g._id === groupId ? group : g));
            if (selectedGroupRef.current?._id === groupId) setSelectedGroup(group);
        };

        socket.on("group:newMessage", handleNewMessage);
        socket.on("group:created", handleGroupCreated);
        socket.on("group:added", handleGroupAdded);
        socket.on("group:removed", handleGroupRemoved);
        socket.on("group:updated", handleGroupUpdated);

        return () => {
            socket.off("group:newMessage", handleNewMessage);
            socket.off("group:created", handleGroupCreated);
            socket.off("group:added", handleGroupAdded);
            socket.off("group:removed", handleGroupRemoved);
            socket.off("group:updated", handleGroupUpdated);
        };
    }, [socket]);

    const value = {
        groups, selectedGroup, groupMessages,
        getGroups, createGroup, selectGroup, sendGroupMessage,
        updateGroup, deleteGroup, addGroupMembers, removeGroupMember, leaveGroup,
        setSelectedGroup,
    };

    return (
        <GroupContext.Provider value={value}>
            {children}
        </GroupContext.Provider>
    );
};
