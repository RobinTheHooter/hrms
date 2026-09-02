import { Outlet, useNavigation } from 'react-router-dom'

import { ChunkLoader } from '@/components/ChunkLoader'

export function RoutingOutlet() {
  const navigation = useNavigation()
  return navigation.state === 'loading' ? <ChunkLoader /> : <Outlet />
}

export default RoutingOutlet
