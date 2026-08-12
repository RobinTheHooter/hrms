import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'

import { DashboardLayout } from '@/layouts/DashboardLayout'
import { PERMISSIONS, can, landingPathFor } from '@/features/auth/acl'
import { useCurrentUser } from '@/features/auth/hooks'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { useAuthStore } from '@/features/auth/store'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { EmployeeDashboardPage } from '@/features/dashboard/pages/EmployeeDashboardPage'
import { HRDashboardPage } from '@/features/dashboard/pages/HRDashboardPage'
import { EmployeesPage } from '@/features/employees/pages/EmployeesPage'
import { ComingSoonPage } from '@/features/misc/ComingSoonPage'
import { ForbiddenPage } from '@/features/misc/ForbiddenPage'
import { UsersPage } from '@/features/users/pages/UsersPage'

function ProtectedRoute() {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <Outlet />
}

/** Gate a route by a required permission. Unauthorized -> 403 page. */
function RequirePermission({ permission, children }) {
  const { data: user, isLoading } = useCurrentUser()
  if (isLoading) return null
  if (!can(user, permission)) return <Navigate to="/403" replace />
  return children
}

/** Land users on the right dashboard for their role/permissions. */
function RoleHome() {
  const { data: user, isLoading } = useCurrentUser()
  if (isLoading) return null
  return <Navigate to={landingPathFor(user)} replace />
}

const guarded = (permission, element) => (
  <RequirePermission permission={permission}>{element}</RequirePermission>
)

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/', element: <RoleHome /> },
          { path: '/dashboard', element: guarded(PERMISSIONS.DASHBOARD_ADMIN, <DashboardPage />) },
          { path: '/hr-dashboard', element: guarded(PERMISSIONS.DASHBOARD_HR, <HRDashboardPage />) },
          { path: '/employee-dashboard', element: guarded(PERMISSIONS.DASHBOARD_EMPLOYEE, <EmployeeDashboardPage />) },
          { path: '/employees', element: guarded(PERMISSIONS.EMPLOYEES_VIEW, <EmployeesPage />) },
          { path: '/users', element: guarded(PERMISSIONS.USERS_MANAGE, <UsersPage />) },
          { path: '/coming-soon', element: <ComingSoonPage /> },
          { path: '/403', element: <ForbiddenPage /> },
        ],
      },
    ],
  },
])
