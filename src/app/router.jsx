import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'

import { DashboardLayout } from '@/layouts/DashboardLayout'
import { useAuthStore } from '@/features/auth/store'
import { useCurrentUser } from '@/features/auth/hooks'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { EmployeeDashboardPage } from '@/features/dashboard/pages/EmployeeDashboardPage'
import { HRDashboardPage } from '@/features/dashboard/pages/HRDashboardPage'
import { EmployeesPage } from '@/features/employees/pages/EmployeesPage'
import { ComingSoonPage } from '@/features/misc/ComingSoonPage'

function ProtectedRoute() {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <Outlet />
}

// Land users on the right dashboard for their role.
function RoleHome() {
  const { data: user, isLoading } = useCurrentUser()
  if (isLoading) return null
  const byRole = {
    employee: '/employee-dashboard',
    hr: '/hr-dashboard',
  }
  return <Navigate to={byRole[user?.role] ?? '/dashboard'} replace />
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/', element: <RoleHome /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/hr-dashboard', element: <HRDashboardPage /> },
          { path: '/employee-dashboard', element: <EmployeeDashboardPage /> },
          { path: '/employees', element: <EmployeesPage /> },
          { path: '/coming-soon', element: <ComingSoonPage /> },
        ],
      },
    ],
  },
])
