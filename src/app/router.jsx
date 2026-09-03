import { createBrowserRouter } from 'react-router-dom'

import { BlankLayout } from '@/layouts/BlankLayout'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { PERMISSIONS } from '@/features/auth/acl'
import { RequireAuth, RequirePermission, RoleHome } from '@/features/auth/guards'
import { NotFoundPage } from '@/features/misc/NotFoundPage'
import { RouteError } from '@/features/misc/RouteError'
import { AppSplash } from '@/components/AppSplash'

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
    HydrateFallback: AppSplash,
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
