import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
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
  pageSizeOptions = [20, 50, 100],
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const goto = (p) => {
    if (p < 1 || p > pages || p === page) return
    onPageChange?.(p)
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-3 border-t px-4 py-3 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <span>Rows per page</span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => onPageSizeChange?.(Number(v))}
        >
          <SelectTrigger className="h-8 w-[76px]">
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
        {from}–{to} of {total}
      </span>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => goto(1)}
          disabled={page <= 1 || isFetching}
          title="First page"
        >
          <ChevronsLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => goto(page - 1)}
          disabled={page <= 1 || isFetching}
          title="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="px-2 whitespace-nowrap tabular-nums">
          Page {page} of {pages || 1}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => goto(page + 1)}
          disabled={page >= pages || isFetching}
          title="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => goto(pages)}
          disabled={page >= pages || isFetching}
          title="Last page"
        >
          <ChevronsRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}

export default Pagination
