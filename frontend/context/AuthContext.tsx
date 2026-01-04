'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, AuthState, LoginPayload, SignupPayload, AuthResponse } from '@/types';
import apiClient from '@/utils/api';
import { getToken, setToken, removeToken } from '@/utils/storage';

interface AuthContextType extends AuthState {
  login: (payload: LoginPayload) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => void;
  getMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });
  const router = useRouter();

  const getMe = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/auth/me');
      setState((prev) => ({
        ...prev,
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }));
    } catch (error: any) {
      console.error('Failed to fetch user', error);
      removeToken();
      setState((prev) => ({
        ...prev,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      }));
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (token) {
      setState((prev) => ({ ...prev, token, isAuthenticated: true }));
      getMe();
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [getMe]);

  const login = async (payload: LoginPayload) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await apiClient.post<AuthResponse>('/api/auth/login', payload);
      const { user, token } = response.data;
      setToken(token);
      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      router.push('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      throw new Error(message);
    }
  };

  const signup = async (payload: SignupPayload) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await apiClient.post<AuthResponse>('/api/auth/signup', payload);
      const { user, token } = response.data;
      setToken(token);
      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      router.push('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Signup failed';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      throw new Error(message);
    }
  };

  const logout = () => {
    removeToken();
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    router.push('/auth/login');
  };

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout, getMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
