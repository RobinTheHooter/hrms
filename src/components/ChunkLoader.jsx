import { Spinner } from '@/components/ui/spinner'

/** Suspense fallback shown while a lazily-loaded page chunk is fetched. */
export function ChunkLoader() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <Spinner className="size-12" />
    </div>
  )
}

export default ChunkLoader
