import { Spinner } from '@/components/ui/spinner'

export function ChunkLoader() {
  return (
    <div className="flex min-h-[calc(100dvh-8rem)] w-full items-center justify-center">
      <Spinner className="size-16" />
    </div>
  )
}

export default ChunkLoader
