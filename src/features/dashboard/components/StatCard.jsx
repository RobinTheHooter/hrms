import { Card, CardContent } from '@/components/ui/card'

const TONES = {
  orange: 'bg-primary/10 text-primary',
  blue: 'bg-blue-100 text-blue-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
}

export function StatCard({ icon: Icon, tone, label, value, onClick }) {
  return (
    <Card
      onClick={onClick}
      className={onClick ? 'cursor-pointer transition-colors hover:bg-muted/40' : undefined}
    >
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex size-11 items-center justify-center rounded-xl ${TONES[tone]}`}>
          <Icon className="size-5" />
        </div>
        <div>
          <div className="text-2xl font-semibold tracking-tight">{value}</div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  )
}
