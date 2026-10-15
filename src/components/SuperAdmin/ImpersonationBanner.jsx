import { saveSession } from '../../hooks/useApi'
import useApi from '../../hooks/useApi'

const KEY = 'hrImpersonatorSession'

// Shown on the regular Admin/HR/Employee dashboard whenever the active
// session was reached via SuperAdmin's "impersonate" action (see
// SuperAdmin/index.jsx), so nobody mistakes a borrowed session for their own
// and there's always a one-click way back to the real SuperAdmin account.
function ImpersonationBanner({ currentUser }) {
  const { endImpersonation } = useApi()

  let impersonator
  try {
    impersonator = JSON.parse(localStorage.getItem(KEY) || 'null')
  } catch {
    impersonator = null
  }
  if (!impersonator?.token || !impersonator?.user) return null

  const returnToSuperAdmin = async () => {
    const logId = impersonator.logId
    localStorage.removeItem(KEY)
    // The session swap happens first: endImpersonation's backend route
    // requires the *SuperAdmin's* token (it checks the log's initiator
    // against whoever is calling), not the Admin token this banner is
    // currently running under, so the swap must land before that call.
    saveSession(impersonator.user, impersonator.token)

    if (logId) {
      try {
        await endImpersonation(logId)
      } catch {
        // Best-effort — a failed audit-log write must never block getting
        // back to the SuperAdmin dashboard.
      }
    }
    window.location.href = '/superadmin'
  }

  return (
    <div className="feedback-banner" style={{ margin: '12px 24px 0' }}>
      Viewing as {currentUser?.name} — signed in by Super Admin ({impersonator.user.name}).{' '}
      <button type="button" className="auth-text-btn" onClick={returnToSuperAdmin}>
        Return to Super Admin
      </button>
    </div>
  )
}

export default ImpersonationBanner
