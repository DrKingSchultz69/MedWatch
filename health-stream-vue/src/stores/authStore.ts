import { create } from 'zustand';

export type UserRole = 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT' | 'PHARMACIST' | 'ADMIN';

const API_BASE = 'http://localhost:4000/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  isAuthenticated: false,
  isLoading: false,
  token: localStorage.getItem('medwatch_token'),

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Invalid credentials');
      }

      const data = await res.json();
      const { token, user } = data;

      localStorage.setItem('medwatch_token', token);
      set({
        user,
        role: user.role,
        isAuthenticated: true,
        isLoading: false,
        token,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('medwatch_token');
    set({ user: null, role: null, isAuthenticated: false, token: null });
  },

  setUser: (user) => set({ user, role: user.role, isAuthenticated: true }),

  checkAuth: async () => {
    const token = localStorage.getItem('medwatch_token');
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        localStorage.removeItem('medwatch_token');
        set({ user: null, role: null, isAuthenticated: false, token: null });
        return;
      }

      const data = await res.json();
      set({
        user: data.user,
        role: data.user.role,
        isAuthenticated: true,
        token,
      });
    } catch {
      localStorage.removeItem('medwatch_token');
      set({ user: null, role: null, isAuthenticated: false, token: null });
    }
  },
}));
