import axios from 'axios'
import { toast } from 'sonner'
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

// Guards against a burst of failed requests stacking toasts / redirects.
let isLoggingOut = false

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status

    // 401: session expired — warn
    if (status === 401 && !DEV_AUTH_ENABLED && !isLoggingOut) {
      isLoggingOut = true
      useAuthStore.getState().logout()
      toast.error('Your session has expired. Please sign in again.')
      setTimeout(() => {
        if (window.location.pathname !== '/login') {
          window.location.assign('/login')
        }
      }, 1500)
    }

    // 429: rate limited — surface the server's message (or a default).
    if (status === 429) {
      toast.error(
        error.response?.data?.detail ??
          'Too many requests — please slow down and try again shortly.',
      )
    }

    return Promise.reject(error)
  },
)
