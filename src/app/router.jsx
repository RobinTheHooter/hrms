import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'

import { BlankLayout } from '@/layouts/BlankLayout'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { PERMISSIONS, can, landingPathFor } from '@/features/auth/acl'
import { useCurrentUser } from '@/features/auth/hooks'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { useAuthStore } from '@/features/auth/store'
import { ComingSoonPage } from '@/features/misc/ComingSoonPage'
import { ForbiddenPage } from '@/features/misc/ForbiddenPage'
import { UsersPage } from '@/features/users/pages/UsersPage'

// NOTE: the dashboards and Employees module are hidden during the ATS pivot.
// Their page components still exist under features/ but aren't routed here.

/** Not logged in -> bounce to login. */
function RequireAuth() {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <Outlet />
}

/** Logged in but lacking permission -> full-screen 403. */
function RequirePermission({ permission, children }) {
  const { data: user, isLoading } = useCurrentUser()
  if (isLoading) return null
  if (!can(user, permission)) return <Navigate to="/403" replace />
  return children
}

/** Land users on the right page for their role/permissions. */
function RoleHome() {
  const { data: user, isLoading } = useCurrentUser()
  if (isLoading) return null
  return <Navigate to={landingPathFor(user)} replace />
}

const guarded = (permission, element) => (
  <RequirePermission permission={permission}>{element}</RequirePermission>
)

export const router = createBrowserRouter([
  // Public, full-screen
  {
    element: <BlankLayout />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },

  // Authenticated
  {
    element: <RequireAuth />,
    children: [
      // Full-screen authenticated pages (no chrome)
      {
        element: <BlankLayout />,
        children: [{ path: '/403', element: <ForbiddenPage /> }],
      },

      // App shell
      {
        element: <DashboardLayout />,
        children: [
          { path: '/', element: <RoleHome /> },
          { path: '/users', element: guarded(PERMISSIONS.USERS_MANAGE, <UsersPage />) },
          { path: '/coming-soon', element: <ComingSoonPage /> },
        ],
      },
    ],
  },

  // Unknown path -> home (re-routes by auth/role)
  { path: '*', element: <Navigate to="/" replace /> },
])
