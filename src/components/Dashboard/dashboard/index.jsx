import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Outlet, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import Button from '../../../utils/Button/button'
import Header from '../../Layout/Header'
import Sidebar from '../../Layout/Sidebar'
import EmployeeList from '../../Empolyee/employeeList'
import { formatDateDisplay, statusPillClass as leaveStatusPillClass } from '../../Leave/leaveFormConfig'
import { MAX_SESSIONS_PER_DAY, canStartNewSession, formatTimeDisplay, getDateKey } from '../../Attendance/attendanceStore'
import { TASK_STATUS, formatDateDisplay as taskFormatDate, priorityPillClass as taskPriorityPillClass } from '../../Tasks/taskStore'
import PerfAvatar from '../../Performance/PerfAvatar'
import useApi from '../../../hooks/useApi'
import { isManagerRole } from '../../../utils/roles'
import { HeadcountChart } from './charts'
import {
  IconAlertTriangle,
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconKanban,
  IconUserCheck,
  IconUserPlus,
  IconUsers,
  IconWallet,
} from '../../Layout/Sidebar/icons'

const ACTIVITY_PAGE_SIZE = 5

const HEADCOUNT_RANGES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
]

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// The last N periods ending with the current one, for whichever range the
// toggle is on. Shared by the stacked hiring chart so its columns line up with
// the range the user picked.
function buildRangeBuckets(range) {
  const now = new Date()
  const buckets = []

  if (range === 'annually') {
    for (let i = 4; i >= 0; i -= 1) {
      const year = now.getFullYear() - i
      buckets.push({ key: `${year}`, label: `${year}` })
    }
  } else if (range === 'quarterly') {
    for (let i = 7; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i * 3, 1)
      const quarter = Math.floor(d.getMonth() / 3) + 1
      buckets.push({ key: `${d.getFullYear()}-Q${quarter}`, label: `Q${quarter} '${String(d.getFullYear()).slice(2)}` })
    }
  } else {
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTH_LABELS[d.getMonth()] })
    }
  }

  return buckets
}

const joinedDate = (employee) => {
  if (!employee.joiningDate) return null
  const d = new Date(employee.joiningDate)
  return Number.isNaN(d.getTime()) ? null : d
}

// Cumulative headcount at the close of each period in the selected range —
// everyone who had joined by then, not just that period's hires.
function buildHeadcountTrend(employees, range) {
  const now = new Date()
  const buckets = buildRangeBuckets(range)

  return buckets.map((bucket, index) => {
    let cutoff
    if (range === 'annually') {
      cutoff = new Date(now.getFullYear() - (buckets.length - 1 - index) + 1, 0, 0, 23, 59, 59)
    } else if (range === 'quarterly') {
      const d = new Date(now.getFullYear(), now.getMonth() - (buckets.length - 1 - index) * 3, 1)
      const quarterEndMonth = Math.floor(d.getMonth() / 3) * 3 + 3
      cutoff = new Date(d.getFullYear(), quarterEndMonth, 0, 23, 59, 59)
    } else {
      const d = new Date(now.getFullYear(), now.getMonth() - (buckets.length - 1 - index), 1)
      cutoff = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
    }

    const headcount = employees.filter((employee) => {
      const joined = joinedDate(employee)
      return joined && joined <= cutoff
    }).length

    return { label: bucket.label, headcount }
  })
    // Hires in a period is the rise in headcount over it. Deriving it from the
    // running total keeps the two series consistent by construction — they can
    // never disagree the way two independent counts could.
    .map((bucket, index, all) => ({
      ...bucket,
      hires: index === 0 ? 0 : Math.max(0, bucket.headcount - all[index - 1].headcount),
    }))
}

function useLiveClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(id)
  }, [])
  return now
}

function greetingForHour(hour) {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function DashboardGreeting({ currentUser, subtitle }) {
  const now = useLiveClock()
  const firstName = (currentUser?.name || 'there').split(' ')[0]

  return (
    <div className="dashboard-greeting">
      <h2>
        {greetingForHour(now.getHours())}, {firstName}
      </h2>
      <p>{subtitle}</p>
    </div>
  )
}

// Eases a stat value from its previous displayed number up to the latest
// fetched value instead of popping straight in, so refreshed numbers read as
// "live" rather than a jump-cut.
function useCountUp(value, duration = 700) {
  const target = Number(value) || 0
  const [display, setDisplay] = useState(target)
  const fromRef = useRef(target)

  useEffect(() => {
    const from = fromRef.current
    if (from === target) return undefined

    const start = performance.now()
    let raf
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + (target - from) * eased))
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        fromRef.current = target
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return display
}

function QuickActionButton({ action }) {
  const content = (
    <>
      <span className={`quick-action-icon quick-action-icon--${action.tone}`}>
        <action.icon />
      </span>
      <span className="quick-action-text">
        <strong>{action.label}</strong>
        <small>{action.desc}</small>
      </span>
    </>
  )

  if (action.onClick) {
    return (
      <button type="button" className="quick-action-btn" onClick={action.onClick} disabled={action.disabled}>
        {content}
      </button>
    )
  }

  return (
    <Link to={action.to} className="quick-action-btn">
      {content}
    </Link>
  )
}

function QuickActions({ actions }) {
  return (
    <div className="panel h-100">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Shortcuts</p>
          <h3>Quick Actions</h3>
        </div>
      </div>
      <div className="quick-actions">
        {actions.map((action) => (
          <QuickActionButton key={action.label} action={action} />
        ))}
      </div>
    </div>
  )
}

function PendingApprovals({ leaves, loading, onApprove, onReject }) {
  return (
    <div className="panel h-100">
      <div className="panel-heading">
        <h3>Pending Leave Requests</h3>
      </div>

      {loading ? (
        <div className="skeleton-list" aria-hidden="true">
          <span className="skeleton skeleton-row" />
          <span className="skeleton skeleton-row" />
          <span className="skeleton skeleton-row" />
        </div>
      ) : leaves.length === 0 ? (
        <div className="empty-state">
          <span className="perf-empty-icon">
            <IconUserCheck />
          </span>
          <p>All caught up — no pending leave requests.</p>
        </div>
      ) : (
        <div className="approval-list">
          {leaves.slice(0, 4).map((leave) => (
            <div className="approval-item" key={leave._id}>
              <PerfAvatar name={leave.employeeName} size="sm" />
              <div className="approval-item-body">
                <strong>{leave.employeeName}</strong>
                <span>
                  {leave.leaveType} · {formatDateDisplay(leave.startDate)} – {formatDateDisplay(leave.endDate)} ·{' '}
                  {leave.days} day{leave.days === 1 ? '' : 's'}
                </span>
              </div>
              <div className="table-actions">
                <Button variant="approve" onClick={() => onApprove(leave)}>
                  Approve
                </Button>
                <Button variant="reject" onClick={() => onReject(leave)}>
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Backend already rejects non-manager requests with 403 — this just avoids
// flashing an Admin/HR-only page/API-error before the redirect happens.
const EMPLOYEE_STAT_META = [
  { icon: IconKanban, tone: 'blue' },
  { icon: IconAlertTriangle, tone: 'amber' },
  { icon: IconCalendar, tone: 'purple' },
  { icon: IconUserCheck, tone: 'green' },
]

function TodayAttendanceCard({ record, onCheckIn, onCheckOut, submitting }) {
  const statusLabel = !record?.checkIn ? 'Not Checked In' : record?.hasOpenSession ? 'Currently Working' : 'Completed'
  const statusClass = !record?.checkIn ? 'pill-muted' : record?.hasOpenSession ? 'pill-warning' : 'pill-success'

  const sessions = record?.sessions || []
  const sessionsUsed = record?.sessionsUsed ?? sessions.length
  const maxSessions = record?.maxSessionsPerDay ?? MAX_SESSIONS_PER_DAY
  const lastSession = sessions[sessions.length - 1] || null
  const canCheckInAgain = canStartNewSession(record)

  return (
    <div className="panel h-100">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Today</p>
          <h3>Your Attendance</h3>
        </div>
        <Button variant="secondary" to="/dashboard/attendance">
          Details
        </Button>
      </div>

      <div className="attendance-hero-status-head">
        <span className={`pill ${statusClass}`}>{statusLabel}</span>
        <span className="attendance-session-count">
          {sessionsUsed}/{maxSessions} check-ins used
        </span>
      </div>

      <div className="attendance-time-chips" style={{ marginTop: 12 }}>
        <div className="attendance-time-chip">
          <span className="attendance-time-chip-label">{lastSession ? `Session ${sessionsUsed} — In` : 'Check In'}</span>
          <strong>{formatTimeDisplay(lastSession?.checkIn)}</strong>
        </div>
        <span className="attendance-time-chip-arrow" aria-hidden="true">
          →
        </span>
        <div className="attendance-time-chip">
          <span className="attendance-time-chip-label">Out</span>
          <strong>{lastSession?.checkOut ? formatTimeDisplay(lastSession.checkOut) : '—'}</strong>
        </div>
      </div>

      <div className="action-row">
        {record?.hasOpenSession ? (
          <Button onClick={onCheckOut} disabled={submitting}>
            {submitting ? 'Checking Out...' : 'Check Out'}
          </Button>
        ) : canCheckInAgain ? (
          <Button onClick={onCheckIn} disabled={submitting}>
            {submitting ? 'Checking In...' : sessionsUsed === 0 ? 'Check In' : 'Check In Again'}
          </Button>
        ) : (
          <span className="form-hint">All {maxSessions} check-ins used for today.</span>
        )}
      </div>
    </div>
  )
}

function MyTasksPreview({ tasks, loading }) {
  const openTasks = tasks
    .filter((task) => task.status !== TASK_STATUS.DONE)
    .sort((a, b) => (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31'))
    .slice(0, 4)

  return (
    <div className="panel h-100">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Assigned to you</p>
          <h3>My Tasks</h3>
        </div>
        <Button variant="secondary" to="/dashboard/tasks">
          View all
        </Button>
      </div>

      {loading ? (
        <p className="form-hint">Loading...</p>
      ) : openTasks.length === 0 ? (
        <div className="empty-state">
          <span className="perf-empty-icon">
            <IconKanban />
          </span>
          <p>No open tasks — you're all caught up.</p>
        </div>
      ) : (
        <div className="approval-list">
          {openTasks.map((task) => (
            <div className="approval-item" key={task._id}>
              <span className={`pill ${taskPriorityPillClass(task.priority)}`}>{task.priority}</span>
              <div className="approval-item-body">
                <strong>{task.title}</strong>
                <span>
                  {taskFormatDate(task.dueDate)} · {task.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MyLeavePreview({ leaves, loading }) {
  const recent = [...leaves]
    .sort((a, b) => new Date(b.appliedOn || b.createdAt || b.startDate) - new Date(a.appliedOn || a.createdAt || a.startDate))
    .slice(0, 4)

  return (
    <div className="panel h-100">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Time off</p>
          <h3>My Leave Requests</h3>
        </div>
        <Button to="/dashboard/leave/apply">Apply Leave</Button>
      </div>

      {loading ? (
        <p className="form-hint">Loading...</p>
      ) : recent.length === 0 ? (
        <div className="empty-state">
          <span className="perf-empty-icon">
            <IconCalendar />
          </span>
          <p>No leave requests yet.</p>
        </div>
      ) : (
        <div className="approval-list">
          {recent.map((leave) => (
            <div className="approval-item" key={leave._id}>
              <span className={`pill ${leaveStatusPillClass(leave.status)}`}>{leave.status}</span>
              <div className="approval-item-body">
                <strong>{leave.leaveType}</strong>
                <span>
                  {formatDateDisplay(leave.startDate)} – {formatDateDisplay(leave.endDate)} · {leave.days} day
                  {leave.days === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function EmployeeOverview({ currentUser }) {
  const navigate = useNavigate()
  const { getMyAttendance, checkInAttendance, checkOutAttendance, getMyTasks, getMyLeaves } = useApi()

  const [todayRecord, setTodayRecord] = useState(null)
  const [monthPresentCount, setMonthPresentCount] = useState(0)
  const [tasks, setTasks] = useState([])
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const todayKey = getDateKey()

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [attendanceData, taskData, leaveData] = await Promise.all([getMyAttendance(), getMyTasks(), getMyLeaves()])
      const history = attendanceData.attendance || []
      setTodayRecord(history.find((item) => item.date === todayKey) || null)
      const monthPrefix = todayKey.slice(0, 7)
      setMonthPresentCount(history.filter((item) => item.date.startsWith(monthPrefix) && item.status === 'Present').length)
      setTasks(taskData.tasks || [])
      setLeaves(leaveData.leaves || [])
    } catch {
      // Individual widgets fall back to their own empty states below.
    } finally {
      setLoading(false)
    }
  }, [getMyAttendance, getMyTasks, getMyLeaves, todayKey])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleCheckIn = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      await checkInAttendance()
      toast.success('Checked in successfully.')
      refresh()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCheckOut = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      await checkOutAttendance()
      toast.success('Checked out successfully.')
      refresh()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const openTasksCount = tasks.filter((task) => task.status !== TASK_STATUS.DONE).length
  const dueSoonCutoff = new Date()
  dueSoonCutoff.setDate(dueSoonCutoff.getDate() + 7)
  const dueSoonCount = tasks.filter(
    (task) => task.status !== TASK_STATUS.DONE && task.dueDate && new Date(task.dueDate) <= dueSoonCutoff
  ).length
  const pendingLeaveCount = leaves.filter((leave) => leave.status === 'Pending').length

  const stats = [
    { label: 'Open Tasks', value: openTasksCount, trend: 'Assigned to you', to: '/dashboard/tasks' },
    { label: 'Due This Week', value: dueSoonCount, trend: 'Needs attention', to: '/dashboard/tasks' },
    { label: 'Pending Leave', value: pendingLeaveCount, trend: 'Awaiting approval', to: '/dashboard/leave' },
    { label: 'Present This Month', value: monthPresentCount, trend: 'Days marked present', to: '/dashboard/attendance/reports' },
  ]

  const todaySessionsUsed = todayRecord?.sessionsUsed ?? (todayRecord?.checkIn ? 1 : 0)
  const todayMaxSessions = todayRecord?.maxSessionsPerDay ?? 3

  const employeeQuickActions = [
    todayRecord?.hasOpenSession
      ? {
          label: submitting ? 'Checking Out...' : 'Check Out',
          desc: 'End your current session',
          icon: IconClock,
          onClick: handleCheckOut,
          disabled: submitting,
          tone: 'primary',
        }
      : canStartNewSession(todayRecord)
        ? {
            label: submitting ? 'Checking In...' : todaySessionsUsed === 0 ? 'Check In' : 'Check In Again',
            desc: todaySessionsUsed === 0 ? 'Start your work day' : `Session ${todaySessionsUsed + 1} of ${todayMaxSessions}`,
            icon: IconClock,
            onClick: handleCheckIn,
            disabled: submitting,
            tone: 'primary',
          }
        : {
            label: 'Attendance',
            desc: `All ${todayMaxSessions} check-ins used today`,
            icon: IconClock,
            to: '/dashboard/attendance',
            tone: 'primary',
          },
    { label: 'Apply Leave', desc: 'Request time off', icon: IconCalendar, to: '/dashboard/leave/apply', tone: 'amber' },
    { label: 'My Tasks', desc: 'View assigned tasks', icon: IconKanban, to: '/dashboard/tasks', tone: 'blue' },
    { label: 'My Payslips', desc: 'View salary history', icon: IconWallet, to: '/dashboard/payroll', tone: 'green' },
  ]

  return (
    <>
      <section className="row g-3">
        <div className="col-lg-12">
          <DashboardGreeting currentUser={currentUser} subtitle="Here's your workspace for today." />
        </div>
      </section>

      <section className="stats-grid">
        {stats.map((item, index) => {
          const meta = EMPLOYEE_STAT_META[index] || EMPLOYEE_STAT_META[0]
          return (
            <StatCard key={item.label} item={item} icon={meta.icon} tone={meta.tone} onClick={() => navigate(item.to)} />
          )
        })}
      </section>

      <section className="row g-3">
        <div className="col-lg-4">
          <QuickActions actions={employeeQuickActions} />
        </div>
        <div className="col-lg-8">
          <TodayAttendanceCard
            record={todayRecord}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            submitting={submitting}
          />
        </div>
      </section>

      <section className="row g-3">
        <div className="col-lg-6">
          <MyTasksPreview tasks={tasks} loading={loading} />
        </div>
        <div className="col-lg-6">
          <MyLeavePreview leaves={leaves} loading={loading} />
        </div>
      </section>
    </>
  )
}

const STAT_META = [
  { icon: IconUsers, tone: 'blue' },
  { icon: IconUserCheck, tone: 'green' },
  { icon: IconCalendar, tone: 'amber' },
  { icon: IconUserPlus, tone: 'purple' },
]

function StatCard({ item, icon: Icon, tone, onClick }) {
  const displayValue = useCountUp(item.value)

  return (
    <article
      className={`stat-card stat-card--clickable stat-card--${tone}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick()
        }
      }}
    >
      <div className="stat-card-head">
        <span className="stat-card-icon">
          <Icon />
        </span>
        <p>{item.label}</p>
      </div>
      <h2>{displayValue.toLocaleString()}</h2>
      <span className="stat-card-trend">{item.trend}</span>
    </article>
  )
}

// Employee Details paginates its records table; the activity table now does the
// same. It renders a window of page numbers rather than all of them — the
// dashboard can hold 200 employees, and 40 buttons would not fit.
function pageWindow(current, total, span = 5) {
  if (total <= span) return Array.from({ length: total }, (_, i) => i + 1)
  const half = Math.floor(span / 2)
  const start = Math.min(Math.max(1, current - half), total - span + 1)
  return Array.from({ length: span }, (_, i) => start + i)
}

function OverviewContent({
  currentUser,
  employees,
  stats,
  loading,
  headcountSeries,
  headcountRange,
  onHeadcountRangeChange,
  pendingLeaves,
  pendingLoading,
  onApproveLeave,
  onRejectLeave,
}) {
  const navigate = useNavigate()
  const [activityPage, setActivityPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(employees.length / ACTIVITY_PAGE_SIZE))
  const currentPage = Math.min(activityPage, totalPages)
  const pageEmployees = employees.slice((currentPage - 1) * ACTIVITY_PAGE_SIZE, currentPage * ACTIVITY_PAGE_SIZE)
  const firstShown = employees.length === 0 ? 0 : (currentPage - 1) * ACTIVITY_PAGE_SIZE + 1
  const lastShown = Math.min(currentPage * ACTIVITY_PAGE_SIZE, employees.length)

  return (
    <>
      <section className="row g-3">
        <div className="col-lg-12">
          <div className="page-head">
            <DashboardGreeting currentUser={currentUser} subtitle="Here's what's happening with your team today." />
            <Button variant="secondary" to="/dashboard/employees">
              View all employees
            </Button>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        {stats.map((item, index) => {
          const meta = STAT_META[index] || STAT_META[0]
          return (
            <StatCard
              key={item.label}
              item={item}
              icon={meta.icon}
              tone={meta.tone}
              onClick={() => navigate('/dashboard/employees')}
            />
          )
        })}
      </section>

      <section className="row g-3">
        <div className="col-lg-12">
          <div className="panel chart-card">
            <div className="panel-heading chart-card-head">
              <h3>Headcount</h3>
              <div className="range-toggle">
                {HEADCOUNT_RANGES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={headcountRange === option.value ? 'is-active' : ''}
                    onClick={() => onHeadcountRangeChange(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <HeadcountChart data={headcountSeries} />
          </div>
        </div>
      </section>

      <section className="row g-3">
        <div className="col-lg-12">
          <PendingApprovals
            leaves={pendingLeaves}
            loading={pendingLoading}
            onApprove={onApproveLeave}
            onReject={onRejectLeave}
          />
        </div>
      </section>

      <section className="row g-3">
        <div className="col-lg-12">
          <div className="panel">
            <div className="panel-heading">
              <h3>Recent Activity</h3>
            </div>
            <div className="table-responsive">
              <table className="table table-dark table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [0, 1, 2, 3, 4].map((row) => (
                      <tr key={row} aria-hidden="true">
                        <td>
                          <span className="skeleton skeleton-text" />
                        </td>
                        <td>
                          <span className="skeleton skeleton-text skeleton-text--sm" />
                        </td>
                        <td>
                          <span className="skeleton skeleton-pill" />
                        </td>
                      </tr>
                    ))
                  ) : employees.length === 0 ? (
                    <tr>
                      <td colSpan={3}>No employees yet.</td>
                    </tr>
                  ) : (
                    pageEmployees.map((employee) => (
                      <tr
                        key={employee._id}
                        className="activity-row"
                        onClick={() => navigate(`/dashboard/employees?search=${encodeURIComponent(employee.name)}`)}
                      >
                        <td>
                          <span className="activity-row-name">
                            <PerfAvatar name={employee.name} size="sm" />
                            {employee.name}
                          </span>
                        </td>
                        <td>{employee.department}</td>
                        <td>
                          <span
                            className={`pill pill-dot ${employee.status === 'Active' ? 'pill-success' : 'pill-muted'}`}
                          >
                            <i aria-hidden="true" />
                            {employee.status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!loading && employees.length > 0 ? (
              <div className="emp-pagination">
                <p>
                  Showing {firstShown} to {lastShown} of {employees.length} employees
                </p>
                <div className="emp-pager">
                  <button
                    type="button"
                    onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                  >
                    <IconChevronLeft />
                  </button>
                  {pageWindow(currentPage, totalPages).map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={n === currentPage ? 'is-active' : ''}
                      aria-current={n === currentPage ? 'page' : undefined}
                      onClick={() => setActivityPage(n)}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setActivityPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                  >
                    <IconChevronRight />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </>
  )
}

// ---------------------------------------------------------------------------
// Layout route: renders the app shell once and owns the employee/stats/leave
// data that both the overview and the employee list read, handing it to the
// matched child route through the router's outlet context.
// ---------------------------------------------------------------------------
function DashboardLayout({ onLogout, currentUser, onProfileUpdate }) {
  const isManager = isManagerRole(currentUser)
  const [searchParams] = useSearchParams()
  const employeeSearch = searchParams.get('search')?.trim() || ''

  const [employees, setEmployees] = useState([])
  const [statsData, setStatsData] = useState({ total: 0, active: 0, inactive: 0, newEmployees: 0 })
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [headcountRange, setHeadcountRange] = useState('monthly')
  const [pendingLeaves, setPendingLeaves] = useState([])
  const [pendingLoading, setPendingLoading] = useState(true)
  const [onLeaveToday, setOnLeaveToday] = useState(0)

  // One toggle, two behaviours: narrow the rail to icons on desktop, slide the
  // full panel in over the content on small screens.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false)

  const toggleSidebar = () => {
    if (window.matchMedia('(max-width: 960px)').matches) {
      setSidebarMobileOpen((prev) => !prev)
    } else {
      setSidebarCollapsed((prev) => !prev)
    }
  }

  const { listEmployees, getEmployeeStats, listLeaves, approveLeave, rejectLeave } = useApi()

  const fetchEmployees = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true)
      setListError('')
      try {
        const params = { limit: 200 }
        if (employeeSearch) params.search = employeeSearch

        const data = await listEmployees(params)
        setEmployees(data.employees || [])
      } catch (error) {
        if (error.status === 401) {
          onLogout?.()
          return
        }
        setListError(error.message)
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [employeeSearch, listEmployees, onLogout]
  )

  const fetchStats = useCallback(async () => {
    try {
      const data = await getEmployeeStats()
      setStatsData(data)
    } catch (error) {
      if (error.status === 401) onLogout?.()
    }
  }, [getEmployeeStats, onLogout])

  const fetchPendingLeaves = useCallback(async () => {
    setPendingLoading(true)
    try {
      const data = await listLeaves({ status: 'Pending' })
      setPendingLeaves(data.leaves || [])
    } catch (error) {
      if (error.status === 401) onLogout?.()
    } finally {
      setPendingLoading(false)
    }
  }, [listLeaves, onLogout])

  // "On Leave" means approved leave that covers today — a separate question
  // from the pending queue, so it needs its own fetch.
  const fetchOnLeaveToday = useCallback(async () => {
    try {
      const data = await listLeaves({ status: 'Approved' })
      const today = getDateKey()
      const count = (data.leaves || []).filter((leave) => {
        const start = getDateKey(new Date(leave.startDate))
        const end = getDateKey(new Date(leave.endDate))
        return start <= today && today <= end
      }).length
      setOnLeaveToday(count)
    } catch (error) {
      if (error.status === 401) onLogout?.()
    }
  }, [listLeaves, onLogout])

  useEffect(() => {
    if (!isManager) {
      setLoading(false)
      setPendingLoading(false)
      return
    }
    fetchEmployees()
    fetchStats()
    fetchPendingLeaves()
    fetchOnLeaveToday()
  }, [isManager, fetchEmployees, fetchStats, fetchPendingLeaves, fetchOnLeaveToday])

  const handleApproveLeave = async (leave) => {
    try {
      await approveLeave(leave._id)
      toast.success(`${leave.employeeName}'s leave approved.`)
      fetchPendingLeaves()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleRejectLeave = async (leave) => {
    try {
      await rejectLeave(leave._id)
      toast.success(`${leave.employeeName}'s leave rejected.`)
      fetchPendingLeaves()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const stats = [
    { label: 'Total Employees', value: statsData.total, trend: 'All team members' },
    { label: 'Active Employees', value: statsData.active, trend: 'Currently active' },
    { label: 'On Leave', value: onLeaveToday, trend: 'Away today' },
    { label: 'New Hires', value: statsData.newEmployees, trend: 'Joined this week' },
  ]

  const headcountSeries = useMemo(() => buildHeadcountTrend(employees, headcountRange), [employees, headcountRange])

  const refreshEmployeeData = () => Promise.all([fetchEmployees({ silent: true }), fetchStats()])

  const outletContext = {
    currentUser,
    onLogout,
    onProfileUpdate,
    isManager,
    employees,
    employeeSearch,
    stats,
    loading,
    listError,
    headcountSeries,
    headcountRange,
    setHeadcountRange,
    pendingLeaves,
    pendingLoading,
    handleApproveLeave,
    handleRejectLeave,
    refreshEmployeeData,
  }

  return (
    <div className={`dashboard-page${sidebarCollapsed ? ' sidebar-is-collapsed' : ''}`}>
      <Sidebar
        currentUser={currentUser}
        collapsed={sidebarCollapsed}
        mobileOpen={sidebarMobileOpen}
        onNavigate={() => setSidebarMobileOpen(false)}
      />

      {sidebarMobileOpen ? (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setSidebarMobileOpen(false)}
        />
      ) : null}

      <main className="dashboard-main">
        <Header currentUser={currentUser} onLogout={onLogout} onToggleSidebar={toggleSidebar} />
        <Outlet context={outletContext} />
      </main>
    </div>
  )
}

// Index route — managers get the team overview, everyone else their own.
export function DashboardHome() {
  const ctx = useOutletContext()

  if (!ctx.isManager) return <EmployeeOverview currentUser={ctx.currentUser} />

  return (
    <OverviewContent
      currentUser={ctx.currentUser}
      employees={ctx.employees}
      stats={ctx.stats}
      loading={ctx.loading}
      headcountSeries={ctx.headcountSeries}
      headcountRange={ctx.headcountRange}
      onHeadcountRangeChange={ctx.setHeadcountRange}
      pendingLeaves={ctx.pendingLeaves}
      pendingLoading={ctx.pendingLoading}
      onApproveLeave={ctx.handleApproveLeave}
      onRejectLeave={ctx.handleRejectLeave}
    />
  )
}

// The employee list reads the same fetched roster the overview does, so it
// takes it from the layout instead of fetching a second copy.
export function EmployeeListPage() {
  const ctx = useOutletContext()

  return (
    <EmployeeList
      employees={ctx.employees}
      loading={ctx.loading}
      error={ctx.listError}
      searchTerm={ctx.employeeSearch}
      currentUser={ctx.currentUser}
      onChanged={ctx.refreshEmployeeData}
    />
  )
}

export default DashboardLayout
