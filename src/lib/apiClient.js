import axios from 'axios'
import { DEV_AUTH_ENABLED } from '@/features/auth/devUser'
import { useAuthStore } from '@/features/auth/store'

// In dev, '/api/v1' is proxied to the local backend by Vite. In production,
// set VITE_API_URL to the deployed backend, e.g. https://hrms-backend.onrender.com/api/v1
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Attach the bearer token to every request.
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// On 401, clear auth and bounce to login.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // In dev-auth mode, don't bounce to login on 401 (backend may be absent).
    if (error.response?.status === 401 && !DEV_AUTH_ENABLED) {
      useAuthStore.getState().logout()
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  },
)
