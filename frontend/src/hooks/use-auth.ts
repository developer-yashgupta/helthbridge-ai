'use client';

import React, { useState, useEffect } from 'react';
import { apiService } from '@/lib/api-service';
import type { Role } from '@/lib/types';

interface User {
  id: string;
  phone: string;
  name: string;
  userType: string;
  language: string;
  location: any;
}

interface AuthState {
  user: User | null;
  token: string | null;
  role: Role | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    role: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    // Check for stored auth data on mount (only on client side)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      const role = localStorage.getItem('userRole') as Role;
      
      if (token && role) {
        // Verify token with backend
        apiService.getProfile(token)
          .then(response => {
            if (response.success && response.data) {
              setAuthState({
                user: response.data,
                token,
                role,
                isLoading: false,
                isAuthenticated: true,
              });
            } else {
              // Token invalid, clear storage
              localStorage.removeItem('authToken');
              localStorage.removeItem('userRole');
              setAuthState(prev => ({ ...prev, isLoading: false }));
            }
          })
          .catch(() => {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userRole');
            setAuthState(prev => ({ ...prev, isLoading: false }));
          });
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = (token: string, user: User, role: Role) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
      localStorage.setItem('userRole', role);
    }
    setAuthState({
      user,
      token,
      role,
      isLoading: false,
      isAuthenticated: true,
    });
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
    }
    setAuthState({
      user: null,
      token: null,
      role: null,
      isLoading: false,
      isAuthenticated: false,
    });
  };

  return {
    ...authState,
    login,
    logout,
  };
}