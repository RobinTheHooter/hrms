import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

export function Spinner({ className }) {
  return <Loader2 className={cn('size-8 animate-spin text-primary', className)} />
}
