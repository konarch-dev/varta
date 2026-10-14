import { create } from 'zustand';
import { apiRequest, setApiToken } from '../lib/api';
import { CurrentUser, LoginDto, RegisterDto } from '@varta/shared';

interface AuthState {
  user: CurrentUser | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (dto: LoginDto) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  initAuth: () => Promise<void>;
  updateUser: (updatedUser: Partial<CurrentUser>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isInitialized: false,

  initAuth: async () => {
    if (typeof window === 'undefined') return;
    const storedToken = localStorage.getItem('varta_token');
    if (!storedToken) {
      set({ isInitialized: true });
      return;
    }

    setApiToken(storedToken);
    try {
      const user = await apiRequest<CurrentUser>('/auth/me');
      set({ user, token: storedToken, isInitialized: true });
    } catch {
      setApiToken(null);
      set({ user: null, token: null, isInitialized: true });
    }
  },

  login: async (dto: LoginDto) => {
    set({ isLoading: true });
    try {
      const data = await apiRequest<{ user: CurrentUser; accessToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(dto),
      });

      setApiToken(data.accessToken);
      set({ user: data.user, token: data.accessToken, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (dto: RegisterDto) => {
    set({ isLoading: true });
    try {
      const data = await apiRequest<{ user: CurrentUser; accessToken: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(dto),
      });

      setApiToken(data.accessToken);
      set({ user: data.user, token: data.accessToken, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      setApiToken(null);
      set({ user: null, token: null });
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  },

  updateUser: (updatedUser: Partial<CurrentUser>) => {
    const current = get().user;
    if (current) {
      set({ user: { ...current, ...updatedUser } });
    }
  },
}));
