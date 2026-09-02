import axios from 'axios'
import { toast } from 'sonner'

import { DEV_AUTH_ENABLED } from '@/features/auth/devUser'
import { useAuthStore } from '@/features/auth/store'

const INTERNAL_BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1'
const MCN_BASE_URL = import.meta.env.VITE_MCN_API_URL ?? ''

export const axiosInstance = axios.create()

// Guards against a burst of failed requests stacking toasts / redirects.
let isLoggingOut = false

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status

    // 401: session expired — log out and bounce to login.
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

export async function HttpClient(
  url,
  {
    data = undefined,
    method = 'GET',
    responseType = 'json',
    params = undefined,
    isFormEncoded = false,
    isMCN = false,
  } = {},
  signal,
  timeout,
) {
  const baseURL = isMCN ? MCN_BASE_URL : INTERNAL_BASE_URL
  const token = useAuthStore.getState().token

  // Resolve Content-Type per-request so a previous request (e.g. a FormData
  // upload) can't leak its header onto the next one via shared defaults.
  let contentType = 'application/json'
  if (data instanceof FormData) {
    // Let axios set multipart/form-data with the correct boundary.
    contentType = undefined
  } else if (isFormEncoded) {
    contentType = 'application/x-www-form-urlencoded'
  }

  const headers = {}
  if (contentType) headers['Content-Type'] = contentType
  // Only attach the auth token to our own API, never to external (MCN) URLs.
  if (!isMCN && token) headers.Authorization = `Bearer ${token}`

  const response = await axiosInstance({
    url: `${baseURL}${url}`,
    method,
    data,
    params,
    signal,
    timeout: timeout ?? 30000,
    responseType,
    headers,
  })

  // Blobs (file downloads) need the raw response so callers can read
  // Content-Disposition; JSON callers get the payload directly.
  if (responseType === 'blob') return response
  return response.data
}

export default HttpClient
