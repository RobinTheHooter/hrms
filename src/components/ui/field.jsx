import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/**
 * Labeled form field with an optional validation error message.
 * `error` is a react-hook-form field error ({ message }).
 */
export function Field({ label, error, className, children }) {
  return (
    <div className={cn('space-y-1', className)}>
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  )
}
