import { create } from 'zustand';
import type { User } from '../types';
import { setToken, getToken, getMe } from '../api/client';

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  setUser: (user: User | null) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  initAuth: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  isAuthenticated: false,
  authLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  login: (user, token) => {
    setToken(token);
    set({ user, isAuthenticated: true });
  },
  logout: () => {
    setToken(null);
    set({ user: null, isAuthenticated: false });
  },
  initAuth: async () => {
    const token = getToken();
    if (!token) {
      set({ authLoading: false });
      return;
    }
    try {
      const user = await getMe();
      set({ user, isAuthenticated: true, authLoading: false });
    } catch {
      setToken(null);
      set({ user: null, isAuthenticated: false, authLoading: false });
    }
  },
}));
