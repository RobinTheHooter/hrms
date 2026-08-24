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
        <nav className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <Link
            to="/"
            className="flex items-center rounded-md p-1 transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <Home className="size-3.5" />
          </Link>
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1
            return (
              <span key={crumb.label} className="flex items-center gap-1">
                <ChevronRight className="size-3.5 text-muted-foreground/40" />
                {crumb.to && !isLast ? (
                  <Link
                    to={crumb.to}
                    className="rounded-md px-1.5 py-0.5 font-medium transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={
                      isLast ? 'px-1.5 py-0.5 font-semibold text-foreground' : 'px-1.5'
                    }
                  >
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
