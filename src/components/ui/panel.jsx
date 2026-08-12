import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * Section card with a titled header and a body that fills available height.
 * The body is a flex column, so a trailing element with `mt-auto` (e.g. a
 * primary action button) pins to the bottom and stays aligned across a row
 * of cards of differing content height.
 */
export function Panel({ title, action, children, className, bodyClass }) {
  return (
    <Card className={cn('flex h-full flex-col', className)}>
      <div className="flex items-center justify-between border-b px-5 py-3.5">
        <h3 className="font-semibold">{title}</h3>
        {action}
      </div>
      <div className={cn('flex flex-1 flex-col', bodyClass ?? 'p-5')}>
        {children}
      </div>
    </Card>
  )
}
