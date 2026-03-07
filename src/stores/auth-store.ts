import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminUser } from '@/types';

interface AuthStore {
  token: string | null;
  admin: AdminUser | null;
  
  // Actions
  setAuth: (token: string, admin: AdminUser) => void;
  logout: () => void;
  
  // Computed
  isAuthenticated: () => boolean;
  hasRole: (roles: Array<'owner' | 'manager' | 'staff'>) => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      admin: null,

      setAuth: (token, admin) => set({ token, admin }),

      logout: () => set({ token: null, admin: null }),

      isAuthenticated: () => {
        const { token, admin } = get();
        return !!token && !!admin;
      },

      hasRole: (roles) => {
        const { admin } = get();
        if (!admin) return false;
        return roles.includes(admin.role);
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
