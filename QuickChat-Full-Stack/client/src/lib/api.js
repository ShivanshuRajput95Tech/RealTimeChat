import axios from 'axios';

export const backendUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || '';

if (!backendUrl) {
  console.warn('VITE_BACKEND_URL or VITE_API_URL must be set in client .env');
}

export const apiClient = axios.create({
  baseURL: backendUrl,
});

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
