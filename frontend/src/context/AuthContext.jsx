/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = (import.meta.env.VITE_BACKEND_URL || "").trim();

// If backend URL is unset, axios will use the current origin (useful when dev server proxies /api requests)
axios.defaults.baseURL = backendUrl || "";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isLoading, setIsLoading] = useState(false);


  // CONNECT SOCKET
  const connectSocket = (userData) => {

    if (!userData || socket?.connected) return;

<<<<<<< HEAD
    const newSocket = io(backendUrl || undefined, {
      query: {
        userId: userData._id
      }
    });
=======
    const newSocket = io(backendUrl);
>>>>>>> d0590308b28233ab2211eb13903613211721ba1c

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
<<<<<<< HEAD
    if (isLoading) return { success: false, message: "Busy" }; // Prevent multiple requests
=======

    try {
>>>>>>> d0590308b28233ab2211eb13903613211721ba1c

    setIsLoading(true);

    try {
      // Filter credentials based on state
      const dataToSend = state === "login"
        ? { email: credentials.email, password: credentials.password }
        : credentials;

      const { data } = await axios.post(`/api/auth/${state}`, dataToSend);

      if (data.success) {
        setAuthUser(data.userData);
<<<<<<< HEAD
        connectSocket(data.userData);
        const authHeader = `Bearer ${data.token}`;
        axios.defaults.headers.common["Authorization"] = authHeader;
=======

>>>>>>> d0590308b28233ab2211eb13903613211721ba1c
        setToken(data.token);
        localStorage.setItem("token", data.token);
<<<<<<< HEAD
=======

        axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;

        connectSocket(data.userData);

>>>>>>> d0590308b28233ab2211eb13903613211721ba1c
        toast.success(data.message);
        return { success: true, message: data.message };
      }

      toast.error(data.message);
      return { success: false, message: data.message };

    } catch (error) {
      console.error("Login error:", error);

      const errorMessage = error.response?.data?.message
        || (error.code === "ERR_NETWORK" ? "Unable to reach backend server. Is the API running?" : error.message)
        || "Network error. Please check your connection.";

      const formatted = `Login failed: ${errorMessage}`;
      toast.error(formatted);
      return { success: false, message: formatted };

    } finally {
      setIsLoading(false);
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
<<<<<<< HEAD
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
=======

      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

>>>>>>> d0590308b28233ab2211eb13903613211721ba1c
      checkAuth();

    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const value = {
    axios,
    token,
    authUser,
    onlineUsers,
    socket,
    login,
    logout,
    updateProfile,
    isLoading
  };


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );

};