import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../../utils/Button/button'
import useApi from '../../hooks/useApi'
import { IconUserCheck, IconUsers } from '../Layout/Sidebar/icons'

const formatDate = (value) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

function PendingApprovals() {
  const { listPendingApprovals, approveSignup, rejectSignup } = useApi()

  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rejectUser, setRejectUser] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [busyId, setBusyId] = useState(null)

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

  const closeReject = useCallback(() => {
    setRejectUser(null)
    setRejectReason('')
  }, [])

  const openReject = (user) => {
    setRejectUser(user)
    setRejectReason('')
  }

  const isBusy = busyId !== null

  useEffect(() => {
    if (!rejectUser) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !isBusy) closeReject()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [rejectUser, isBusy, closeReject])

  // Approving is a single click: the server activates the account and assigns
  // the employee ID. Department, salary and the rest are filled in afterwards
  // from the employee record, so there is nothing to collect here first.
  const handleApprove = async (user) => {
    setBusyId(user._id)
    try {
      const data = await approveSignup(user._id, {})
      toast.success(`${user.name} approved as ${data.user?.employeeId || 'staff'}.`)
      setPending((previous) => previous.filter((item) => item._id !== user._id))
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
                        <Button variant="approve" onClick={() => handleApprove(user)} disabled={rowBusy}>
                          {rowBusy ? 'Approving...' : 'Approve'}
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
