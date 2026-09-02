import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'

import { BlankLayout } from '@/layouts/BlankLayout'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { PERMISSIONS, can, landingPathFor } from '@/features/auth/acl'
import { useCurrentUser } from '@/features/auth/hooks'
import { useAuthStore } from '@/features/auth/store'
import { NotFoundPage } from '@/features/misc/NotFoundPage'
import { RouteError } from '@/features/misc/RouteError'
import { ChunkLoader } from '@/components/ChunkLoader'

/** Not logged in -> bounce to login. */
function RequireAuth() {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <Outlet />
}

/** Logged in but lacking permission -> full-screen 403. */
function RequirePermission({ permission, children }) {
  const { data: user, isLoading } = useCurrentUser()
  if (isLoading) return <ChunkLoader />
  if (!can(user, permission)) return <Navigate to="/403" replace />
  return children
}

/** Land users on the right page for their role/permissions. */
function RoleHome() {
  const { data: user, isLoading } = useCurrentUser()
  if (isLoading) return <ChunkLoader />
  return <Navigate to={landingPathFor(user)} replace />
}

const lazyRoute = (factory, name, permission) => ({
  lazy: async () => {
    const mod = await factory()
    const Page = mod[name]
    if (!permission) return { Component: Page }
    return {
      Component: function GuardedPage() {
        return (
          <RequirePermission permission={permission}>
            <Page />
          </RequirePermission>
        )
      },
    }
  },
})

export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    HydrateFallback: ChunkLoader,
    children: [
      // Public, full-screen
      {
        element: <BlankLayout />,
        children: [
          {
            path: '/login',
            ...lazyRoute(() => import('@/features/auth/pages/LoginPage'), 'LoginPage'),
          },
        ],
      },

      // Authenticated
      {
        element: <RequireAuth />,
        children: [
          {
            element: <BlankLayout />,
            children: [
              {
                path: '/403',
                ...lazyRoute(() => import('@/features/misc/ForbiddenPage'), 'ForbiddenPage'),
              },
            ],
          },

          // App shell
          {
            element: <DashboardLayout />,
            children: [
              { path: '/', element: <RoleHome /> },
              {
                path: '/dashboard',
                ...lazyRoute(() => import('@/features/dashboard/pages/DashboardPage'), 'DashboardPage'),
              },
              {
                path: '/analytics',
                ...lazyRoute(() => import('@/features/dashboard/pages/AnalyticsPage'), 'AnalyticsPage', PERMISSIONS.JOBS_MANAGE),
              },
              {
                path: '/analytics/attrition',
                ...lazyRoute(() => import('@/features/dashboard/pages/AttritionPage'), 'AttritionPage', PERMISSIONS.JOBS_MANAGE),
              },
              {
                path: '/analytics/predictive',
                ...lazyRoute(() => import('@/features/dashboard/pages/PredictivePage'), 'PredictivePage', PERMISSIONS.JOBS_MANAGE),
              },
              {
                path: '/employees',
                ...lazyRoute(() => import('@/features/employees/pages/EmployeesPage'), 'EmployeesPage', PERMISSIONS.EMPLOYEES_VIEW),
              },
              {
                path: '/jobs',
                ...lazyRoute(() => import('@/features/jobs/pages/JobsPage'), 'JobsPage', PERMISSIONS.JOBS_VIEW),
              },
              {
                path: '/jobs/:id',
                ...lazyRoute(() => import('@/features/jobs/pages/JobDetailPage'), 'JobDetailPage', PERMISSIONS.JOBS_VIEW),
              },
              {
                path: '/candidates',
                ...lazyRoute(() => import('@/features/candidates/pages/CandidatesPage'), 'CandidatesPage', PERMISSIONS.CANDIDATES_VIEW),
              },
              {
                path: '/candidates/:id',
                ...lazyRoute(() => import('@/features/candidates/pages/CandidateDetailPage'), 'CandidateDetailPage', PERMISSIONS.CANDIDATES_VIEW),
              },
              {
                path: '/interviews',
                ...lazyRoute(() => import('@/features/interviews/pages/InterviewsPage'), 'InterviewsPage', PERMISSIONS.INTERVIEWS_VIEW),
              },
              {
                path: '/users',
                ...lazyRoute(() => import('@/features/users/pages/UsersPage'), 'UsersPage', PERMISSIONS.USERS_MANAGE),
              },
              {
                path: '/integrations',
                ...lazyRoute(() => import('@/features/integrations/pages/IntegrationsPage'), 'IntegrationsPage'),
              },
              {
                path: '/coming-soon',
                ...lazyRoute(() => import('@/features/misc/ComingSoonPage'), 'ComingSoonPage'),
              },
            ],
          },
        ],
      },

      // Unknown path -> full-screen 404
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
