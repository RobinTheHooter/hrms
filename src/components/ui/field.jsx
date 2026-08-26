import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/**
 * Labeled form field with an optional validation error message.
 * `error` is a react-hook-form field error ({ message }).
 */
export function Field({ label, error, className, children }) {
  return (
    // `pb-5` permanently reserves the error line, so the message can be
    // rendered only when it exists (no extra node otherwise) and positioned
    // absolutely into that gap — no layout shift either way.
    <div className={cn('relative space-y-1 pb-5', className)}>
      <Label>{label}</Label>
      {children}
      {error && (
        <p className="absolute inset-x-0 bottom-0 truncate text-xs text-destructive">
          {error.message}
        </p>
      )}
    </div>
  )
}
