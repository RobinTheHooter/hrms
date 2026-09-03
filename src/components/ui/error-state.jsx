import { RefreshCw, TriangleAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function ErrorState({
  title = 'Something went wrong',
  description = "We couldn't load this right now. Please try again in a moment.",
  onRetry,
  retryLabel = 'Try again',
  icon: Icon = TriangleAlert,
  action,
}) {
  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-10" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      {(onRetry || action) && (
        <div className="flex items-center gap-2">
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="size-4" />
              {retryLabel}
            </Button>
          )}
          {action}
        </div>
      )}
    </div>
  )
}

export default ErrorState
