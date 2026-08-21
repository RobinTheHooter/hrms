import { CornerDownLeft, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { PERMISSIONS, can } from '@/features/auth/acl'
import { useCurrentUser } from '@/features/auth/hooks'
import { NAV_SECTIONS } from '@/config/nav'
import { cn } from '@/lib/utils'

// Flatten the nav config into a searchable list of pages the user can reach.
function usePages() {
  const { data: user } = useCurrentUser()
  return useMemo(() => {
    const pages = []
    for (const section of NAV_SECTIONS) {
      for (const item of section.items) {
        if (item.soon) continue
        if (item.permission && !can(user, item.permission)) continue
        pages.push({
          to: item.to,
          label: item.label,
          section: section.label,
          icon: item.icon,
        })
      }
    }
    return pages
  }, [user])
}

/**
 * Header page navigator: type to filter the app's pages and jump to one
 * (Enter selects the top match). Routes to pages rather than searching data.
 */
export function GlobalSearch() {
  const navigate = useNavigate()
  const pages = usePages()
  const [term, setTerm] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const results = useMemo(() => {
    const q = term.trim().toLowerCase()
    if (!q) return pages
    return pages.filter(
      (p) =>
        p.label.toLowerCase().includes(q) || p.section.toLowerCase().includes(q),
    )
  }, [term, pages])

  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const go = (to) => {
    setOpen(false)
    setTerm('')
    navigate(to)
  }

  return (
    <div className="relative hidden w-full max-w-xs md:block" ref={ref}>
      <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={term}
        onChange={(e) => {
          setTerm(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && results[0]) go(results[0].to)
        }}
        placeholder="Search menu…"
        className="h-9 w-full rounded-lg border bg-muted/40 pr-3 pl-9 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
      />

      {open && (
        <div className="absolute top-full left-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg">
          {results.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No pages found.</div>
          ) : (
            <ul className="max-h-[70vh] overflow-y-auto py-1">
              {results.map((p, i) => (
                <li key={p.to}>
                  <button
                    onClick={() => go(p.to)}
                    className={cn(
                      'flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted',
                    )}
                  >
                    <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <p.icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{p.label}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {p.section}
                      </span>
                    </span>
                    {i === 0 && term && (
                      <CornerDownLeft className="size-3.5 text-muted-foreground" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default GlobalSearch
