import { createContext, useEffect, useState, useCallback, useRef } from "react";
import axios from 'axios';
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { API_BASE_URL, SOCKET_CONFIG, TOAST_OPTIONS, ERROR_MESSAGES } from "../constants";
import { formatError } from "../lib/utils";

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.timeout = 15000; // 15 second timeout
axios.defaults.timeoutErrorMessage = ERROR_MESSAGES.NETWORK;

// Request interceptor to add auth token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for better error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network error (no response from server)
    if (!error.response) {
      // Check if it's a timeout
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        toast.error('Request timed out. Please check your connection and try again.');
      } else {
        toast.error(ERROR_MESSAGES.NETWORK);
      }
      return Promise.reject(error);
    }

    // Handle specific status codes
    const { status, data } = error.response;
    
    switch (status) {
      case 401:
        // Token expired or invalid - clear auth state
        localStorage.removeItem("token");
        delete axios.defaults.headers.common["Authorization"];
        // Don't show toast here - let the component handle it
        break;
      case 403:
        toast.error(ERROR_MESSAGES.PERMISSION_DENIED);
        break;
      case 429:
        // Rate limited
        const retryAfter = error.response.headers['retry-after'];
        const message = retryAfter 
          ? `Too many requests. Please try again in ${retryAfter} seconds.`
          : data?.message || 'Too many requests. Please try again later.';
        toast.error(message);
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        toast.error('Server error. Please try again later.');
        break;
      default:
        // Use the error message from the server if available
        if (data?.message) {
          toast.error(data.message);
        }
    }
    
    return Promise.reject(error);
  }
);

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem("token"));
    const [authUser, setAuthUser] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [socket, setSocket] = useState(null);
    const [userStatuses, setUserStatuses] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const socketRef = useRef(null);

    // Check authentication status
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
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Login or signup
    const login = useCallback(async (state, credentials) => {
        try {
            const { data } = await axios.post(`/api/auth/${state}`, credentials);
            if (data.success) {
                setAuthUser(data.userData);
                connectSocket(data.userData);
                setToken(data.token);
                localStorage.setItem("token", data.token);
                toast.success(data.message);
                return { success: true };
            }
            toast.error(data.message);
            return { success: false, message: data.message };
        } catch (error) {
            // Error toast is handled by axios interceptor
            // Return the error message for the component to use if needed
            const message = formatError(error);
            return { success: false, message };
        }
    }, []);

    // Logout
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

    // Update profile
    const updateProfile = useCallback(async (body) => {
        try {
            const { data } = await axios.put("/api/auth/update-profile", body);
            if (data.success) {
                setAuthUser(data.user);
                toast.success("Profile updated");
                return { success: true };
            }
            toast.error(data.message);
            return { success: false, message: data.message };
        } catch (error) {
            // Error toast is handled by axios interceptor
            const message = formatError(error);
            return { success: false, message };
        }
    }, []);

    // Change user status
    const changeStatus = useCallback((status, statusText) => {
        if (!socketRef.current) return;
        socketRef.current.emit("statusChange", { status, statusText });
        setAuthUser(prev => prev ? {
            ...prev,
            status,
            statusText: statusText !== undefined ? statusText : prev.statusText
        } : prev);
    }, []);

    // Connect to socket
    const connectSocket = useCallback((userData) => {
        if (!userData?._id) return;

        // Disconnect existing socket
        if (socketRef.current) {
            socketRef.current.removeAllListeners();
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        const storedToken = localStorage.getItem("token");
        if (!storedToken) return;

        const newSocket = io(API_BASE_URL, {
            query: { userId: userData._id },
            auth: { token: storedToken },
            ...SOCKET_CONFIG,
        });

        newSocket.connect();
        socketRef.current = newSocket;
        setSocket(newSocket);

        // Handle online users list
        newSocket.on("getOnlineUsers", (userIds) => {
            setOnlineUsers(userIds);
        });

        // Handle user status changes
        newSocket.on("userStatusChange", ({ userId, status, statusText }) => {
            setUserStatuses(prev => ({
                ...prev,
                [userId]: {
                    status,
                    statusText: statusText || prev[userId]?.statusText || ""
                },
            }));
        });

        // Handle connection errors silently
        newSocket.on("connect_error", () => {
            // Silent fail - will auto-retry
        });

        // Handle reconnection
        newSocket.on("reconnect", () => {
            // Re-sync online users
            newSocket.emit("getOnlineUsers");
        });
    }, []);

    // Initialize auth on mount
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

    // Update axios header when token changes
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }
    }, [token]);

    const value = {
        axios,
        authUser,
        onlineUsers,
        socket,
        isLoading,
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

export default AuthProvider;