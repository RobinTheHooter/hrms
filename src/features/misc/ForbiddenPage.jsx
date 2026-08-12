import { ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useCurrentUser } from '@/features/auth/hooks'
import { landingPathFor } from '@/features/auth/acl'

export function ForbiddenPage() {
  const { data: user } = useCurrentUser()
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="max-w-md text-center">
        <CardContent className="p-10">
          <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="size-7" />
          </div>
          <h2 className="text-xl font-semibold">403 — Not authorized</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You don't have permission to view this page. If you think this is a
            mistake, contact your administrator.
          </p>
          <Button asChild className="mt-6">
            <Link to={landingPathFor(user)}>Back to my dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
