import axios from 'axios';

export const backendUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || '';

if (!backendUrl) {
  console.warn('VITE_BACKEND_URL or VITE_API_URL must be set in client .env');
}

export const apiClient = axios.create({
  baseURL: backendUrl,
});

export const apiPaths = {
  auth: {
    login: '/api/auth/login',
    signup: '/api/auth/signup',
    check: '/api/auth/check',
    updateProfile: '/api/auth/update-profile',
    search: '/api/auth/search',
  },
  messages: {
    users: '/api/messages/users',
    byUser: (userId) => `/api/messages/${userId}`,
    send: (userId) => `/api/messages/send/${userId}`,
    markRead: (messageId) => `/api/messages/${messageId}/mark-read`,
  },
  ai: {
    summarize: '/api/ai/summarize',
    sentiment: '/api/ai/sentiment',
    suggest: '/api/ai/suggest',
    translate: '/api/ai/translate',
    detectLanguage: '/api/ai/detect-language',
    filter: '/api/ai/filter',
  },
  status: '/api/status',
};

export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete apiClient.defaults.headers.common.Authorization;
};

export const extractErrorMessage = (error, fallbackMessage) => {
  return error.response?.data?.message || error.message || fallbackMessage;
};
