import axios from 'axios'
import { DEV_AUTH_ENABLED } from '@/features/auth/devUser'
import { useAuthStore } from '@/features/auth/store'

export const apiClient = axios.create({
  baseURL: '/api/v1',
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
