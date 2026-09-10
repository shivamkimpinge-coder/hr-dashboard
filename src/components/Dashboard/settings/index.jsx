import Button from '../../../utils/Button/button'
import { isManagerRole } from '../../../utils/roles'

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
