import {
  BarChart3,
  Briefcase,
  CalendarClock,
  LayoutDashboard,
  LineChart,
  Plug,
  Sparkles,
  ShieldCheck,
  UserCog,
  Users,
} from 'lucide-react'

import { PERMISSIONS } from '@/features/auth/acl'

// Items with a `permission` are shown only to users who hold it.
// `soon: true` items are placeholders that route to the "coming soon" page
// until the ATS screens are built.
export const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      // No permission -> visible to every signed-in user.
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Recruitment',
    items: [
      { to: '/jobs', label: 'Jobs', icon: Briefcase, permission: PERMISSIONS.JOBS_VIEW },
      { to: '/candidates', label: 'Candidates', icon: Users, permission: PERMISSIONS.CANDIDATES_VIEW },
      { to: '/interviews', label: 'Interviews', icon: CalendarClock, permission: PERMISSIONS.INTERVIEWS_VIEW },
    ],
  },
  {
    label: 'People',
    items: [
      { to: '/employees', label: 'Employees', icon: UserCog, permission: PERMISSIONS.EMPLOYEES_VIEW },
    ],
  },
  {
    label: 'Insights',
    items: [
      { to: '/analytics', label: 'Recruiting analytics', icon: BarChart3, permission: PERMISSIONS.JOBS_MANAGE },
      { to: '/analytics/attrition', label: 'Attrition', icon: LineChart, permission: PERMISSIONS.JOBS_MANAGE },
      { to: '/analytics/predictive', label: 'Predictive', icon: Sparkles, permission: PERMISSIONS.JOBS_MANAGE },
    ],
  },
  {
    label: 'Administration',
    items: [
      { to: '/users', label: 'User Management', icon: ShieldCheck, permission: PERMISSIONS.USERS_MANAGE },
    ],
  },
  {
    label: 'Account',
    items: [
      // No permission -> visible to every signed-in user (connect their own calendar).
      { to: '/integrations', label: 'Integrations', icon: Plug },
    ],
  },
]
