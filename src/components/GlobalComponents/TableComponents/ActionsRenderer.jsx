import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Centered row action buttons with fixed slots. Configure via
 * cellRendererParams:
 * - getActions(data) → array of:
 *     { icon, onClick, title?, danger?, disabled?, hidden?, className? }
 *   `icon` is a lucide component. Hidden entries render an empty spacer so the
 *   remaining icons stay aligned in the same columns across every row.
 */
export function ActionsRenderer(params) {
  const actions = params.getActions?.(params.data) ?? []
  if (actions.length === 0) return null

  return (
    <div className="flex w-full justify-center gap-1">
      {actions.map((a, i) => {
        if (a.hidden) {
          return <span key={i} className="size-9 shrink-0" aria-hidden />
        }
        const Icon = a.icon
        return (
          <Button
            key={i}
            variant="ghost"
            size="icon"
            className="cursor-pointer"
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
