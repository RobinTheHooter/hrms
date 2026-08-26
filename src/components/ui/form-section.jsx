import { cloneElement, isValidElement, useId } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function FormSection({ icon: Icon, title, children, className }) {
  return (
    <section className={className}>
      <div className="mb-3 flex items-center gap-2">
        {Icon && <Icon className="size-4 text-primary" />}
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2 md:grid-cols-3">
        {children}
      </div>
    </section>
  )
}

export function FieldRow({ label, description, error, children, className, span }) {
  const fieldId = useId()
  const msgId = `${fieldId}-msg`

  const control = isValidElement(children)
    ? cloneElement(children, {
        id: children.props.id ?? fieldId,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error || description ? msgId : undefined,
      })
    : children

  return (
    <div
      className={cn(
        'space-y-1.5',
        span === 'full' && 'sm:col-span-2 md:col-span-3',
        span === 'half' && 'md:col-span-2',
        className,
      )}
    >
      <Label htmlFor={fieldId}>{label}</Label>
      <div className="relative pb-5">
        {control}
        {error ? (
          <p id={msgId} className="absolute inset-x-0 bottom-0 truncate text-xs text-destructive">
            {error.message}
          </p>
        ) : (
          description && (
            <p id={msgId} className="absolute inset-x-0 bottom-0 truncate text-xs text-muted-foreground">
              {description}
            </p>
          )
        )}
      </div>
    </div>
  )
}
