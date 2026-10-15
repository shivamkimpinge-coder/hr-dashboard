import { useCallback, useEffect, useState } from 'react'
import { isManagerRole } from '../../../utils/roles'
import toast from 'react-hot-toast'
import Button from '../../../utils/Button/button'
import SectionTabs from '../../../utils/SectionTabs/sectionTabs'
import EmployeeSearchFilter from '../../../utils/EmployeeSearchFilter'
import useApi from '../../../hooks/useApi'
import LeaveDetails from '../leaveDetails'
import LeaveBalance from '../leaveBalance'
import TeamLeaveBalance from '../teamBalance'

import { LEAVE_STATUS, formatDateDisplay, getLeaveTabs, statusPillClass } from '../leaveFormConfig'

function LeaveList({ currentUser }) {
  const isManager = isManagerRole(currentUser)
  const { listEmployees, listLeaves, getMyLeaves, getMyLeaveBalance, approveLeave, rejectLeave, cancelLeave } = useApi()

  const [employees, setEmployees] = useState([])
  const [employeeFilter, setEmployeeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedLeave, setSelectedLeave] = useState(null)
  const [balance, setBalance] = useState(null)
  const [typeFilter, setTypeFilter] = useState('')
  // Approving, rejecting or cancelling a request changes how much leave is
  // left, so every balance view (this employee's cards and the team table)
  // needs to refetch after a decision — bumping this forces both.
  const [balanceVersion, setBalanceVersion] = useState(0)

  // Admin accounts carry no leave balance, so the panel is only fetched for
  // everyone else. A failure here just hides the panel; the list still loads.
  const isAdmin = currentUser?.role === 'Admin'
  useEffect(() => {
    if (isAdmin) return
    getMyLeaveBalance()
      .then((data) => setBalance(data.balance || null))
      .catch(() => setBalance(null))
  }, [isAdmin, getMyLeaveBalance, balanceVersion])

  useEffect(() => {
    if (!isManager) return
    listEmployees({ limit: 200 })
      .then((data) => setEmployees(data.employees || []))
      .catch(() => {})
  }, [isManager, listEmployees])

  const fetchLeaves = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = isManager
        ? await listLeaves({ employeeId: employeeFilter || undefined, status: statusFilter || undefined })
        : await getMyLeaves()
      const all = data.leaves || []
      setLeaves(isManager ? all : all.filter((leave) => !statusFilter || leave.status === statusFilter))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [isManager, employeeFilter, statusFilter, listLeaves, getMyLeaves])

  useEffect(() => {
    fetchLeaves()
  }, [fetchLeaves])

  const decide = async (leave, action, message) => {
    try {
      await action(leave._id)
      toast.success(message)
      fetchLeaves()
      setBalanceVersion((version) => version + 1)
      setSelectedLeave(null)
    } catch (err) {
      toast.error(err.message)
    }
  }

  // Clicking a balance card narrows the table to that leave type. The balance
  // only counts Approved leave, so the drilldown also switches to Approved —
  // otherwise a Pending or Rejected row of the same type sits next to the
  // Approved ones and the total no longer matches the card's "used" figure.
  const selectType = (type) => {
    setTypeFilter(type)
    setStatusFilter(type ? LEAVE_STATUS.APPROVED : '')
  }

  const visibleLeaves = typeFilter ? leaves.filter((leave) => leave.leaveType === typeFilter) : leaves

  return (
    <div className="panel detail-panel">
      <SectionTabs tabs={getLeaveTabs(currentUser)} />

      <div className="panel-heading">
        <div>
          <p className="eyebrow">Leave</p>
          <h3>{isManager ? 'Leave Requests' : 'My Leave Requests'}</h3>
          <p className="form-hint">
            {isManager
              ? 'Review, approve and reject time-off requests across the team.'
              : 'Track your requests and see how much leave you have left.'}
          </p>
        </div>
        {isManager ? null : (
          <div className="action-row">
            <Button variant="secondary" to="/dashboard/leave/apply">
              Apply Leave
            </Button>
          </div>
        )}
      </div>

      <div className="row g-3">
        {isManager ? (
          <EmployeeSearchFilter
            id="leave-employee-filter"
            employees={employees}
            value={employeeFilter}
            onChange={setEmployeeFilter}
          />
        ) : null}

        <div className="form-field filter-field">
          <label htmlFor="leave-status-filter">Filter by status</label>
          <select
            id="leave-status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">All statuses</option>
            {Object.values(LEAVE_STATUS).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <div className="feedback-banner feedback-banner-error">{error}</div> : null}

      <LeaveBalance balance={balance} activeType={typeFilter} onSelect={selectType} />

      <div className="panel-heading">
        <div>
          <p className="eyebrow">{statusFilter || 'All statuses'}</p>
          <h4>
            {visibleLeaves.length} request{visibleLeaves.length === 1 ? '' : 's'}
            {typeFilter ? ` · ${typeFilter}` : ''}
          </h4>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-dark table-hover align-middle mb-0">
          <thead>
            <tr>
              {isManager ? <th>Employee</th> : null}
              <th>Leave Type</th>
              <th>Period</th>
              <th>Days</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={isManager ? 6 : 5}>Loading leave requests...</td>
              </tr>
            ) : visibleLeaves.length === 0 ? (
              <tr>
                <td colSpan={isManager ? 6 : 5}>No leave requests found.</td>
              </tr>
            ) : (
              visibleLeaves.map((leave) => (
                <tr key={leave._id}>
                  {isManager ? (
                    <td>
                      {leave.employeeName} <span className="text-muted">({leave.employeeId})</span>
                    </td>
                  ) : null}
                  <td>
                    {leave.leaveType}
                    {leave.isHalfDay ? <span className="pill pill-muted"> Half day</span> : null}
                  </td>
                  <td>
                    {formatDateDisplay(leave.startDate)} – {formatDateDisplay(leave.endDate)}
                  </td>
                  <td>{leave.days}</td>
                  <td>
                    <span className={`pill ${statusPillClass(leave.status)}`}>{leave.status}</span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Button variant="view" onClick={() => setSelectedLeave(leave)}>
                        View
                      </Button>
                      {isManager && leave.status === LEAVE_STATUS.PENDING ? (
                        <>
                          <Button variant="approve" onClick={() => decide(leave, approveLeave, 'Leave approved.')}>
                            Approve
                          </Button>
                          <Button variant="reject" onClick={() => decide(leave, rejectLeave, 'Leave rejected.')}>
                            Reject
                          </Button>
                        </>
                      ) : null}
                      {!isManager && leave.status === LEAVE_STATUS.PENDING ? (
                        <Button variant="warn" onClick={() => decide(leave, cancelLeave, 'Leave cancelled.')}>
                          Cancel
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isManager ? <TeamLeaveBalance refreshSignal={balanceVersion} /> : null}

      <LeaveDetails leave={selectedLeave} onClose={() => setSelectedLeave(null)} currentUser={currentUser} />
    </div>
  )
}

export default LeaveList
