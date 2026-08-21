import { Avatar } from '@/components/ui/avatar'

/**
 * Avatar + primary line + muted subtitle. Configure via cellRendererParams:
 * - getName(data)      → primary text (defaults to the cell value)
 * - getSubtitle(data)  → muted second line (optional)
 * - getSuffix(data)    → small inline suffix after the name, e.g. "(you)"
 * - avatar             → show avatar (default true)
 */
export function PersonRenderer(params) {
  const { data, value, getName, getSubtitle, getSuffix, avatar = true } = params
  const name = getName ? getName(data) : (value ?? '—')
  const subtitle = getSubtitle ? getSubtitle(data) : null
  const suffix = getSuffix ? getSuffix(data) : null

  return (
    <div className="flex w-full min-w-0 items-center gap-3">
      {avatar && <Avatar name={name || '—'} size="sm" />}
      <div className="min-w-0 leading-tight">
        <div className="truncate font-medium">
          {name || '—'}
          {suffix && (
            <span className="ml-2 text-xs text-muted-foreground">{suffix}</span>
          )}
        </div>
        {subtitle != null && (
          <div className="truncate text-xs text-muted-foreground">
            {subtitle || '—'}
          </div>
        )}
      </div>
    </div>
  )
}

export default PersonRenderer
