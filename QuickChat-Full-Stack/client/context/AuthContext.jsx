import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

const backendUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL;
if (!backendUrl) {
  console.warn('VITE_BACKEND_URL or VITE_API_URL must be set in client .env');
}

axios.defaults.baseURL = backendUrl;

const getErrorMessage = (error, fallbackMessage) => {
  return error.response?.data?.message || error.message || fallbackMessage;
};

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const disconnectSocket = useCallback(() => {
    setSocket((currentSocket) => {
      if (currentSocket) {
        currentSocket.removeAllListeners();
        currentSocket.disconnect();
      }
      return null;
    });
  }, []);

  const connectSocket = useCallback(
    (userData, authToken) => {
      const resolvedToken = authToken || localStorage.getItem('token');
      if (!userData || !resolvedToken || !backendUrl) {
        return;
      }

      setSocket((currentSocket) => {
        if (currentSocket?.connected && currentSocket.auth?.token === `Bearer ${resolvedToken}`) {
          return currentSocket;
        }

        if (currentSocket) {
          currentSocket.removeAllListeners();
          currentSocket.disconnect();
        }

        const nextSocket = io(backendUrl, {
          auth: {
            token: `Bearer ${resolvedToken}`,
          },
        });

        nextSocket.on('getOnlineUsers', (userIds) => {
          setOnlineUsers(userIds);
        });

        nextSocket.on('connect_error', (error) => {
          toast.error(`Socket error: ${error.message}`);
        });

        return nextSocket;
      });
    },
    [],
  );

  const checkAuth = useCallback(async () => {
    if (!token) {
      setIsCheckingAuth(false);
      return;
    }

    try {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      const { data } = await axios.get('/api/auth/check');
      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user, token);
      }
    } catch (error) {
      localStorage.removeItem('token');
      setToken(null);
      setAuthUser(null);
      delete axios.defaults.headers.common.Authorization;
      toast.error(getErrorMessage(error, 'Authentication check failed'));
    } finally {
      setIsCheckingAuth(false);
    }
  }, [connectSocket, token]);

  const login = useCallback(
    async (state, credentials) => {
      try {
        const { data } = await axios.post(`/api/auth/${state}`, credentials);
        if (!data.success) {
          throw new Error(data.message || 'Authentication failed');
        }

        setAuthUser(data.userData);
        setToken(data.token);
        localStorage.setItem('token', data.token);
        axios.defaults.headers.common.Authorization = `Bearer ${data.token}`;
        connectSocket(data.userData, data.token);
        toast.success(data.message);
        return data.userData;
      } catch (error) {
        const message = getErrorMessage(error, 'Authentication failed');
        toast.error(message);
        throw error;
      }
    },
    [connectSocket],
  );

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    delete axios.defaults.headers.common.Authorization;
    disconnectSocket();
    toast.success('Logged out successfully');
  }, [disconnectSocket]);

  const updateProfile = useCallback(async (body) => {
    try {
      const { data } = await axios.put('/api/auth/update-profile', body);
      if (!data.success) {
        throw new Error(data.message || 'Profile update failed');
      }

      setAuthUser(data.user);
      toast.success('Profile updated successfully');
      return data.user;
    } catch (error) {
      const message = getErrorMessage(error, 'Profile update failed');
      toast.error(message);
      throw error;
    }
  }, []);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    }
    checkAuth();
  }, [checkAuth, token]);

  useEffect(() => {
    return () => disconnectSocket();
  }, [disconnectSocket]);

  const value = useMemo(
    () => ({
      axios,
      authUser,
      onlineUsers,
      socket,
      token,
      isCheckingAuth,
      login,
      logout,
      updateProfile,
    }),
    [authUser, isCheckingAuth, login, logout, onlineUsers, socket, token, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
