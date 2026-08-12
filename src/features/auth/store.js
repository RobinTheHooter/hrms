import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { DEV_AUTH_ENABLED, DEV_TOKEN } from '@/features/auth/devUser'

/**
 * Auth is CLIENT state -> Zustand (persisted).
 * The current user's *data* is SERVER state -> fetched via TanStack Query.
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      token: DEV_AUTH_ENABLED ? DEV_TOKEN : null,
      setToken: (token) => set({ token }),
      logout: () => set({ token: null }),
    }),
    { name: 'hrms-auth' },
  ),
)
