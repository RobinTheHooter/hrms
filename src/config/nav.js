import {
  Briefcase,
  CalendarClock,
  ShieldCheck,
  Users,
} from 'lucide-react'

import { PERMISSIONS } from '@/features/auth/acl'

// Items with a `permission` are shown only to users who hold it.
// `soon: true` items are placeholders that route to the "coming soon" page
// until the ATS screens are built.
export const NAV_SECTIONS = [
  {
    label: 'Recruitment',
    items: [
      { to: '/jobs', label: 'Jobs', icon: Briefcase, permission: PERMISSIONS.JOBS_VIEW },
      { to: '/candidates', label: 'Candidates', icon: Users, permission: PERMISSIONS.CANDIDATES_VIEW, soon: true, badge: { text: 'Soon', variant: 'new' } },
      { to: '/interviews', label: 'Interviews', icon: CalendarClock, permission: PERMISSIONS.INTERVIEWS_VIEW, soon: true, badge: { text: 'Soon', variant: 'new' } },
    ],
  },
  {
    label: 'Administration',
    items: [
      { to: '/users', label: 'User Management', icon: ShieldCheck, permission: PERMISSIONS.USERS_MANAGE },
    ],
  },
]
