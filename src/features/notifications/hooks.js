import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { getNotifications } from '@/features/notifications/api'
import { notificationKeys } from '@/features/notifications/keys'

const SEEN_KEY = 'notifications:lastSeen'

// Backend timestamps are naive UTC; treat a tz-less string as UTC so the
// unread comparison and relative-time formatting line up with Date.now().
export function toMs(ts) {
  if (!ts) return 0
  const hasTz = /Z|[+-]\d\d:?\d\d$/.test(ts)
  return Date.parse(hasTz ? ts : `${ts}Z`)
}

export function formatRelative(ts) {
  const diff = Date.now() - toMs(ts)
  if (diff < 0) return 'just now'
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return `${Math.floor(d / 7)}w ago`
}

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: getNotifications,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  })
}

/** Client-side unread tracking via a "last seen" timestamp in localStorage. */
export function useNotificationsSeen() {
  const [lastSeen, setLastSeen] = useState(() => {
    const stored = Number(localStorage.getItem(SEEN_KEY))
    return Number.isFinite(stored) ? stored : 0
  })

  const markSeen = () => {
    const now = Date.now()
    localStorage.setItem(SEEN_KEY, String(now))
    setLastSeen(now)
  }

  return { lastSeen, markSeen }
}
