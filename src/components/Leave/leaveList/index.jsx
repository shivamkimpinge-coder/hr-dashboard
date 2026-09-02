import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../../../utils/Button/button'
import SectionTabs from '../../../utils/SectionTabs/sectionTabs'
import useApi from '../../../hooks/useApi'
import LeaveDetails from '../leaveDetails'

import { LEAVE_STATUS, formatDateDisplay, statusPillClass } from '../leaveFormConfig'

function LeaveList({ currentUser }) {
  const isAdmin = currentUser?.role === 'Admin'
  const { listEmployees, listLeaves, getMyLeaves, approveLeave, rejectLeave, cancelLeave } = useApi()

  const [employees, setEmployees] = useState([])
  const [employeeFilter, setEmployeeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedLeave, setSelectedLeave] = useState(null)

  useEffect(() => {
    if (!isAdmin) return
    listEmployees({ limit: 200 })
      .then((data) => setEmployees(data.employees || []))
      .catch(() => {})
  }, [isAdmin, listEmployees])

  const fetchLeaves = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = isAdmin
        ? await listLeaves({ employeeId: employeeFilter || undefined, status: statusFilter || undefined })
        : await getMyLeaves()
      const all = data.leaves || []
      setLeaves(isAdmin ? all : all.filter((leave) => !statusFilter || leave.status === statusFilter))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [isAdmin, employeeFilter, statusFilter, listLeaves, getMyLeaves])

  useEffect(() => {
    fetchLeaves()
  }, [fetchLeaves])

  const decide = async (leave, action, message) => {
    try {
      await action(leave._id)
      toast.success(message)
      fetchLeaves()
      setSelectedLeave(null)
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="panel detail-panel">
      <SectionTabs
        tabs={[
          { label: 'My Requests', to: '/dashboard/leave', end: true },
          { label: 'Apply Leave', to: '/dashboard/leave/apply' },
        ]}
      />

      <div className="panel-heading">
        <div>
          <p className="eyebrow">Leave</p>
          <h3>{isAdmin ? 'Leave Requests' : 'My Leave Requests'}</h3>
        </div>
      </div>

      <div className="row g-3">
        {isAdmin ? (
          <div className="form-field filter-field">
            <label htmlFor="leave-employee-filter">Filter by employee</label>
            <select
              id="leave-employee-filter"
              value={employeeFilter}
              onChange={(event) => setEmployeeFilter(event.target.value)}
            >
              <option value="">All employees</option>
              {employees.map((employee) => (
                <option key={employee._id} value={employee.employeeId}>
                  {employee.employeeId} — {employee.name}
                </option>
              ))}
            </select>
          </div>
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

      <div className="table-responsive">
        <table className="table table-dark table-hover align-middle mb-0">
          <thead>
            <tr>
              {isAdmin ? <th>Employee</th> : null}
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
                <td colSpan={isAdmin ? 6 : 5}>Loading leave requests...</td>
              </tr>
            ) : leaves.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5}>No leave requests found.</td>
              </tr>
            ) : (
              leaves.map((leave) => (
                <tr key={leave._id}>
                  {isAdmin ? (
                    <td>
                      {leave.employeeName} <span className="text-muted">({leave.employeeId})</span>
                    </td>
                  ) : null}
                  <td>{leave.leaveType}</td>
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
                      {isAdmin && leave.status === LEAVE_STATUS.PENDING ? (
                        <>
                          <Button variant="approve" onClick={() => decide(leave, approveLeave, 'Leave approved.')}>
                            Approve
                          </Button>
                          <Button variant="reject" onClick={() => decide(leave, rejectLeave, 'Leave rejected.')}>
                            Reject
                          </Button>
                        </>
                      ) : null}
                      {!isAdmin && leave.status === LEAVE_STATUS.PENDING ? (
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

      <LeaveDetails leave={selectedLeave} onClose={() => setSelectedLeave(null)} />
    </div>
  )
}

export default LeaveList
