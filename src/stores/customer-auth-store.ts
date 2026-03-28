import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CustomerUser } from '@/types';

interface CustomerAuthStore {
  token: string | null;
  customer: CustomerUser | null;

  // Actions
  setAuth: (token: string, customer: CustomerUser) => void;
  logout: () => void;

  // Computed
  isAuthenticated: () => boolean;
}

export const useCustomerAuthStore = create<CustomerAuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      customer: null,

      setAuth: (token, customer) => set({ token, customer }),

      logout: () => set({ token: null, customer: null }),

      isAuthenticated: () => {
        const { token, customer } = get();
        return !!token && !!customer;
      },
    }),
    {
      name: 'customer-auth-storage',
    }
  )
);
