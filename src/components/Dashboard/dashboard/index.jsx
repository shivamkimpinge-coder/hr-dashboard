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
import { isAdminRole, isManagerRole } from '../../../utils/roles'
import { RadialGauge, RankedBarList, Sparkline, StackedBarChart } from './charts'
import {
  IconAlertTriangle,
  IconCalendar,
  IconClock,
  IconKanban,
  IconUserCheck,
  IconUserOff,
  IconUserPlus,
  IconUsers,
  IconWallet,
} from '../../Layout/Sidebar/icons'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const HIRING_RANGES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
]

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

function bucketKeyFor(date, range) {
  if (range === 'annually') return `${date.getFullYear()}`
  if (range === 'quarterly') return `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`
  return `${date.getFullYear()}-${date.getMonth()}`
}

// Real headcount grouped by each employee's department, top 5 + "Other".
function buildDepartmentBreakdown(employees) {
  const counts = new Map()
  employees.forEach((employee) => {
    const dept = (employee.department || '').trim() || 'Unassigned'
    counts.set(dept, (counts.get(dept) || 0) + 1)
  })

  const sorted = Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)

  if (sorted.length <= 6) return sorted

  const top = sorted.slice(0, 5)
  const otherCount = sorted.slice(5).reduce((sum, d) => sum + d.value, 0)
  return [...top, { label: 'Other', value: otherCount }]
}

// Last `months` calendar months ending with the current one.
function recentMonths(months) {
  const now = new Date()
  const out = []
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTH_LABELS[d.getMonth()], year: d.getFullYear(), month: d.getMonth() })
  }
  return out
}

const joinedDate = (employee) => {
  if (!employee.joiningDate) return null
  const d = new Date(employee.joiningDate)
  return Number.isNaN(d.getTime()) ? null : d
}

// Cumulative headcount at the end of each of the last `months` months — the
// series behind the "Headcount" sparkline.
function buildHeadcountSeries(employees, months = 8) {
  return recentMonths(months).map(({ year, month }) => {
    const cutoff = new Date(year, month + 1, 0, 23, 59, 59)
    return employees.filter((employee) => {
      const joined = joinedDate(employee)
      return joined && joined <= cutoff
    }).length
  })
}

// Hires per month — the series behind the "New Hires" sparkline.
function buildHiresSeries(employees, months = 8) {
  const buckets = recentMonths(months)
  const index = new Map(buckets.map((b, i) => [b.key, i]))
  const counts = buckets.map(() => 0)

  employees.forEach((employee) => {
    const joined = joinedDate(employee)
    if (!joined) return
    const i = index.get(`${joined.getFullYear()}-${joined.getMonth()}`)
    if (i != null) counts[i] += 1
  })

  return counts
}

// Hires per period split by department, for the stacked chart. Departments
// beyond the top four are folded into "Other" so the legend stays readable.
function buildHiringByDepartment(employees, range) {
  const buckets = buildRangeBuckets(range)
  const index = new Map(buckets.map((b, i) => [b.key, i]))

  const totals = new Map()
  employees.forEach((employee) => {
    const joined = joinedDate(employee)
    if (!joined || !index.has(bucketKeyFor(joined, range))) return
    const dept = (employee.department || '').trim() || 'Unassigned'
    totals.set(dept, (totals.get(dept) || 0) + 1)
  })

  const ranked = Array.from(totals.entries()).sort((a, b) => b[1] - a[1])
  const top = ranked.slice(0, 4).map(([label]) => label)

  const series = top.map((label) => ({ key: label, label }))
  if (ranked.length > 4) series.push({ key: '__other', label: 'Other' })

  const rows = buckets.map((bucket) => ({ label: bucket.label, values: {} }))
  employees.forEach((employee) => {
    const joined = joinedDate(employee)
    if (!joined) return
    const i = index.get(bucketKeyFor(joined, range))
    if (i == null) return
    const dept = (employee.department || '').trim() || 'Unassigned'
    const key = top.includes(dept) ? dept : '__other'
    rows[i].values[key] = (rows[i].values[key] || 0) + 1
  })

  return { buckets: rows, series }
}

// Whole-year tenure bands, counted from each employee's joining date.
function buildTenureBuckets(employees) {
  const now = new Date()
  const bands = [
    { label: '< 1 yr', value: 0 },
    { label: '1–2 yrs', value: 0 },
    { label: '2–5 yrs', value: 0 },
    { label: '5+ yrs', value: 0 },
  ]

  employees.forEach((employee) => {
    const joined = joinedDate(employee)
    if (!joined) return
    const years = (now - joined) / (365.25 * 24 * 60 * 60 * 1000)
    if (years < 1) bands[0].value += 1
    else if (years < 2) bands[1].value += 1
    else if (years < 5) bands[2].value += 1
    else bands[3].value += 1
  })

  return bands
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
      <div>
        <h2>
          {greetingForHour(now.getHours())}, {firstName} 👋
        </h2>
        <p>{subtitle}</p>
      </div>
      <div className="dashboard-greeting-time">
        <span>{now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
        <strong>{now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</strong>
      </div>
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

// HR files their own leave like any employee, so they get the shortcut too;
// Admin only oversees leave and never applies for it.
const getManagerQuickActions = (currentUser) =>
  [
    { label: 'Add Employee', desc: 'Create a new employee record', icon: IconUserPlus, to: '/dashboard/employees', tone: 'primary' },
    { label: 'Mark Attendance', desc: "Log today's attendance", icon: IconClock, to: '/dashboard/attendance/mark', tone: 'blue' },
    { label: 'Review Leave', desc: 'Approve or reject requests', icon: IconCalendar, to: '/dashboard/leave', tone: 'amber' },
    { label: 'Run Payroll', desc: 'Generate monthly payroll', icon: IconWallet, to: '/dashboard/payroll/generate', tone: 'green' },
    !isAdminRole(currentUser) && {
      label: 'Apply Leave',
      desc: 'Request time off',
      icon: IconCalendar,
      to: '/dashboard/leave/apply',
      tone: 'blue',
    },
  ].filter(Boolean)

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
        <div>
          <p className="eyebrow">Needs your attention</p>
          <h3>Pending Leave Requests</h3>
        </div>
        <Button variant="secondary" to="/dashboard/leave">
          View all
        </Button>
      </div>

      {loading ? (
        <p className="form-hint">Loading...</p>
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
const EMPLOYEE_STAT_ICONS = [
  { icon: IconKanban, tone: 'primary' },
  { icon: IconAlertTriangle, tone: 'amber' },
  { icon: IconCalendar, tone: 'blue' },
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
          const { icon, tone } = EMPLOYEE_STAT_ICONS[index] || EMPLOYEE_STAT_ICONS[0]
          return <StatCard key={item.label} item={item} icon={icon} tone={tone} onClick={() => navigate(item.to)} />
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

// Reference's "Churn Rate" / "User Growth" tile: a label, a one-line caption,
// the figure, a signed change, and a sparkline of the same series. The colour
// follows the actual direction of travel rather than being fixed per card.
function MiniMetricCard({ label, caption, value, delta, deltaLabel, series, id }) {
  const tone = delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'flat'

  return (
    <div className="panel mini-metric h-100">
      <h3 className="mini-metric-title">{label}</h3>
      <p className="mini-metric-caption">{caption}</p>

      <div className="mini-metric-body">
        <div className="mini-metric-figures">
          <strong className="mini-metric-value">{value}</strong>
          <p className={`mini-metric-delta mini-metric-delta--${tone}`}>
            <span>
              {delta > 0 ? '+' : ''}
              {delta}
            </span>{' '}
            {deltaLabel}
          </p>
        </div>
        <Sparkline data={series} tone={tone} id={id} />
      </div>
    </div>
  )
}

const WORKFORCE_TABS = [
  { value: 'department', label: 'Department' },
  { value: 'status', label: 'Status' },
  { value: 'tenure', label: 'Tenure' },
]

// Right-hand column, modelled on the reference's "Product Performance": a
// segmented control, a two-up summary row, then a nested card holding the
// visual for whichever tab is active.
function WorkforcePanel({ stats, departmentData, tenureData, activeRatePercent }) {
  const [tab, setTab] = useState('department')

  const total = stats[0]?.value ?? 0
  const active = stats[1]?.value ?? 0
  const inactive = stats[2]?.value ?? 0

  const topDepartment = departmentData[0] || null
  const newest = tenureData[0]?.value ?? 0
  const longest = tenureData[tenureData.length - 1]?.value ?? 0

  const summaries = {
    department: [
      { label: 'Departments', value: departmentData.length, direction: 'up' },
      { label: topDepartment ? topDepartment.label : 'Largest', value: topDepartment ? topDepartment.value : 0, direction: 'up' },
    ],
    status: [
      { label: 'Active', value: active, direction: 'up' },
      { label: 'Inactive', value: inactive, direction: inactive > 0 ? 'down' : 'up' },
    ],
    tenure: [
      { label: 'Under 1 yr', value: newest, direction: 'up' },
      { label: '5+ yrs', value: longest, direction: 'up' },
    ],
  }

  const nested = {
    department: { title: 'Headcount by department', figure: `${total} total` },
    status: { title: 'Active employee rate', figure: `${Math.round(activeRatePercent)}%` },
    tenure: { title: 'Employees by tenure', figure: `${total} total` },
  }

  return (
    <div className="panel workforce-panel h-100">
      <div className="panel-heading">
        <div>
          <h3>Workforce Breakdown</h3>
        </div>
      </div>

      <div className="range-toggle workforce-tabs">
        {WORKFORCE_TABS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={tab === option.value ? 'is-active' : ''}
            onClick={() => setTab(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="workforce-summary">
        {summaries[tab].map((item) => (
          <div className="workforce-summary-item" key={item.label}>
            <span className="workforce-summary-label">{item.label}</span>
            <strong className={`workforce-summary-value workforce-summary-value--${item.direction}`}>
              <span aria-hidden="true">{item.direction === 'up' ? '\u2191' : '\u2193'}</span>
              {item.value}
            </strong>
          </div>
        ))}
      </div>

      <div className="workforce-nested">
        <div className="workforce-nested-head">
          <p>{nested[tab].title}</p>
          <span className="workforce-nested-figure">{nested[tab].figure}</span>
        </div>

        {tab === 'status' ? (
          <RadialGauge percent={activeRatePercent} caption="Share of the team currently marked Active." />
        ) : (
          <RankedBarList data={tab === 'department' ? departmentData : tenureData} />
        )}
      </div>
    </div>
  )
}

const STAT_ICONS = [
  { icon: IconUsers, tone: 'primary' },
  { icon: IconUserCheck, tone: 'green' },
  { icon: IconUserOff, tone: 'amber' },
  { icon: IconUserPlus, tone: 'blue' },
]

function StatCard({ item, icon: Icon, tone, onClick }) {
  const displayValue = useCountUp(item.value)

  return (
    <article
      className="stat-card stat-card--clickable"
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
        <span className={`stat-card-icon stat-card-icon--${tone}`}>
          <Icon />
        </span>
        <span className="stat-card-arrow" aria-hidden="true">
          →
        </span>
      </div>
      <p>{item.label}</p>
      <h2>{displayValue}</h2>
      <span>{item.trend}</span>
    </article>
  )
}

function OverviewContent({
  currentUser,
  employees,
  stats,
  loading,
  hiringByDepartment,
  hiringRange,
  onHiringRangeChange,
  departmentData,
  tenureData,
  headcountSeries,
  hiresSeries,
  activeRatePercent,
  pendingLeaves,
  pendingLoading,
  onApproveLeave,
  onRejectLeave,
}) {
  const navigate = useNavigate()

  // Both sparklines are monthly, so "delta" is simply the last month against
  // the one before it.
  const headcountNow = headcountSeries[headcountSeries.length - 1] ?? 0
  const headcountDelta = headcountNow - (headcountSeries[headcountSeries.length - 2] ?? headcountNow)
  const hiresNow = hiresSeries[hiresSeries.length - 1] ?? 0
  const hiresDelta = hiresNow - (hiresSeries[hiresSeries.length - 2] ?? hiresNow)

  return (
    <>
      <section className="row g-3">
        <div className="col-lg-12">
          <DashboardGreeting currentUser={currentUser} subtitle="Here's what's happening with your team today." />
        </div>
      </section>

      <section className="stats-grid">
        {stats.map((item, index) => {
          const { icon, tone } = STAT_ICONS[index] || STAT_ICONS[0]
          return (
            <StatCard key={item.label} item={item} icon={icon} tone={tone} onClick={() => navigate('/dashboard/employees')} />
          )
        })}
      </section>

      <section className="row g-3">
        <div className="col-lg-4">
          <QuickActions actions={getManagerQuickActions(currentUser)} />
        </div>
        <div className="col-lg-8">
          <PendingApprovals
            leaves={pendingLeaves}
            loading={pendingLoading}
            onApprove={onApproveLeave}
            onReject={onRejectLeave}
          />
        </div>
      </section>

      <section className="row g-3">
        <div className="col-lg-8">
          <div className="row g-3">
            <div className="col-md-6">
              <MiniMetricCard
                label="Headcount"
                caption="Everyone on the books"
                value={headcountNow}
                delta={headcountDelta}
                deltaLabel="than last month"
                series={headcountSeries}
                id="headcount"
              />
            </div>

            <div className="col-md-6">
              <MiniMetricCard
                label="New Hires"
                caption="Joined in the last month"
                value={hiresNow}
                delta={hiresDelta}
                deltaLabel="than last month"
                series={hiresSeries}
                id="hires"
              />
            </div>

            <div className="col-12">
              <div className="panel chart-card">
                <div className="panel-heading chart-card-head">
                  <div>
                    <p className="eyebrow">Hiring trend</p>
                    <h3>New employees by department</h3>
                  </div>
                  <div className="range-toggle">
                    {HIRING_RANGES.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={hiringRange === option.value ? 'is-active' : ''}
                        onClick={() => onHiringRangeChange(option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <StackedBarChart buckets={hiringByDepartment.buckets} series={hiringByDepartment.series} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <WorkforcePanel
            stats={stats}
            departmentData={departmentData}
            tenureData={tenureData}
            activeRatePercent={activeRatePercent}
          />
        </div>
      </section>

      <section className="row g-3">
        <div className="col-lg-12">
          <div className="panel h-100">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Latest updates</p>
                <h3>Recent employee activity</h3>
              </div>
              <Button variant="secondary" to="/dashboard/employees">
                View all
              </Button>
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
                    <tr>
                      <td colSpan={3}>Loading...</td>
                    </tr>
                  ) : employees.length === 0 ? (
                    <tr>
                      <td colSpan={3}>No employees yet.</td>
                    </tr>
                  ) : (
                    employees.slice(0, 6).map((employee) => (
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
                            className={`pill ${employee.status === 'Active' ? 'pill-success' : 'pill-muted'}`}
                          >
                            {employee.status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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
  const [hiringRange, setHiringRange] = useState('monthly')
  const [pendingLeaves, setPendingLeaves] = useState([])
  const [pendingLoading, setPendingLoading] = useState(true)

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

  useEffect(() => {
    if (!isManager) {
      setLoading(false)
      setPendingLoading(false)
      return
    }
    fetchEmployees()
    fetchStats()
    fetchPendingLeaves()
  }, [isManager, fetchEmployees, fetchStats, fetchPendingLeaves])

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
    { label: 'Inactive Employees', value: statsData.inactive, trend: 'Need follow-up' },
    { label: 'New Employees', value: statsData.newEmployees, trend: 'Joined this week' },
  ]

  const hiringByDepartment = useMemo(() => buildHiringByDepartment(employees, hiringRange), [employees, hiringRange])
  const departmentData = useMemo(() => buildDepartmentBreakdown(employees), [employees])
  const tenureData = useMemo(() => buildTenureBuckets(employees), [employees])
  const headcountSeries = useMemo(() => buildHeadcountSeries(employees), [employees])
  const hiresSeries = useMemo(() => buildHiresSeries(employees), [employees])
  const activeRatePercent = statsData.total > 0 ? (statsData.active / statsData.total) * 100 : 0

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
    hiringByDepartment,
    hiringRange,
    setHiringRange,
    departmentData,
    tenureData,
    headcountSeries,
    hiresSeries,
    activeRatePercent,
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
      hiringByDepartment={ctx.hiringByDepartment}
      hiringRange={ctx.hiringRange}
      onHiringRangeChange={ctx.setHiringRange}
      departmentData={ctx.departmentData}
      tenureData={ctx.tenureData}
      headcountSeries={ctx.headcountSeries}
      hiresSeries={ctx.hiresSeries}
      activeRatePercent={ctx.activeRatePercent}
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
