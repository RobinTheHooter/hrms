import {
  Boxes,
  Briefcase,
  CalendarCheck,
  DollarSign,
  LayoutDashboard,
  LifeBuoy,
  Mail,
  MessagesSquare,
  Settings,
  Target,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react'

// `soon: true` items are visual placeholders for modules not built yet.
export const NAV_SECTIONS = [
  {
    label: 'Main Menu',
    items: [
      { to: '/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard, badge: { text: 'Hot', variant: 'hot' } },
      { to: '/employee-dashboard', label: 'Employee Dashboard', icon: LayoutDashboard },
      { to: '/employees', label: 'Employees', icon: Users },
      { to: '/recruitment', label: 'Recruitment', icon: UserPlus, soon: true, badge: { text: 'New', variant: 'new' } },
      { to: '/attendance', label: 'Attendance', icon: CalendarCheck, soon: true, badge: { text: 'New', variant: 'new' } },
      { to: '/payroll', label: 'Payroll', icon: Wallet, soon: true, badge: { text: 'New', variant: 'new' } },
      { to: '/finance', label: 'Finance', icon: DollarSign, soon: true, badge: { text: 'New', variant: 'new' } },
      { to: '/assets', label: 'Assets', icon: Boxes, soon: true, badge: { text: 'New', variant: 'new' } },
      { to: '/helpdesk', label: 'Help Desk', icon: LifeBuoy, soon: true, badge: { text: 'New', variant: 'new' } },
    ],
  },
  {
    label: 'Applications',
    items: [
      { to: '/deals', label: 'Deals', icon: Briefcase, soon: true },
      { to: '/leads', label: 'Leads', icon: Target, soon: true },
      { to: '/chat', label: 'Chat', icon: MessagesSquare, soon: true },
      { to: '/email', label: 'Email', icon: Mail, soon: true },
    ],
  },
  {
    label: 'System',
    items: [{ to: '/settings', label: 'Settings', icon: Settings, soon: true }],
  },
]
