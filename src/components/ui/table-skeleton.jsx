import { Skeleton } from '@/components/ui/skeleton'

export function TableSkeleton({ rows = 6, columns = 6, marginTop = false }) {
  return (
    <div className={marginTop ? 'mt-5 w-full' : 'w-full'}>
      <div className="flex justify-between gap-6 rounded-t-md bg-muted/40 px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-28" />
        ))}
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-6 px-4 py-4">
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton key={c} className="h-4 w-full max-w-[160px]" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default TableSkeleton
