import { Outlet } from 'react-router-dom'

/** Full-screen layout with no app chrome — used for login and error pages. */
export function BlankLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  )
}
