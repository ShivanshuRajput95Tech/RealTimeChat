import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { AuthContext } from '.';
import { apiClient, apiPaths, backendUrl, extractErrorMessage, setAuthToken } from '../src/lib/api';

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

  const connectSocket = useCallback((userData, authToken) => {
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
  }, []);

  const resetAuthState = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    setAuthToken(null);
    disconnectSocket();
  }, [disconnectSocket]);

  const checkAuth = useCallback(async () => {
    if (!token) {
      setIsCheckingAuth(false);
      return;
    }

    try {
      setAuthToken(token);
      const { data } = await apiClient.get(apiPaths.auth.check);
      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user, token);
      }
    } catch (error) {
      resetAuthState();
      toast.error(extractErrorMessage(error, 'Authentication check failed'));
    } finally {
      setIsCheckingAuth(false);
    }
  }, [connectSocket, resetAuthState, token]);

  const login = useCallback(async (state, credentials) => {
    try {
      const endpoint = state === 'signup' ? apiPaths.auth.signup : apiPaths.auth.login;
      const { data } = await apiClient.post(endpoint, credentials);
      if (!data.success) {
        throw new Error(data.message || 'Authentication failed');
      }

      setAuthUser(data.userData);
      setToken(data.token);
      localStorage.setItem('token', data.token);
      setAuthToken(data.token);
      connectSocket(data.userData, data.token);
      toast.success(data.message);
      return data.userData;
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Authentication failed'));
      throw error;
    }
  }, [connectSocket]);

  const logout = useCallback(() => {
    resetAuthState();
    toast.success('Logged out successfully');
  }, [resetAuthState]);

  const updateProfile = useCallback(async (body) => {
    try {
      const { data } = await apiClient.put(apiPaths.auth.updateProfile, body);
      if (!data.success) {
        throw new Error(data.message || 'Profile update failed');
      }

      setAuthUser(data.user);
      toast.success('Profile updated successfully');
      return data.user;
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Profile update failed'));
      throw error;
    }
  }, []);

  useEffect(() => {
    if (token) {
      setAuthToken(token);
    }
    checkAuth();
  }, [checkAuth, token]);

  useEffect(() => () => disconnectSocket(), [disconnectSocket]);

  const value = useMemo(() => ({
    apiClient,
    authUser,
    onlineUsers,
    socket,
    token,
    isCheckingAuth,
    login,
    logout,
    updateProfile,
  }), [authUser, isCheckingAuth, login, logout, onlineUsers, socket, token, updateProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
