import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../../../utils/Button/button'
import useApi from '../../../hooks/useApi'
import { isManagerRole } from '../../../utils/roles'

function CompanyCodeCard() {
  const { getMyCompany } = useApi()
  const [company, setCompany] = useState(null)

  useEffect(() => {
    getMyCompany()
      .then((data) => setCompany(data.company || null))
      .catch(() => setCompany(null))
  }, [getMyCompany])

  const copyCode = async () => {
    if (!company?.code) return
    try {
      await navigator.clipboard.writeText(company.code)
      toast.success('Company code copied.')
    } catch {
      toast.error('Could not copy the code — copy it manually.')
    }
  }

  return (
    <div className="col-lg-4">
      <div className="overview-card">
        <h4>Company code</h4>
        <p>Share this with new hires so they can request to join {company?.name || 'your company'} at signup.</p>
        {company ? (
          <div className="profile-company-code-box">
            <span className="profile-company-code-value">{company.code}</span>
            <button type="button" className="profile-company-code-copy" onClick={copyCode}>
              ⧉ Copy
            </button>
          </div>
        ) : (
          <p className="form-hint">Loading...</p>
        )}
      </div>
    </div>
  )
}

function Settings({ currentUser }) {
  const isManager = isManagerRole(currentUser)

  return (
    <section className="row g-3">
      <div className="col-lg-12">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Preferences</p>
              <h3>Settings</h3>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-lg-4">
              <div className="overview-card">
                <h4>Account details</h4>
                <p>Update your name, email, and profile photo.</p>
                <div className="action-row">
                  <Button to="/dashboard/profile">Go to Profile</Button>
                </div>
              </div>
            </div>

            {isManager ? (
              <div className="col-lg-4">
                <div className="overview-card">
                  <h4>Salary structure</h4>
                  <p>Manage pay components used when generating payroll.</p>
                  <div className="action-row">
                    <Button variant="secondary" to="/dashboard/payroll/structure">
                      Manage
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}

            {isManager ? <CompanyCodeCard /> : null}

            <div className="col-lg-4">
              <div className="overview-card">
                <h4>More preferences</h4>
                <p>Additional workspace settings are on the way.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Settings
