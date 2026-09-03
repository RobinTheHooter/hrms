import { cn } from '@/lib/utils'

export function EmptyState({ message, icon: Icon, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center',
        className,
      )}
    >
      {Icon && (
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="size-6" />
        </div>
      )}
      <p className="text-sm text-muted-foreground">{message}</p>
      {action}
    </div>
  )
}

export default EmptyState
