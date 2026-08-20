import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Right-aligned row action buttons. Configure via cellRendererParams:
 * - getActions(data) → array of:
 *     { icon, onClick, title?, danger?, disabled?, hidden?, className? }
 *   `icon` is a lucide component. Hidden entries are skipped.
 */
export function ActionsRenderer(params) {
  const actions = (params.getActions?.(params.data) ?? []).filter((a) => !a.hidden)
  if (actions.length === 0) return null

  return (
    <div className="flex w-full justify-end gap-1">
      {actions.map((a, i) => {
        const Icon = a.icon
        return (
          <Button
            key={i}
            variant="ghost"
            size="icon"
            title={a.title}
            disabled={a.disabled}
            onClick={() => a.onClick?.(params.data)}
          >
            <Icon className={cn('size-4', a.danger && 'text-destructive', a.className)} />
          </Button>
        )
      })}
    </div>
  )
}

export default ActionsRenderer
