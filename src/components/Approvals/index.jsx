import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../../utils/Button/button'
import useApi from '../../hooks/useApi'
import { isAdminRole } from '../../utils/roles'
import { IconUserCheck, IconUsers } from '../Layout/Sidebar/icons'

const WORK_TYPES = ['Full Time', 'Part Time', 'Contract', 'Intern']

const formatDate = (value) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

const emptyForm = {
  role: 'Employee',
  department: '',
  designation: '',
  workType: 'Full Time',
  reportingManager: '',
  salary: '',
  joiningDate: '',
}

function PendingApprovals({ currentUser }) {
  const { listPendingApprovals, approveSignup, rejectSignup } = useApi()

  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reviewUser, setReviewUser] = useState(null)
  const [rejectUser, setRejectUser] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [busyId, setBusyId] = useState(null)

  const canGrantPrivilegedRole = isAdminRole(currentUser)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listPendingApprovals()
      setPending(data.pending || [])
    } catch (err) {
      setError(err.message || 'Failed to load pending signups.')
    } finally {
      setLoading(false)
    }
  }, [listPendingApprovals])

  useEffect(() => {
    refresh()
  }, [refresh])

  const roleOptions = useMemo(
    () => (canGrantPrivilegedRole ? ['Employee', 'HR', 'Admin'] : ['Employee']),
    [canGrantPrivilegedRole]
  )

  const openReview = (user) => {
    setReviewUser(user)
    setForm({ ...emptyForm, joiningDate: new Date().toISOString().slice(0, 10) })
  }

  const closeReview = useCallback(() => {
    setReviewUser(null)
    setForm(emptyForm)
  }, [])

  const closeReject = useCallback(() => {
    setRejectUser(null)
    setRejectReason('')
  }, [])

  // Rejecting from inside the review modal swaps to the confirm step rather than
  // stacking two dialogs on top of each other.
  const openReject = (user) => {
    setReviewUser(null)
    setRejectUser(user)
    setRejectReason('')
  }

  const isBusy = busyId !== null

  useEffect(() => {
    if (!reviewUser && !rejectUser) return undefined

    const onKeyDown = (event) => {
      if (event.key !== 'Escape' || isBusy) return
      if (rejectUser) closeReject()
      else closeReview()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [reviewUser, rejectUser, isBusy, closeReview, closeReject])

  const setField = (key) => (event) => {
    const { value } = event.target
    setForm((previous) => ({ ...previous, [key]: value }))
  }

  const handleApprove = async (event) => {
    event.preventDefault()
    if (!reviewUser) return

    setBusyId(reviewUser._id)
    try {
      const payload = {
        role: form.role,
        department: form.department.trim(),
        designation: form.designation.trim(),
        workType: form.workType,
        reportingManager: form.reportingManager.trim(),
        joiningDate: form.joiningDate || undefined,
      }
      if (form.salary !== '') payload.salary = Number(form.salary)

      const data = await approveSignup(reviewUser._id, payload)
      toast.success(`${reviewUser.name} approved as ${data.user?.employeeId || 'staff'}.`)
      setPending((previous) => previous.filter((item) => item._id !== reviewUser._id))
      closeReview()
    } catch (err) {
      toast.error(err.message || 'Failed to approve this signup.')
    } finally {
      setBusyId(null)
    }
  }

  const handleReject = async (event) => {
    event.preventDefault()
    if (!rejectUser) return

    setBusyId(rejectUser._id)
    try {
      await rejectSignup(rejectUser._id, { reason: rejectReason.trim() })
      toast.success(`Signup request from ${rejectUser.name} was rejected.`)
      setPending((previous) => previous.filter((item) => item._id !== rejectUser._id))
      closeReject()
    } catch (err) {
      toast.error(err.message || 'Failed to reject this signup.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="panel detail-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Access Control</p>
          <h3>Pending Approvals</h3>
          <p className="form-hint">
            New signups cannot sign in until an Admin or HR approves them. Approving assigns an employee ID.
          </p>
        </div>
        <div className="action-row">
          <Button variant="secondary" onClick={refresh} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {error ? <div className="feedback-banner feedback-banner-error">{error}</div> : null}

      <section className="stats-grid stats-grid--flow">
        <article className="stat-card stat-card--amber">
          <div className="stat-card-head">
            <span className="stat-card-icon">
              <IconUsers />
            </span>
            <p>Awaiting Review</p>
          </div>
          <h2>{pending.length}</h2>
        </article>
      </section>

      {loading ? (
        <p className="form-hint">Loading pending signups...</p>
      ) : pending.length === 0 ? (
        <div className="empty-state">
          <span className="perf-empty-icon">
            <IconUserCheck />
          </span>
          <p>No signups waiting — everyone who has signed up has been reviewed.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle mb-0">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Signed Up</th>
                <th scope="col" className="text-end">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {pending.map((user) => {
                const rowBusy = busyId === user._id

                return (
                  <tr key={user._id}>
                    <td>
                      <span className="activity-row-name">{user.name}</span>
                    </td>
                    <td>{user.email}</td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td className="text-end">
                      <div className="action-row">
                        <Button variant="approve" onClick={() => openReview(user)} disabled={rowBusy}>
                          Approve
                        </Button>
                        <Button variant="reject" onClick={() => openReject(user)} disabled={rowBusy}>
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {reviewUser ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="approve-modal-title">
          <div className="modal-card">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Approve signup</p>
                <h3 id="approve-modal-title">{reviewUser.name}</h3>
                <p className="form-hint">{reviewUser.email}</p>
              </div>
              <Button variant="secondary" onClick={closeReview} disabled={isBusy}>
                Cancel
              </Button>
            </div>

            <form className="employee-form" onSubmit={handleApprove}>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="approve-role">Role</label>
                  <select id="approve-role" value={form.role} onChange={setField('role')}>
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  {canGrantPrivilegedRole ? null : (
                    <span className="form-hint">Only an Admin can grant Admin or HR.</span>
                  )}
                </div>

                <div className="form-field">
                  <label htmlFor="approve-department">Department</label>
                  <input
                    id="approve-department"
                    value={form.department}
                    onChange={setField('department')}
                    placeholder="Engineering"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="approve-designation">Designation</label>
                  <input
                    id="approve-designation"
                    value={form.designation}
                    onChange={setField('designation')}
                    placeholder="Software Engineer"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="approve-workType">Work Type</label>
                  <select id="approve-workType" value={form.workType} onChange={setField('workType')}>
                    {WORK_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="approve-manager">Reporting Manager</label>
                  <input
                    id="approve-manager"
                    value={form.reportingManager}
                    onChange={setField('reportingManager')}
                    placeholder="Optional"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="approve-salary">Monthly Salary</label>
                  <input
                    id="approve-salary"
                    type="number"
                    min="0"
                    value={form.salary}
                    onChange={setField('salary')}
                    placeholder="0"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="approve-joining">Joining Date</label>
                  <input
                    id="approve-joining"
                    type="date"
                    value={form.joiningDate}
                    onChange={setField('joiningDate')}
                  />
                </div>
              </div>

              <div className="action-row">
                <Button type="submit" disabled={isBusy}>
                  {isBusy ? 'Approving...' : 'Approve'}
                </Button>
                <Button type="reject" onClick={() => openReject(reviewUser)} disabled={isBusy}>
                  Reject
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {rejectUser ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="reject-modal-title">
          <div className="modal-card confirm-card">
            <h3 id="reject-modal-title">Reject signup request?</h3>
            <p>
              {rejectUser.name} ({rejectUser.email}) will not be able to sign in. They are told the reason below.
            </p>

            <form onSubmit={handleReject}>
              <div className="form-field">
                <label htmlFor="reject-reason">Reason (optional)</label>
                <textarea
                  id="reject-reason"
                  rows="3"
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  placeholder="Shared with the applicant in their notification"
                />
              </div>

              <div className="action-row">
                <Button variant="secondary" onClick={closeReject} disabled={isBusy}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isBusy}>
                  {isBusy ? 'Rejecting...' : 'Confirm Reject'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default PendingApprovals
