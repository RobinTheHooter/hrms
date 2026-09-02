import { RoutingOutlet } from '@/components/RoutingOutlet'

export function BlankLayout() {
  return (
    <div className="min-h-screen bg-background">
      <RoutingOutlet />
    </div>
  )
}
