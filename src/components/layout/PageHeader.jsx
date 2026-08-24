import { ChevronRight, Home } from 'lucide-react'
import { Link } from 'react-router-dom'

/**
 * Page title + breadcrumb + actions.
 *
 * `breadcrumb` items may be plain strings (non-clickable) or objects
 * `{ label, to }` to make a crumb a link. The last crumb always renders as the
 * current page (not a link). The Home icon links to "/".
 *
 * `back` renders an optional leading control to the left of the title.
 */
export function PageHeader({ title, breadcrumb = [], actions, back }) {
  const crumbs = breadcrumb.map((c) => (typeof c === 'string' ? { label: c } : c))

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {back}
        <div>
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        <nav className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/" className="flex items-center transition-colors hover:text-foreground">
            <Home className="size-3.5" />
          </Link>
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1
            return (
              <span key={crumb.label} className="flex items-center gap-1.5">
                <ChevronRight className="size-3.5" />
                {crumb.to && !isLast ? (
                  <Link
                    to={crumb.to}
                    className="transition-colors hover:text-foreground hover:underline"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={isLast ? 'text-foreground' : undefined}>
                    {crumb.label}
                  </span>
                )}
              </span>
            )
          })}
        </nav>
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
