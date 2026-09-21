import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Spinner from './Spinner'

export function ProtectedRoute() {
  const { isAuthenticated, bootstrapping } = useAuth()
  const location = useLocation()

  if (bootstrapping) return <Spinner />
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}

export function LandlordRoute() {
  const { isAuthenticated, isLandlord, bootstrapping } = useAuth()
  const location = useLocation()

  if (bootstrapping) return <Spinner />
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  if (!isLandlord) return <Navigate to="/profile" replace />
  return <Outlet />
}
