import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'

import { DashboardLayout } from '@/layouts/DashboardLayout'
import { useAuthStore } from '@/features/auth/store'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { EmployeesPage } from '@/features/employees/pages/EmployeesPage'
import { ComingSoonPage } from '@/features/misc/ComingSoonPage'

function ProtectedRoute() {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <Outlet />
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/employees', element: <EmployeesPage /> },
          { path: '/coming-soon', element: <ComingSoonPage /> },
        ],
      },
    ],
  },
])
