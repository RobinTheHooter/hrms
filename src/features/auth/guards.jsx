import { Navigate, Outlet } from 'react-router-dom'

import { ChunkLoader } from '@/components/ChunkLoader'
import { can, landingPathFor } from '@/features/auth/acl'
import { useCurrentUser } from '@/features/auth/hooks'
import { useAuthStore } from '@/features/auth/store'

/** Not logged in -> bounce to login. */
export function RequireAuth() {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <Outlet />
}

/** Logged in but lacking permission -> full-screen 403. */
export function RequirePermission({ permission, children }) {
  const { data: user, isLoading } = useCurrentUser()
  if (isLoading) return <ChunkLoader />
  if (!can(user, permission)) return <Navigate to="/403" replace />
  return children
}

/** Land users on the right page for their role/permissions. */
export function RoleHome() {
  const { data: user, isLoading } = useCurrentUser()
  if (isLoading) return <ChunkLoader />
  return <Navigate to={landingPathFor(user)} replace />
}
