import axios, { AxiosError } from 'axios';
import { getToken, removeToken } from './storage';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      // Clear invalid token
      removeToken();

      // Only redirect if we're on the client side and not already on auth pages
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        if (!currentPath.startsWith('/auth')) {
          window.location.href = '/auth/login';
        }
      }
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }

    // Handle other errors
    const message =
      (error.response.data as any)?.message ||
      (error.response.data as any)?.error ||
      error.message ||
      'An unexpected error occurred';

    console.error('API error:', {
      url: error.config?.url,
      status: error.response?.status,
      message,
    });

    return Promise.reject(new Error(message));
  }
);

export default apiClient;

// SWR fetcher function
export const fetcher = (url: string) => apiClient.get(url).then(res => res.data);
