import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Button from '../../utils/Button/button'
import EmployeeHeroCard from './EmployeeHeroCard'
import useApi from '../../hooks/useApi'

function EmployeeDetailModal({ employee, onClose }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Super Admin</p>
            <h3>Employee Details</h3>
          </div>
          <Button variant="close" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>
        <EmployeeHeroCard employee={employee} />
      </div>
    </div>
  )
}

// Full-page version of the company-detail view (was a small modal) — shows
// the company's own info/headline numbers plus its complete roster
// (Admin, HR and Employee alike, not just Admins). "View" on any row opens
// that person's full details in a modal right here, without navigating away
// from the roster (employeeDetail.jsx's full page still exists for a direct
// link, just isn't what these buttons trigger anymore).
function SuperAdminCompanyDetail() {
  const { companyId } = useParams()
  const { getCompanyDetail } = useApi()

  const [detail, setDetail] = useState(null)
  const [error, setError] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState(null)

  useEffect(() => {
    getCompanyDetail(companyId)
      .then(setDetail)
      .catch((err) => setError(err.message || 'Failed to load company.'))
  }, [companyId, getCompanyDetail])

  return (
    <div className="emp-details-page">
      <nav className="breadcrumb">
        <Link to="/superadmin">Companies</Link>
        <span aria-hidden="true">›</span>
        <span>{detail?.company?.name || 'Company Details'}</span>
      </nav>

      <div className="emp-details-head">
        <div>
          <h1>{detail?.company?.name || 'Company Details'}</h1>
          <p>Company info, headline numbers and the full employee roster</p>
        </div>
        <Button variant="secondary" to="/superadmin">
          ← Back to Companies
        </Button>
      </div>

      {error ? <div className="feedback-banner feedback-banner-error">{error}</div> : null}
      {!detail && !error ? (
        <div className="panel">
          <p>Loading company information...</p>
        </div>
      ) : null}

      {detail ? (
        <>
          <div className="detail-grid">
            <div className="detail-card">
              <p className="eyebrow">Company</p>
              <p><strong>Code:</strong> {detail.company.code}</p>
              <p><strong>Status:</strong> {detail.company.status}</p>
            </div>
            <div className="detail-card">
              <p className="eyebrow">Headline numbers</p>
              <p><strong>Users:</strong> {detail.stats.totalUsers} ({detail.stats.activeUsers} active, {detail.stats.pendingUsers} pending)</p>
              <p><strong>Leave requests:</strong> {detail.stats.leaveCount} ({detail.stats.pendingLeaveCount} pending)</p>
              <p><strong>Attendance records:</strong> {detail.stats.attendanceCount}</p>
              <p><strong>Payslips generated:</strong> {detail.stats.payrollCount}</p>
            </div>
          </div>

          <p className="eyebrow" style={{ marginTop: 16 }}>Admin{detail.admins.length === 1 ? '' : 's'}</p>
          {detail.admins.length === 0 ? (
            <p className="form-hint">No admin assigned yet.</p>
          ) : (
            <div className="row g-3">
              {detail.admins.map((a) => (
                <div className="col-lg-6" key={a._id}>
                  <div className="detail-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span className="header-user-avatar" aria-hidden="true">
                        {a.name?.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?'}
                      </span>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600 }}>{a.name}</p>
                        <p className="form-hint" style={{ margin: 0 }}>{a.email}</p>
                        <p className="form-hint" style={{ margin: 0 }}>
                          {a.employeeId || '—'} · <span className={`pill ${a.status === 'Active' ? 'pill-success' : 'pill-muted'}`}>{a.status}</span>
                        </p>
                      </div>
                    </div>
                    <Button variant="view" onClick={() => setSelectedEmployee(a)}>
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="panel-heading" style={{ marginTop: 16 }}>
            <div>
              <p className="eyebrow">Roster</p>
              <h3>{detail.employees.length} {detail.employees.length === 1 ? 'person' : 'people'}</h3>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {detail.employees.length === 0 ? (
                  <tr>
                    <td colSpan={7}>No one has joined this company yet.</td>
                  </tr>
                ) : (
                  detail.employees.map((e) => (
                    <tr key={e._id}>
                      <td>{e.employeeId || '—'}</td>
                      <td>{e.name}</td>
                      <td>{e.email}</td>
                      <td>{e.department || '—'}</td>
                      <td>{e.role}</td>
                      <td>
                        <span className={`pill ${e.status === 'Active' ? 'pill-success' : 'pill-muted'}`}>
                          {e.status}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <Button variant="view" onClick={() => setSelectedEmployee(e)}>
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {selectedEmployee ? (
        <EmployeeDetailModal employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />
      ) : null}
    </div>
  )
}

export default SuperAdminCompanyDetail
