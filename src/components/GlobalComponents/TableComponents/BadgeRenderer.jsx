import { Badge } from '@/components/ui/badge'

/**
 * Generic badge cell. Configure via cellRendererParams:
 * - getVariant(value, data) → badge variant (or omit for "secondary")
 * - getLabel(value, data)   → display text (defaults to the raw value)
 * Renders a muted dash when the value is empty.
 */
export function BadgeRenderer(params) {
  const { value, data, getVariant, getLabel } = params
  if (value == null || value === '') {
    return <span className="text-xs text-muted-foreground">—</span>
  }
  const variant = getVariant ? getVariant(value, data) : 'secondary'
  const label = getLabel ? getLabel(value, data) : value
  return <Badge variant={variant}>{label}</Badge>
}

export default BadgeRenderer
