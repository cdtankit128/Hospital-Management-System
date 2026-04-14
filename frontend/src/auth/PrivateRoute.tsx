import { Navigate } from 'react-router-dom'
import { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: string
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('role')

  // No token = not authenticated
  if (!token) {
    return <Navigate to="/login" replace />
  }

  // Token exists but role doesn't match (if required)
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
