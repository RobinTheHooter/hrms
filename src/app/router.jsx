import { lazy } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'

import { BlankLayout } from '@/layouts/BlankLayout'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { PERMISSIONS, can, landingPathFor } from '@/features/auth/acl'
import { useCurrentUser } from '@/features/auth/hooks'
import { useAuthStore } from '@/features/auth/store'
// Eager: the error boundary and 404 sit outside the Suspense-wrapped layouts.
import { NotFoundPage } from '@/features/misc/NotFoundPage'
import { RouteError } from '@/features/misc/RouteError'

// NOTE: the dashboards and Employees module are hidden during the ATS pivot.
// Their page components still exist under features/ but aren't routed here.

// Code-split each page into its own chunk (named exports → default for lazy).
const lazyPage = (factory, name) =>
  lazy(() => factory().then((m) => ({ default: m[name] })))

const LoginPage = lazyPage(() => import('@/features/auth/pages/LoginPage'), 'LoginPage')
const DashboardPage = lazyPage(() => import('@/features/dashboard/pages/DashboardPage'), 'DashboardPage')
const JobsPage = lazyPage(() => import('@/features/jobs/pages/JobsPage'), 'JobsPage')
const JobDetailPage = lazyPage(() => import('@/features/jobs/pages/JobDetailPage'), 'JobDetailPage')
const CandidatesPage = lazyPage(() => import('@/features/candidates/pages/CandidatesPage'), 'CandidatesPage')
const CandidateDetailPage = lazyPage(() => import('@/features/candidates/pages/CandidateDetailPage'), 'CandidateDetailPage')
const InterviewsPage = lazyPage(() => import('@/features/interviews/pages/InterviewsPage'), 'InterviewsPage')
const UsersPage = lazyPage(() => import('@/features/users/pages/UsersPage'), 'UsersPage')
const IntegrationsPage = lazyPage(() => import('@/features/integrations/pages/IntegrationsPage'), 'IntegrationsPage')
const ComingSoonPage = lazyPage(() => import('@/features/misc/ComingSoonPage'), 'ComingSoonPage')
const ForbiddenPage = lazyPage(() => import('@/features/misc/ForbiddenPage'), 'ForbiddenPage')

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
  {
    // Root error boundary: catches render errors and failed chunk loads
    // anywhere below and shows a recovery screen instead of a blank page.
    errorElement: <RouteError />,
    children: [
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
              { path: '/dashboard', element: <DashboardPage /> },
              { path: '/jobs', element: guarded(PERMISSIONS.JOBS_VIEW, <JobsPage />) },
              { path: '/jobs/:id', element: guarded(PERMISSIONS.JOBS_VIEW, <JobDetailPage />) },
              { path: '/candidates', element: guarded(PERMISSIONS.CANDIDATES_VIEW, <CandidatesPage />) },
              { path: '/candidates/:id', element: guarded(PERMISSIONS.CANDIDATES_VIEW, <CandidateDetailPage />) },
              { path: '/interviews', element: guarded(PERMISSIONS.INTERVIEWS_VIEW, <InterviewsPage />) },
              { path: '/users', element: guarded(PERMISSIONS.USERS_MANAGE, <UsersPage />) },
              { path: '/integrations', element: <IntegrationsPage /> },
              { path: '/coming-soon', element: <ComingSoonPage /> },
            ],
          },
        ],
      },

      // Unknown path -> full-screen 404
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
