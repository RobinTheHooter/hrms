import { Bell, CalendarClock, UserPlus } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { HeaderMenu } from '@/components/layout/HeaderMenu'
import {
  formatRelative,
  toMs,
  useNotifications,
  useNotificationsSeen,
} from '@/features/notifications/hooks'

const TYPE_ICON = {
  candidate: UserPlus,
  interview: CalendarClock,
}

export function NotificationsMenu() {
  const navigate = useNavigate()
  const { data: items = [] } = useNotifications()
  const { lastSeen, markSeen } = useNotificationsSeen()

  const unread = useMemo(
    () => items.filter((n) => toMs(n.timestamp) > lastSeen).length,
    [items, lastSeen],
  )

  return (
    <HeaderMenu
      icon={Bell}
      title="Notifications"
      count={unread}
      onOpen={markSeen}
      panelWidth="w-96"
    >
      {({ close }) =>
        items.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-medium">You're all caught up</p>
            <p className="mt-1 text-xs text-muted-foreground">
              New candidates and interviews will show up here.
            </p>
          </div>
        ) : (
          <ul className="max-h-96 overflow-y-auto py-1">
            {items.map((n) => {
              const Icon = TYPE_ICON[n.type] ?? Bell
              const isUnread = toMs(n.timestamp) > lastSeen
              return (
                <li key={n.id}>
                  <button
                    onClick={() => {
                      navigate(n.link)
                      close()
                    }}
                    className="flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-muted"
                  >
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-medium">{n.title}</span>
                        {isUnread && (
                          <span className="size-1.5 rounded-full bg-primary" />
                        )}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {n.message}
                      </span>
                    </span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatRelative(n.timestamp)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )
      }
    </HeaderMenu>
  )
}

export default NotificationsMenu
