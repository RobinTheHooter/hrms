import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

export function Spinner({ className }) {
  return <Loader2 className={cn('size-8 animate-spin text-primary', className)} />
}

/** Centered spinner for full-panel loading states. */
export function LoadingBlock({ className }) {
  return (
    <div className={cn('flex items-center justify-center py-16', className)}>
      <Spinner className="size-20" />
    </div>
  )
}
