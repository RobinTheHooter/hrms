import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

function CardSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <Skeleton className="size-11 rounded-xl" />
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-4 w-24" />
      </CardContent>
    </Card>
  )
}

function PanelSkeleton({ className, lines = 4 }) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <div className="border-b px-5 py-3.5">
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="space-y-3 p-5">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </Card>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-56" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PanelSkeleton />
        <PanelSkeleton />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PanelSkeleton className="lg:col-span-2" lines={6} />
        <PanelSkeleton lines={6} />
      </div>
    </div>
  )
}
