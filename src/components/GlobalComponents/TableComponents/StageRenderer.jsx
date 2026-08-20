import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectEmpty,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/**
 * Candidate stage cell: an inline stage picker when the user can manage,
 * otherwise a read-only badge. Configure via cellRendererParams:
 * - canManage            → editable dropdown vs. badge
 * - stages               → [{ value, label }] options
 * - onStageChange(data, next)
 * - getVariant(value)    → badge variant
 */
export function StageRenderer(params) {
  const { value, data, canManage, stages = [], onStageChange, getVariant } = params

  if (!canManage) {
    return (
      <Badge variant={getVariant ? getVariant(value) : 'secondary'}>
        {stages.find((s) => s.value === value)?.label ?? value}
      </Badge>
    )
  }

  return (
    <Select value={value} onValueChange={(next) => onStageChange?.(data, next)}>
      <SelectTrigger className="h-8 w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {stages.length === 0 ? (
          <SelectEmpty>No stages found</SelectEmpty>
        ) : (
          stages.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}

export default StageRenderer
