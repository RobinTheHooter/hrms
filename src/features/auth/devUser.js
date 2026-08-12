// ---------------------------------------------------------------------------
// DEV ONLY: hard-coded default user so you can build the UI without a running
// backend or real login. Set DEV_AUTH_ENABLED to false (or delete this file's
// usages) once real auth works.
// ---------------------------------------------------------------------------
export const DEV_AUTH_ENABLED = true

export const DEV_TOKEN = 'dev-token'

export const DEV_USER = {
  id: 1,
  email: 'admin@hrms.local',
  full_name: 'Dev Admin',
  role: 'admin',
  is_active: true,
}
