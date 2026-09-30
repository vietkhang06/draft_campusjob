'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, setAccessToken, clearAccessToken, refreshAccessToken } from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'employer' | 'moderator' | 'admin';
  status: 'pending_verification' | 'active' | 'suspended' | 'locked';
  emailVerifiedAt: string | null;
  profile: any;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (payload: { email: string; password: string; name: string; role: 'student' | 'employer' }) => Promise<any>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const data = await api('auth/me');
      setUser(data.user);
      return data.user;
    } catch (err) {
      setUser(null);
      clearAccessToken();
      return null;
    }
  };

  const refreshSession = async () => {
    try {
      await refreshAccessToken();
      await fetchCurrentUser();
    } catch (err) {
      setUser(null);
      clearAccessToken();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api('auth/login', 'POST', { email, password }, { retryOn401: false });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data;
  };

  const register = async (payload: {
    email: string;
    password: string;
    name: string;
    role: 'student' | 'employer';
  }) => {
    return api('auth/register', 'POST', payload, { retryOn401: false });
  };

  const logout = async () => {
    try {
      await api('auth/logout', 'POST', {}, { retryOn401: false });
    } catch (err) {
      // ignore logout network errors
    } finally {
      clearAccessToken();
      setUser(null);
      window.location.href = '/login';
    }
  };

  const logoutAll = async () => {
    try {
      await api('auth/logout-all', 'POST', {}, { retryOn401: false });
    } catch (err) {
      // ignore
    } finally {
      clearAccessToken();
      setUser(null);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        logoutAll,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
