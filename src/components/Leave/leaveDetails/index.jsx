import { useEffect, useState } from 'react'
import Button from '../../../utils/Button/button'
import useApi from '../../../hooks/useApi'
import { isManagerRole } from '../../../utils/roles'
import { formatDateDisplay, statusPillClass } from '../leaveFormConfig'

const dayWord = (n) => `${n} day${n === 1 ? '' : 's'}`

function LeaveDetails({ leave, onClose, currentUser }) {
  const { getEmployeeLeaveBalance } = useApi()
  const isManager = isManagerRole(currentUser)

  const [balance, setBalance] = useState(null)
  const [balanceError, setBalanceError] = useState('')

  // Admin and HR see how much the applicant has left before they decide. The
  // request is keyed on the leave so reopening a different row refetches.
  const employeeId = leave?.employeeId
  useEffect(() => {
    if (!isManager || !employeeId) {
      setBalance(null)
      return
    }
    setBalance(null)
    setBalanceError('')
    getEmployeeLeaveBalance(employeeId)
      .then((data) => setBalance(data.balance || null))
      .catch((err) => setBalanceError(err.message || 'Could not load leave balance.'))
  }, [isManager, employeeId, getEmployeeLeaveBalance])

  if (!leave) return null

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Leave</p>
            <h3>Leave Details</h3>
          </div>
          <Button variant="close" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>

        <div className="payslip-content">
          <div className="payslip-header">
            <div>
              <h4>{leave.employeeName}</h4>
              <p>
                {leave.employeeId}
                {leave.designation ? ` • ${leave.designation}` : ''}
                {leave.department ? ` • ${leave.department}` : ''}
              </p>
            </div>
            <div className="payslip-meta">
              <p>
                <strong>Status:</strong>{' '}
                <span className={`pill ${statusPillClass(leave.status)}`}>{leave.status}</span>
              </p>
              <p>
                <strong>Applied On:</strong> {formatDateDisplay(leave.appliedOn)}
              </p>
              {leave.decidedOn ? (
                <p>
                  <strong>Decided On:</strong> {formatDateDisplay(leave.decidedOn)}
                </p>
              ) : null}
            </div>
          </div>

          <div className="detail-grid">
            <div className="detail-card">
              <p className="eyebrow">Leave Period</p>
              <p>
                <strong>Type:</strong> {leave.leaveType}
                {leave.isHalfDay ? ' (Half day)' : ''}
              </p>
              <p>
                <strong>From:</strong> {formatDateDisplay(leave.startDate)}
              </p>
              <p>
                <strong>To:</strong> {formatDateDisplay(leave.endDate)}
              </p>
              <p>
                <strong>Duration:</strong> {leave.days} day{leave.days === 1 ? '' : 's'}
              </p>
              {leave.status === 'Approved' && leave.lopDays > 0 ? (
                <p>
                  <strong>LOP:</strong> {dayWord(leave.lopDays)} (Paid: {dayWord(leave.paidDays ?? 0)})
                </p>
              ) : null}
            </div>
            <div className="detail-card">
              <p className="eyebrow">Reason</p>
              <p>{leave.reason}</p>
            </div>
          </div>

          {isManager ? (
            <div className="leave-balance-summary">
              <p className="eyebrow">Leave balance</p>
              <h4>{leave.employeeName}'s remaining leave</h4>

              {balanceError ? (
                <p className="form-hint">{balanceError}</p>
              ) : !balance ? (
                <p className="form-hint">Loading balance...</p>
              ) : (
                <div className="leave-balance-list">
                  {Object.entries(balance).map(([leaveType, info]) => {
                    const isThisType = leaveType === leave.leaveType
                    const isCount = info.unit === 'count'
                    const out = !info.unlimited && info.remaining <= 0
                    return (
                      <div
                        className={`leave-balance-line${isThisType ? ' is-current' : ''}`}
                        key={leaveType}
                      >
                        <span className="leave-balance-line-type">
                          {leaveType}
                          {isThisType ? <span className="pill pill-muted">this request</span> : null}
                        </span>
                        <span className={`pill ${out ? 'pill-danger' : 'pill-success'}`}>
                          {info.unlimited
                            ? 'No limit'
                            : isCount
                              ? `${info.remaining} left`
                              : `${dayWord(info.remaining)} left`}
                        </span>
                        <span className="form-hint">
                          {info.unlimited
                            ? 'Not counted against a balance'
                            : `Used ${info.used}${isCount ? '' : 'd'} · Pending ${info.pending}${isCount ? '' : 'd'}${
                                info.lop > 0 ? ` · LOP ${dayWord(info.lop)}` : ''
                              }`}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default LeaveDetails
