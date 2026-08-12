import {
  Bell,
  Grid3x3,
  LayoutGrid,
  LogOut,
  Mail,
  Maximize2,
  MessageSquare,
  Search,
  Settings,
  Sparkles,
} from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NAV_SECTIONS } from '@/config/nav'
import { can } from '@/features/auth/acl'
import { useCurrentUser } from '@/features/auth/hooks'
import { useAuthStore } from '@/features/auth/store'
import { cn } from '@/lib/utils'

function BrandMark() {
  return (
    <div className="flex items-center gap-2 px-5 py-4">
      <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Sparkles className="size-4" />
      </div>
      <span className="text-xl font-bold tracking-tight">
        Smart<span className="text-primary">HR</span>
      </span>
    </div>
  )
}

function HeaderIcon({ icon: Icon, badge }) {
  return (
    <button className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
      <Icon className="size-[18px]" />
      {badge && (
        <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary ring-2 ring-card" />
      )}
    </button>
  )
}

export function DashboardLayout() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const { data: user } = useCurrentUser()
  const fullName = user?.full_name ?? 'User'

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-card">
        <BrandMark />
        <div className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
          {NAV_SECTIONS.map((section) => {
            // Hide items the user lacks permission for; items without a
            // permission (placeholders) are always visible.
            const items = section.items.filter(
              (item) => !item.permission || can(user, item.permission),
            )
            if (items.length === 0) return null
            return (
            <div key={section.label}>
              <p className="px-3 pb-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                {section.label}
              </p>
              <nav className="space-y-0.5">
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.soon ? '/coming-soon' : item.to}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive && !item.soon
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground/70 hover:bg-muted hover:text-foreground',
                      )
                    }
                  >
                    <item.icon className="size-[18px] shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <Badge variant={item.badge.variant} className="px-1.5 py-0 text-[10px]">
                        {item.badge.text}
                      </Badge>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>
            )
          })}
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen flex-col pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-6">
          <div className="relative hidden w-full max-w-xs md:block">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search in HRMS"
              className="h-9 w-full rounded-lg border bg-muted/40 pr-14 pl-9 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
            />
            <kbd className="absolute top-1/2 right-2 -translate-y-1/2 rounded border bg-card px-1.5 py-0.5 text-[10px] text-muted-foreground">
              CTRL /
            </kbd>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <Button className="mr-2 gap-1.5" size="sm">
              <Sparkles className="size-4" />
              AI Center
            </Button>
            <HeaderIcon icon={LayoutGrid} />
            <HeaderIcon icon={Grid3x3} />
            <HeaderIcon icon={Settings} />
            <HeaderIcon icon={Maximize2} />
            <HeaderIcon icon={MessageSquare} badge />
            <HeaderIcon icon={Mail} />
            <HeaderIcon icon={Bell} badge />
            <div className="ml-2 flex items-center gap-2">
              <Avatar name={fullName} size="sm" />
              <button
                onClick={handleLogout}
                title="Log out"
                className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <LogOut className="size-[18px]" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
