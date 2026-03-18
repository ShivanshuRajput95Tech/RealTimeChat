import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ChatContext, useAuth } from '.';
import { extractErrorMessage } from '../src/lib/api';

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});
  const [isTyping, setIsTyping] = useState({});
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);

  const { socket, apiClient, authUser } = useAuth();

  const getUsers = useCallback(async () => {
    setIsUsersLoading(true);
    try {
      const { data } = await apiClient.get('/api/messages/users');
      if (data.success) {
        setUsers(data.users);
        setUnseenMessages(data.unseenMessages);
      }
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to load users'));
    } finally {
      setIsUsersLoading(false);
    }
  }, [apiClient]);

  const getMessages = useCallback(async (userId) => {
    if (!userId) {
      setMessages([]);
      return;
    }

    setIsMessagesLoading(true);
    try {
      const { data } = await apiClient.get(`/api/messages/${userId}`);
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to load messages'));
    } finally {
      setIsMessagesLoading(false);
    }
  }, [apiClient]);

  const sendMessage = useCallback(async (messageData) => {
    if (!selectedUser?._id) {
      throw new Error('Please select a user before sending a message');
    }

    const { data } = await apiClient.post(`/api/messages/send/${selectedUser._id}`, messageData);
    if (!data.success) {
      throw new Error(data.message || 'Failed to send message');
    }

    setMessages((prevMessages) => [...prevMessages, data.newMessage]);
    return data.newMessage;
  }, [apiClient, selectedUser]);

  const markMessageAsSeen = useCallback(async (messageId) => {
    if (!messageId) return;

    try {
      await apiClient.put(`/api/messages/${messageId}/mark-read`);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to mark message as read'));
    }
  }, [apiClient]);

  useEffect(() => {
    if (!authUser) {
      setUsers([]);
      setMessages([]);
      setSelectedUser(null);
      setUnseenMessages({});
      return;
    }

    getUsers();
  }, [authUser, getUsers]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleNewMessage = (newMessage) => {
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        const nextMessage = { ...newMessage, seen: true };
        setMessages((prevMessages) => [...prevMessages, nextMessage]);
        markMessageAsSeen(newMessage._id);
        return;
      }

      setUnseenMessages((prevUnseenMessages) => ({
        ...prevUnseenMessages,
        [newMessage.senderId]: (prevUnseenMessages[newMessage.senderId] || 0) + 1,
      }));
    };

    const handleTyping = ({ userId }) => {
      if (selectedUser && userId === selectedUser._id) {
        setIsTyping((prev) => ({ ...prev, [userId]: true }));
      }
    };

    const handleStopTyping = ({ userId }) => {
      if (selectedUser && userId === selectedUser._id) {
        setIsTyping((prev) => ({ ...prev, [userId]: false }));
      }
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('typing', handleTyping);
    socket.on('stopTyping', handleStopTyping);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('typing', handleTyping);
      socket.off('stopTyping', handleStopTyping);
    };
  }, [markMessageAsSeen, selectedUser, socket]);

  useEffect(() => {
    const totalUnseen = Object.values(unseenMessages).reduce((a, b) => a + (b || 0), 0);
    document.title = totalUnseen > 0 ? `Chatify (${totalUnseen} new)` : 'Chatify';
  }, [unseenMessages]);

  const value = useMemo(() => ({
    messages,
    users,
    selectedUser,
    getUsers,
    getMessages,
    sendMessage,
    setSelectedUser,
    unseenMessages,
    setUnseenMessages,
    isTyping,
    typingTimeout,
    setTypingTimeout,
    isUsersLoading,
    isMessagesLoading,
  }), [
    getMessages,
    getUsers,
    isMessagesLoading,
    isTyping,
    isUsersLoading,
    messages,
    selectedUser,
    sendMessage,
    typingTimeout,
    unseenMessages,
    users,
  ]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
