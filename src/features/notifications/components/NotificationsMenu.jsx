import { Bell, CalendarClock, ClipboardCheck, UserPlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { HeaderMenu } from '@/components/layout/HeaderMenu'
import {
  formatRelative,
  toMs,
  useNotifications,
  useNotificationsSeen,
} from '@/features/notifications/hooks'
import { cn } from '@/lib/utils'

// Per-type icon + accent colour so the feed reads at a glance.
const TYPE_STYLE = {
  candidate: { icon: UserPlus, className: 'bg-info/12 text-info' },
  interview: { icon: CalendarClock, className: 'bg-warning/15 text-warning' },
  decision: { icon: ClipboardCheck, className: 'bg-success/12 text-success' },
}

export function NotificationsMenu() {
  const navigate = useNavigate()
  const { data: items = [] } = useNotifications()
  const { lastSeen, markSeen } = useNotificationsSeen()

  // Live unread count for the bell badge (before opening).
  const unread = useMemo(
    () => items.filter((n) => toMs(n.timestamp) > lastSeen).length,
    [items, lastSeen],
  )

  // Frozen at open time so items you hadn't seen stay highlighted while the
  // panel is open, even though opening marks them seen for next time.
  const [threshold, setThreshold] = useState(lastSeen)
  const handleOpen = () => {
    setThreshold(lastSeen)
    markSeen()
  }
  const newCount = items.filter((n) => toMs(n.timestamp) > threshold).length

  return (
    <HeaderMenu icon={Bell} count={unread} onOpen={handleOpen} panelWidth="w-96">
      {({ close }) => (
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
            <span className="text-sm font-semibold">Notifications</span>
            {newCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                {newCount} new
              </span>
            )}
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-10 text-center">
              <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Bell className="size-5" />
              </span>
              <p className="text-sm font-medium">You're all caught up</p>
              <p className="mt-1 text-xs text-muted-foreground">
                New candidates and interviews will show up here.
              </p>
            </div>
          ) : (
            <ul className="max-h-96 divide-y divide-border/60 overflow-y-auto">
              {items.map((n) => {
                const style = TYPE_STYLE[n.type] ?? {
                  icon: Bell,
                  className: 'bg-primary/10 text-primary',
                }
                const Icon = style.icon
                const isNew = toMs(n.timestamp) > threshold
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => {
                        navigate(n.link)
                        close()
                      }}
                      className={cn(
                        'relative flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60',
                        isNew && 'bg-primary/[0.04]',
                      )}
                    >
                      {isNew && (
                        <span className="absolute inset-y-0 left-0 w-0.5 bg-primary" />
                      )}
                      <span
                        className={cn(
                          'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full',
                          style.className,
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">{n.title}</span>
                          {isNew && (
                            <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                          )}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {n.message}
                        </span>
                      </span>
                      <span className="shrink-0 pt-0.5 text-[11px] whitespace-nowrap text-muted-foreground">
                        {formatRelative(n.timestamp)}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </HeaderMenu>
  )
}

export default NotificationsMenu
