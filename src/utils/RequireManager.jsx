import { Navigate } from 'react-router-dom'
import { isManagerRole } from './roles'

// Route guard for Admin/HR-only pages. The backend enforces this too — this
// just keeps a non-manager from landing on a page that would only 403.
function RequireManager({ currentUser, children }) {
  if (!isManagerRole(currentUser)) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

export default RequireManager
