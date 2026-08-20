import { Badge } from '@/components/ui/badge'

const scoreVariant = (s) => (s >= 80 ? 'success' : s >= 60 ? 'warning' : 'destructive')

/** AI screening score as a coloured badge; muted dash when not scored yet. */
export function AiScoreRenderer(params) {
  const s = params.value
  if (s == null) {
    return <span className="text-xs text-muted-foreground">—</span>
  }
  return <Badge variant={scoreVariant(s)}>{s}</Badge>
}

export default AiScoreRenderer
