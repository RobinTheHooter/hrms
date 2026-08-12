import { apiClient } from '@/lib/apiClient'

/** FastAPI's OAuth2PasswordRequestForm expects url-encoded username/password. */
export async function login({ email, password }) {
  const body = new URLSearchParams()
  body.set('username', email)
  body.set('password', password)

  const { data } = await apiClient.post('/auth/login', body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return data // { access_token, token_type }
}

export async function getCurrentUser() {
  const { data } = await apiClient.get('/auth/me')
  return data // { id, email, full_name, role, is_active }
}
