import { HttpClient } from '@/lib/httpClient'

export async function login({ email, password }) {
  const body = new URLSearchParams()
  body.set('username', email)
  body.set('password', password)

  return HttpClient('/auth/login', {
    method: 'POST',
    data: body,
    isFormEncoded: true,
  })
}

export async function getCurrentUser() {
  return HttpClient('/auth/me')
}
