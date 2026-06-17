import { Navigate, useLocation } from 'react-router-dom'
import { isLoggedIn } from '../lib/session'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation()

  if (!isLoggedIn()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
