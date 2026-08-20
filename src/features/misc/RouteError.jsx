import { AlertTriangle } from 'lucide-react'
import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

/**
 * Root errorElement. Catches render/loader errors (and failed lazy chunk
 * loads) anywhere in the tree and shows a recovery screen instead of a
 * blank page.
 */
export function RouteError() {
  const error = useRouteError()
  const status = isRouteErrorResponse(error) ? error.status : null

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="max-w-md text-center">
        <CardContent className="p-10">
          <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-7" />
          </div>
          <h2 className="text-xl font-semibold">
            {status ? `${status} — ` : ''}Something went wrong
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            An unexpected error occurred while loading this page. Try reloading,
            or head back home.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Reload
            </Button>
            <Button asChild>
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default RouteError
