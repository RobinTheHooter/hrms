import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

/**
 * Header icon button that toggles a dropdown panel. Self-contained popover:
 * closes on outside-click or Escape. No extra dependency.
 *
 * Props:
 * - icon         lucide icon component for the trigger
 * - title        optional panel heading
 * - badge        show the small unread dot on the trigger
 * - panelWidth   Tailwind width class for the panel (default w-80)
 * - children     panel content, or a function ({ close }) => node
 */
export function HeaderMenu({ icon: Icon, title, badge = false, panelWidth = 'w-80', children }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const close = () => setOpen(false)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Icon className="size-[18px]" />
        {badge && (
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary ring-2 ring-card" />
        )}
      </button>

      {open && (
        <div
          className={cn(
            'absolute right-0 z-50 mt-2 overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg',
            panelWidth,
          )}
        >
          {title && (
            <div className="border-b px-4 py-2.5 text-sm font-semibold">{title}</div>
          )}
          {typeof children === 'function' ? children({ close }) : children}
        </div>
      )}
    </div>
  )
}

export default HeaderMenu
