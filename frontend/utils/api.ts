import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { getToken, removeToken } from './storage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const REQUEST_TIMEOUT = 15000; // 15 seconds
const MAX_RETRY_ATTEMPTS = 2;
const RETRY_DELAY = 1000; // 1 second

// Create axios instance with configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: REQUEST_TIMEOUT,
});

// Request interceptor to add JWT token
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

// Response interceptor with comprehensive error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

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

      const message = 'Your session has expired. Please log in again.';
      return Promise.reject(new Error(message));
    }

    // Handle 403 Forbidden errors
    if (error.response?.status === 403) {
      const message = 'You do not have permission to access this resource.';
      console.error('Permission denied:', {
        url: originalRequest?.url,
        status: error.response?.status,
      });
      return Promise.reject(new Error(message));
    }

    // Handle rate limiting (429 Too Many Requests)
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || '60';
      const message = `Too many requests. Please wait ${retryAfter} seconds before trying again.`;
      console.warn('Rate limited:', {
        url: originalRequest?.url,
        retryAfter,
      });
      return Promise.reject(new Error(message));
    }

    // Handle network errors
    if (!error.response) {
      const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout');
      
      if (isTimeout) {
        console.error('Request timeout:', {
          url: originalRequest?.url,
          timeout: REQUEST_TIMEOUT,
        });
        return Promise.reject(new Error(`Request timed out after ${REQUEST_TIMEOUT / 1000} seconds. Please try again.`));
      }

      console.error('Network error:', error.message);
      return Promise.reject(new Error('Network error. Please check your connection and try again.'));
    }

    // Handle 4xx client errors
    if (error.response && error.response.status >= 400 && error.response.status < 500) {
      const message =
        (error.response.data as any)?.message ||
        (error.response.data as any)?.error ||
        'An error occurred while processing your request.';

      console.error('Client error:', {
        url: originalRequest?.url,
        status: error.response?.status,
        message,
      });

      return Promise.reject(new Error(message));
    }

    // Handle 5xx server errors
    if (error.response && error.response.status >= 500) {
      const message =
        (error.response.data as any)?.message ||
        'A server error occurred. Please try again later.';

      console.error('Server error:', {
        url: originalRequest?.url,
        status: error.response?.status,
        message,
      });

      return Promise.reject(new Error(message));
    }

    // Handle any other errors
    const message =
      (error.response?.data as any)?.message ||
      error.message ||
      'An unexpected error occurred.';

    console.error('API error:', {
      url: originalRequest?.url,
      status: error.response?.status,
      message,
    });

    return Promise.reject(new Error(message));
  }
);

/**
 * Generic GET request with retry logic
 */
export const apiGet = async <T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  let attempt = 0;
  
  const makeRequest = async (): Promise<T> => {
    try {
      const response = await apiClient.get<T>(url, config);
      return response.data;
    } catch (error) {
      // Only retry on network errors or 5xx errors
      if (axios.isAxiosError(error)) {
        const isRetryable = !error.response || error.response.status >= 500;
        
        if (isRetryable && attempt < MAX_RETRY_ATTEMPTS) {
          attempt++;
          console.warn(`Request failed, retrying (${attempt}/${MAX_RETRY_ATTEMPTS}):`, url);
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
          
          return makeRequest();
        }
      }
      
      throw error;
    }
  };

  return makeRequest();
};

/**
 * Generic POST request
 */
export const apiPost = async <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
};

/**
 * Generic PUT request
 */
export const apiPut = async <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await apiClient.put<T>(url, data, config);
  return response.data;
};

/**
 * Generic DELETE request
 */
export const apiDelete = async <T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await apiClient.delete<T>(url, config);
  return response.data;
};

export default apiClient;

// SWR fetcher function
export const fetcher = (url: string) => apiClient.get(url).then(res => res.data);
