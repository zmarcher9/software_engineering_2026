import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children, isAuthenticated, requireAdmin = false, user = null }) {
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  if (requireAdmin && !user?.is_admin) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute
