/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "./AuthContext";

export const ChatContext = createContext();

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {

  const { axios, socket } = useContext(AuthContext);

  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});


  // LOAD USERS FOR SIDEBAR
  const getUsers = async () => {

    try {

      const { data } = await axios.get("/api/message/users");

      if (data.success) {

        setUsers(data.users);
        setUnseenMessages(data.unseenMessages);

      }

    } catch {
<<<<<<< HEAD
=======

>>>>>>> d0590308b28233ab2211eb13903613211721ba1c
      toast.error("Failed to load users");

    }

  };


  // LOAD CHAT MESSAGES
  const getMessages = async (userId) => {

    try {

      const { data } = await axios.get(`/api/message/${userId}`);

      if (data.success) {

        setMessages(data.messages);

        // reset unseen count
        setUnseenMessages(prev => ({
          ...prev,
          [userId]: 0
        }));

      }

    } catch {
<<<<<<< HEAD
=======

>>>>>>> d0590308b28233ab2211eb13903613211721ba1c
      toast.error("Failed to load messages");

    }

  };


  // SEND MESSAGE
  const sendMessage = async (messageData) => {

    try {

      const { data } = await axios.post(
        `/api/message/${selectedUser._id}`,
        messageData
      );

      if (data.success) {

        setMessages(prev => [...prev, data.message]);

      }

    } catch {
<<<<<<< HEAD
=======

>>>>>>> d0590308b28233ab2211eb13903613211721ba1c
      toast.error("Failed to send message");

    }

  };


  // SUBSCRIBE TO SOCKET MESSAGES
  const subscribeToMessages = useCallback(() => {

    if (!socket) return;

    socket.off("newMessage");

    socket.on("newMessage", async (newMessage) => {

      if (selectedUser && newMessage.senderId === selectedUser._id) {

        newMessage.seen = true;

        setMessages(prev => [...prev, newMessage]);

        await axios.put(`/api/message/mark/${newMessage._id}`);

      } else {

        setUnseenMessages(prev => ({
          ...prev,
          [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1
        }));

      }

    });

  }, [socket, selectedUser, axios]);


<<<<<<< HEAD
  // UNSUBSCRIBE
  const unsubscribeFromMessages = useCallback(() => {
    socket?.off("newMessage");
  }, [socket]);


=======
>>>>>>> d0590308b28233ab2211eb13903613211721ba1c
  useEffect(() => {

    subscribeToMessages();

    return () => socket?.off("newMessage");

  }, [socket, selectedUser, subscribeToMessages, unsubscribeFromMessages]);


  const value = {
    messages,
    users,
    selectedUser,
    unseenMessages,
    setUnseenMessages,
    setSelectedUser,
    getUsers,
    getMessages,
    sendMessage
  };


  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );

};