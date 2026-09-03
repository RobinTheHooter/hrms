import { Lock } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectEmpty,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DECISION_STAGES } from '@/features/candidates/constants'

export function StageRenderer(params) {
  const {
    value,
    data,
    canManage,
    canDecide = true,
    stages = [],
    onStageChange,
    getVariant,
  } = params

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
          stages.map((s) => {
            const locked =
              !canDecide && DECISION_STAGES.includes(s.value) && s.value !== value
            return (
              <SelectItem key={s.value} value={s.value} disabled={locked}>
                <span className="flex items-center gap-1.5">
                  {s.label}
                  {locked && <Lock className="size-3 text-muted-foreground" />}
                </span>
              </SelectItem>
            )
          })
        )}
      </SelectContent>
    </Select>
  )
}

export default StageRenderer
