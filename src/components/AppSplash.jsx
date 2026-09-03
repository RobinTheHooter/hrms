import { Sparkles } from 'lucide-react'

export function AppSplash() {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-background">
      <div className="flex animate-pulse items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Sparkles className="size-6" />
        </div>
        <span className="text-3xl font-bold tracking-tight">
          Smart<span className="text-primary">HR</span>
        </span>
      </div>
    </div>
  )
}

export default AppSplash
