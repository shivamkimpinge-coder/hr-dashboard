import { Navigate } from 'react-router-dom'
import { isManagerRole } from './roles'

function RequireManager({ currentUser, children }) {
  if (!isManagerRole(currentUser)) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

export default RequireManager
