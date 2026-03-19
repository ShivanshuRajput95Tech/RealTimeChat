import { createContext, useContext } from 'react';

export const AuthContext = createContext(null);
export const ChatContext = createContext(null);
export const ThemeContext = createContext(null);

const createSafeHook = (Context, hookName, providerName) => () => {
  const context = useContext(Context);
  if (!context) {
    throw new Error(`${hookName} must be used within a ${providerName}`);
  }
  return context;
};

export const useAuth = createSafeHook(AuthContext, 'useAuth', 'AuthProvider');
export const useChat = createSafeHook(ChatContext, 'useChat', 'ChatProvider');
export const useTheme = createSafeHook(ThemeContext, 'useTheme', 'ThemeProvider');
