import { Link } from 'react-router-dom'

import { Avatar } from '@/components/ui/avatar'

/**
 * Avatar + primary line + muted subtitle. Configure via cellRendererParams:
 * - getName(data)      → primary text (defaults to the cell value)
 * - getSubtitle(data)  → muted second line (optional)
 * - getSuffix(data)    → small inline suffix after the name, e.g. "(you)"
 * - getHref(data)      → makes the name a link to a detail route
 * - avatar             → show avatar (default true)
 */
export function PersonRenderer(params) {
  const { data, value, getName, getSubtitle, getSuffix, getHref, avatar = true } = params
  const name = getName ? getName(data) : (value ?? '—')
  const subtitle = getSubtitle ? getSubtitle(data) : null
  const suffix = getSuffix ? getSuffix(data) : null
  const href = getHref ? getHref(data) : null

  const nameNode = href ? (
    <Link to={href} className="truncate font-medium text-foreground hover:text-primary hover:underline">
      {name || '—'}
    </Link>
  ) : (
    <span className="truncate font-medium">{name || '—'}</span>
  )

  return (
    <div className="flex w-full min-w-0 items-center gap-3">
      {avatar && <Avatar name={name || '—'} size="sm" />}
      <div className="min-w-0 leading-tight">
        <div className="flex items-center">
          {nameNode}
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
