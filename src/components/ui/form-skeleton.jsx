import { Skeleton } from '@/components/ui/skeleton'

export function FormInputSkeleton({ length = 9 }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {Array.from({ length }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-3 w-2/5" />
          <Skeleton className="h-14 w-full rounded" />
        </div>
      ))}
    </div>
  )
}

export default FormInputSkeleton
