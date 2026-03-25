import { createContext, useEffect, useState, useCallback, useRef } from "react";
import axios from 'axios';
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
    const [userStatuses, setUserStatuses] = useState({});
    const socketRef = useRef(null);

    const checkAuth = useCallback(async () => {
        try {
            const { data } = await axios.get("/api/auth/check");
            if (data.success) {
                setAuthUser(data.user);
                connectSocket(data.user);
            }
        } catch (error) {
            if (error.response?.status === 401) {
                localStorage.removeItem("token");
                setToken(null);
                setAuthUser(null);
            }
        }
    }, []);

    const login = useCallback(async (state, credentials) => {
        try {
            const { data } = await axios.post(`/api/auth/${state}`, credentials);
            if (data.success) {
                setAuthUser(data.userData);
                connectSocket(data.userData);
                setToken(data.token);
                localStorage.setItem("token", data.token);
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            if (!error.response) {
                toast.error("Cannot connect to server. Please check your connection and try again.");
            } else {
                toast.error(error.response.data?.message || "Something went wrong. Please try again.");
            }
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem("token");
        setToken(null);
        setAuthUser(null);
        setOnlineUsers([]);
        setUserStatuses({});
        delete axios.defaults.headers.common["Authorization"];
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        toast.success("Logged out successfully");
    }, []);

    const updateProfile = useCallback(async (body) => {
        try {
            const { data } = await axios.put("/api/auth/update-profile", body);
            if (data.success) {
                setAuthUser(data.user);
                return { success: true };
            }
            return { success: false, message: data.message };
        } catch (error) {
            const message = error.response?.data?.message || "Failed to update profile";
            return { success: false, message };
        }
    }, []);

    const changeStatus = useCallback((status, statusText) => {
        if (!socketRef.current) return;
        socketRef.current.emit("statusChange", { status, statusText });
        setAuthUser(prev => prev ? { ...prev, status, statusText: statusText !== undefined ? statusText : prev.statusText } : prev);
    }, []);

    const connectSocket = useCallback((userData) => {
        if (!userData) return;

        if (socketRef.current) {
            socketRef.current.removeAllListeners();
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        const token = localStorage.getItem("token");

        const newSocket = io(backendUrl, {
            query: { userId: userData._id },
            auth: { token },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            transports: ['websocket', 'polling'],
        });

        newSocket.connect();
        socketRef.current = newSocket;
        setSocket(newSocket);

        newSocket.on("getOnlineUsers", (userIds) => {
            setOnlineUsers(userIds);
        });

        newSocket.on("userStatusChange", ({ userId, status, statusText }) => {
            setUserStatuses(prev => ({
                ...prev,
                [userId]: { status, statusText: statusText || prev[userId]?.statusText || "" },
            }));
        });

        newSocket.on("connect_error", () => {});
    }, []);

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }
        checkAuth();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [token, checkAuth]);

    const value = {
        axios,
        authUser,
        onlineUsers,
        socket,
        login,
        logout,
        updateProfile,
        changeStatus,
        userStatuses,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
