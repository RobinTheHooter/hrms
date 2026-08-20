import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'

import { ChunkLoader } from '@/components/ChunkLoader'

/** Full-screen layout with no app chrome — used for login and error pages. */
export function BlankLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<ChunkLoader />}>
        <Outlet />
      </Suspense>
    </div>
  )
}
