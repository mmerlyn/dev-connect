import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../api/client';
import type { User, LoginCredentials, RegisterData, AuthResponse } from '../types';

interface LoginResponse {
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  requires2FA?: boolean;
  userId?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  pending2FAUserId: string | null;
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  verify2FA: (userId: string, token: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  getCurrentUser: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  clearError: () => void;
  clear2FA: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      pending2FAUserId: null,

      login: async (credentials) => {
        try {
          set({ isLoading: true, error: null, pending2FAUserId: null });
          const response = await apiClient.post<{ data: LoginResponse }>('/auth/login', credentials);
          const data = response.data.data;

          // Check if 2FA is required
          if (data.requires2FA && data.userId) {
            set({
              pending2FAUserId: data.userId,
              isLoading: false,
            });
            return data;
          }

          const { user, accessToken, refreshToken } = data;

          if (accessToken && refreshToken) {
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);

            set({
              user: user || null,
              accessToken,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
            });
          }

          return data;
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      verify2FA: async (userId: string, token: string) => {
        try {
          set({ isLoading: true, error: null });
          const response = await apiClient.post<{ data: AuthResponse }>('/auth/2fa/verify', { userId, token });
          const { user, accessToken, refreshToken } = response.data.data;

          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            pending2FAUserId: null,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || '2FA verification failed',
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (data) => {
        try {
          set({ isLoading: true, error: null });
          const response = await apiClient.post<{ data: AuthResponse }>('/auth/register', data);
          const { user, accessToken, refreshToken } = response.data.data;

          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Registration failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      getCurrentUser: async () => {
        try {
          set({ isLoading: true });
          const response = await apiClient.get<{ data: User }>('/auth/me');
          set({
            user: response.data.data,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          get().logout();
        }
      },

      setTokens: async (accessToken: string, refreshToken: string) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ accessToken, refreshToken, isAuthenticated: true });
        await get().getCurrentUser();
      },

      clearError: () => set({ error: null }),

      clear2FA: () => set({ pending2FAUserId: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
