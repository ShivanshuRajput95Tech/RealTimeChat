import { createContext, useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);


  // CONNECT SOCKET
  const connectSocket = (userData) => {

    if (!userData || socket?.connected) return;

    const newSocket = io(backendUrl);

    newSocket.connect();

    // register user on server
    newSocket.emit("add-user", userData._id);

    setSocket(newSocket);

    newSocket.on("getOnlineUsers", (userIds) => {
      setOnlineUsers(userIds);
    });

  };


  // CHECK AUTH
  const checkAuth = async () => {

    try {

      const { data } = await axios.get("/api/auth/check");

      if (data.success) {

        setAuthUser(data.userData);

        connectSocket(data.userData);

      }

    } catch (error) {

      console.log(error.message);

    }

  };


  // LOGIN / SIGNUP
  const login = async (state, credentials) => {

    try {

      const { data } = await axios.post(`/api/auth/${state}`, credentials);

      if (data.success) {

        setAuthUser(data.userData);

        setToken(data.token);

        localStorage.setItem("token", data.token);

        axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;

        connectSocket(data.userData);

        toast.success(data.message);

      } else {

        toast.error(data.message);

      }

    } catch (error) {

      toast.error(
        error.response?.data?.message || "Something went wrong"
      );

    }

  };


  // LOGOUT
  const logout = () => {

    localStorage.removeItem("token");

    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);

    socket?.disconnect();

    delete axios.defaults.headers.common["Authorization"];

    toast.success("Logged out successfully");

  };


  // UPDATE PROFILE
  const updateProfile = async (body) => {

    try {

      const { data } = await axios.put("/api/auth/update-profile", body);

      if (data.success) {

        setAuthUser(data.userData);

        toast.success("Profile updated");

      } else {

        toast.error(data.message);

      }

    } catch (error) {

      toast.error(error.message);

    }

  };


  // INITIAL AUTH CHECK
  useEffect(() => {

    if (token) {

      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      checkAuth();

    }

  }, []);


  const value = {
    axios,
    token,
    authUser,
    onlineUsers,
    socket,
    login,
    logout,
    updateProfile
  };


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );

};