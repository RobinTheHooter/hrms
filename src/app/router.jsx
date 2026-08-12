import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'

import { DashboardLayout } from '@/layouts/DashboardLayout'
import { useAuthStore } from '@/features/auth/store'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { EmployeesPage } from '@/features/employees/pages/EmployeesPage'

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
          { path: '/', element: <Navigate to="/employees" replace /> },
          { path: '/employees', element: <EmployeesPage /> },
        ],
      },
    ],
  },
])
