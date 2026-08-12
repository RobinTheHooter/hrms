import { Rocket } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function ComingSoonPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-md text-center">
        <CardContent className="p-10">
          <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Rocket className="size-7" />
          </div>
          <h2 className="text-xl font-semibold">Coming soon</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This module is part of the SmartHR layout but isn't built yet. The
            Dashboard and Employees sections are fully functional.
          </p>
          <Button asChild className="mt-6">
            <Link to="/">Back to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
