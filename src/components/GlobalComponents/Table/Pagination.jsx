import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'

import { PAGE_SIZE_OPTIONS } from '@/components/GlobalComponents/Table/constants'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/**
 * Numbered-page pagination bar for server-side tables. Driven by the page's
 * pagination state and the backend's total/pages counts.
 *
 * Props: page, pageSize, total, pages, onPageChange, onPageSizeChange,
 * isFetching, pageSizeOptions
 */
export function Pagination({
  page,
  pageSize,
  total = 0,
  pages = 0,
  onPageChange,
  onPageSizeChange,
  isFetching = false,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const goto = (p) => {
    if (p < 1 || p > pages || p === page) return
    onPageChange?.(p)
  }

  const arrowBtn =
    'flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors ' +
    'hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40'

  return (
    <div className="flex flex-wrap items-center justify-end gap-6 border-t px-4 py-2.5 text-[13px] text-muted-foreground">
      <div className="flex items-center gap-2">
        <span>Page Size:</span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => onPageSizeChange?.(Number(v))}
        >
          <SelectTrigger className="h-8 w-[72px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <span className="tabular-nums">
        {from} to {to} of {total}
      </span>

      <div className="flex items-center gap-1">
        <button
          className={arrowBtn}
          onClick={() => goto(1)}
          disabled={page <= 1 || isFetching}
          title="First page"
        >
          <ChevronsLeft className="size-4" />
        </button>
        <button
          className={arrowBtn}
          onClick={() => goto(page - 1)}
          disabled={page <= 1 || isFetching}
          title="Previous page"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="px-3 whitespace-nowrap tabular-nums">
          Page {page} of {pages || 1}
        </span>
        <button
          className={arrowBtn}
          onClick={() => goto(page + 1)}
          disabled={page >= pages || isFetching}
          title="Next page"
        >
          <ChevronRight className="size-4" />
        </button>
        <button
          className={arrowBtn}
          onClick={() => goto(pages)}
          disabled={page >= pages || isFetching}
          title="Last page"
        >
          <ChevronsRight className="size-4" />
        </button>
      </div>
    </div>
  )
}

export default Pagination
