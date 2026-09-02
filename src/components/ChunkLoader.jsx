import { Spinner } from '@/components/ui/spinner'

export function ChunkLoader() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <Spinner className="size-12" />
    </div>
  )
}

export default ChunkLoader
