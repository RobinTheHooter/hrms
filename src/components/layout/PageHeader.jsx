import { ChevronRight, Home } from 'lucide-react'

export function PageHeader({ title, breadcrumb = [], actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        <nav className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Home className="size-3.5" />
          {breadcrumb.map((crumb, i) => (
            <span key={crumb} className="flex items-center gap-1.5">
              <ChevronRight className="size-3.5" />
              <span
                className={
                  i === breadcrumb.length - 1 ? 'text-foreground' : undefined
                }
              >
                {crumb}
              </span>
            </span>
          ))}
        </nav>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
