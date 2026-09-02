import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useSearchParams } from 'react-router-dom'
import Button from '../../../utils/Button/button'
import Header from '../../Layout/Header'
import Sidebar from '../../Layout/Sidebar'
import Profile from '../profile'
import Settings from '../settings'
import EmployeeList from '../../Empolyee/employeeList'
import SalaryHistory from '../../Payroll/salaryHistory'
import SalaryStructure from '../../Payroll/salaryStructure'
import GenerateSalary from '../../Payroll/generateSalary'
import LeaveList from '../../Leave/leaveList'
import ApplyLeave from '../../Leave/applyLeave'
import CheckInOut from '../../Attendance/checkInOut'
import MarkAttendance from '../../Attendance/markAttendance'
import AttendanceReports from '../../Attendance/attendanceReports'
import TaskBoard from '../../Tasks/taskBoard'
import Goals from '../../Performance/goals'
import KpiList from '../../Performance/kpi'
import PerformanceReview from '../../Performance/performanceReview'
import Ratings from '../../Performance/ratings'
import Promotions from '../../Performance/promotions'
import Feedback from '../../Performance/feedback'
import useApi from '../../../hooks/useApi'
import { RadialGauge, RankedBarList, TrendBarChart } from './charts'
import {
  IconCalendar,
  IconClock,
  IconKanban,
  IconTrendingUp,
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

// Builds the last N periods (ending this month), pre-filled with zero, then
// counts each employee's real joiningDate into the matching bucket.
function buildHiringTrend(employees, range) {
  const now = new Date()
  const buckets = []

  if (range === 'annually') {
    for (let i = 4; i >= 0; i -= 1) {
      const year = now.getFullYear() - i
      buckets.push({ key: `${year}`, label: `${year}`, value: 0 })
    }
  } else if (range === 'quarterly') {
    for (let i = 7; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i * 3, 1)
      const quarter = Math.floor(d.getMonth() / 3) + 1
      buckets.push({ key: `${d.getFullYear()}-Q${quarter}`, label: `Q${quarter} '${String(d.getFullYear()).slice(2)}`, value: 0 })
    }
  } else {
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTH_LABELS[d.getMonth()], value: 0 })
    }
  }

  const bucketIndex = new Map(buckets.map((bucket, index) => [bucket.key, index]))

  employees.forEach((employee) => {
    const joined = employee.joiningDate ? new Date(employee.joiningDate) : null
    if (!joined || Number.isNaN(joined.getTime())) return

    let key
    if (range === 'annually') key = `${joined.getFullYear()}`
    else if (range === 'quarterly') key = `${joined.getFullYear()}-Q${Math.floor(joined.getMonth() / 3) + 1}`
    else key = `${joined.getFullYear()}-${joined.getMonth()}`

    const index = bucketIndex.get(key)
    if (index != null) buckets[index].value += 1
  })

  return buckets
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

// Backend already rejects non-Admin requests with 403 — this just avoids
// flashing an Admin-only page/API-error before the redirect happens.
function RequireAdmin({ currentUser, children }) {
  if (currentUser?.role !== 'Admin') {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

function EmployeeOverview({ currentUser }) {
  return (
    <section className="row g-3">
      <div className="col-lg-12">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Welcome</p>
              <h3>Hi, {currentUser?.name || 'there'}</h3>
            </div>
          </div>
          <div className="row g-3">
            <div className="col-lg-3">
              <div className="overview-card">
                <span className="overview-card-icon">
                  <IconClock />
                </span>
                <h4>Attendance</h4>
                <p>Check in, check out, and track your working hours.</p>
                <div className="action-row">
                  <Button to="/dashboard/attendance">Mark Attendance</Button>
                  <Button variant="secondary" to="/dashboard/attendance/reports">
                    My Reports
                  </Button>
                </div>
              </div>
            </div>
            <div className="col-lg-3">
              <div className="overview-card">
                <span className="overview-card-icon">
                  <IconKanban />
                </span>
                <h4>Tasks</h4>
                <p>View tasks assigned to you and update their status.</p>
                <div className="action-row">
                  <Button to="/dashboard/tasks">My Tasks</Button>
                </div>
              </div>
            </div>
            <div className="col-lg-3">
              <div className="overview-card">
                <span className="overview-card-icon">
                  <IconCalendar />
                </span>
                <h4>Leave</h4>
                <p>Apply for leave or check the status of your requests.</p>
                <div className="action-row">
                  <Button to="/dashboard/leave/apply">Apply Leave</Button>
                  <Button variant="secondary" to="/dashboard/leave">
                    My Leave Requests
                  </Button>
                </div>
              </div>
            </div>
            <div className="col-lg-3">
              <div className="overview-card">
                <span className="overview-card-icon">
                  <IconWallet />
                </span>
                <h4>Payroll</h4>
                <p>View your salary slips.</p>
                <div className="action-row">
                  <Button variant="secondary" to="/dashboard/payroll">
                    My Salary Slips
                  </Button>
                </div>
              </div>
            </div>
            <div className="col-lg-3">
              <div className="overview-card">
                <span className="overview-card-icon">
                  <IconTrendingUp />
                </span>
                <h4>Performance</h4>
                <p>Track your goals, KPIs, reviews and ratings.</p>
                <div className="action-row">
                  <Button variant="secondary" to="/dashboard/performance">
                    View Performance
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const STAT_ICONS = [
  { icon: IconUsers, tone: 'primary' },
  { icon: IconUserCheck, tone: 'green' },
  { icon: IconUserOff, tone: 'amber' },
  { icon: IconUserPlus, tone: 'blue' },
]

function OverviewContent({
  employees,
  stats,
  loading,
  hiringTrendData,
  hiringRange,
  onHiringRangeChange,
  departmentData,
  activeRatePercent,
}) {
  return (
    <>
      <section className="stats-grid">
        {stats.map((item, index) => {
          const { icon: Icon, tone } = STAT_ICONS[index] || STAT_ICONS[0]
          return (
            <article className="stat-card" key={item.label}>
              <span className={`stat-card-icon stat-card-icon--${tone}`}>
                <Icon />
              </span>
              <p>{item.label}</p>
              <h2>{item.value}</h2>
              <span>{item.trend}</span>
            </article>
          )
        })}
      </section>

      <section className="row g-3">
        <div className="col-lg-8">
          <div className="panel chart-card h-100">
            <div className="panel-heading chart-card-head">
              <div>
                <p className="eyebrow">Hiring trend</p>
                <h3>New employees over time</h3>
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
            <TrendBarChart data={hiringTrendData} />
          </div>
        </div>

        <div className="col-lg-4">
          <div className="panel chart-card gauge-card h-100">
            <div className="panel-heading">
              <div>
                {/* <p className="eyebrow">Team health</p> */}
                <h3>Active employee rate</h3>
              </div>
            </div>
            <RadialGauge percent={activeRatePercent} caption="Share of the team currently marked Active." />
            <div className="gauge-stats-row">
              <div className="gauge-stat">
                <span>Total</span>
                <strong>{stats[0]?.value ?? 0}</strong>
              </div>
              <div className="gauge-stat">
                <span>Active</span>
                <strong>{stats[1]?.value ?? 0}</strong>
              </div>
              <div className="gauge-stat">
                <span>Inactive</span>
                <strong>{stats[2]?.value ?? 0}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="row g-3">
        <div className="col-lg-5">
          <div className="panel h-100">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Team composition</p>
                <h3>Employees by department</h3>
              </div>
            </div>
            <RankedBarList data={departmentData} />
          </div>
        </div>

        <div className="col-lg-7">
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
                    employees.slice(0, 4).map((employee) => (
                      <tr key={employee._id}>
                        <td>{employee.name}</td>
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

function Dashboard({ onLogout, currentUser, onProfileUpdate }) {
  const isAdmin = currentUser?.role === 'Admin'
  const [searchParams] = useSearchParams()
  const employeeSearch = searchParams.get('search')?.trim() || ''

  const [employees, setEmployees] = useState([])
  const [statsData, setStatsData] = useState({ total: 0, active: 0, inactive: 0, newEmployees: 0 })
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [hiringRange, setHiringRange] = useState('monthly')

  const { listEmployees, getEmployeeStats } = useApi()

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

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false)
      return
    }
    fetchEmployees()
    fetchStats()
  }, [isAdmin, fetchEmployees, fetchStats])

  const stats = [
    { label: 'Total Employees', value: statsData.total, trend: 'All team members' },
    { label: 'Active Employees', value: statsData.active, trend: 'Currently active' },
    { label: 'Inactive Employees', value: statsData.inactive, trend: 'Need follow-up' },
    { label: 'New Employees', value: statsData.newEmployees, trend: 'Joined this week' },
  ]

  const hiringTrendData = useMemo(() => buildHiringTrend(employees, hiringRange), [employees, hiringRange])
  const departmentData = useMemo(() => buildDepartmentBreakdown(employees), [employees])
  const activeRatePercent = statsData.total > 0 ? (statsData.active / statsData.total) * 100 : 0

  const refreshEmployeeData = () => Promise.all([fetchEmployees({ silent: true }), fetchStats()])

  return (
    <div className="dashboard-page">
      <Sidebar currentUser={currentUser} />

      <main className="dashboard-main">
        <Header currentUser={currentUser} onLogout={onLogout} />

        <Routes>
          <Route
            path="/"
            element={
              isAdmin ? (
                <OverviewContent
                  employees={employees}
                  stats={stats}
                  loading={loading}
                  hiringTrendData={hiringTrendData}
                  hiringRange={hiringRange}
                  onHiringRangeChange={setHiringRange}
                  departmentData={departmentData}
                  activeRatePercent={activeRatePercent}
                />
              ) : (
                <EmployeeOverview currentUser={currentUser} />
              )
            }
          />
          <Route
            path="/employees"
            element={
              <RequireAdmin currentUser={currentUser}>
                <EmployeeList
                  employees={employees}
                  loading={loading}
                  error={listError}
                  searchTerm={employeeSearch}
                  onChanged={refreshEmployeeData}
                />
              </RequireAdmin>
            }
          />
          <Route path="/payroll" element={<SalaryHistory currentUser={currentUser} />} />
          <Route
            path="/payroll/structure"
            element={
              <RequireAdmin currentUser={currentUser}>
                <SalaryStructure />
              </RequireAdmin>
            }
          />
          <Route
            path="/payroll/generate"
            element={
              <RequireAdmin currentUser={currentUser}>
                <GenerateSalary />
              </RequireAdmin>
            }
          />
          <Route path="/leave" element={<LeaveList currentUser={currentUser} />} />
          <Route path="/leave/apply" element={<ApplyLeave />} />
          <Route path="/attendance" element={<CheckInOut currentUser={currentUser} />} />
          <Route
            path="/attendance/mark"
            element={
              <RequireAdmin currentUser={currentUser}>
                <MarkAttendance />
              </RequireAdmin>
            }
          />
          <Route path="/attendance/reports" element={<AttendanceReports currentUser={currentUser} />} />
          <Route path="/tasks" element={<TaskBoard currentUser={currentUser} />} />
          <Route path="/performance" element={<Goals currentUser={currentUser} />} />
          <Route path="/performance/kpi" element={<KpiList currentUser={currentUser} />} />
          <Route path="/performance/reviews" element={<PerformanceReview currentUser={currentUser} />} />
          <Route path="/performance/ratings" element={<Ratings currentUser={currentUser} />} />
          <Route path="/performance/promotions" element={<Promotions currentUser={currentUser} />} />
          <Route path="/performance/feedback" element={<Feedback currentUser={currentUser} />} />
          <Route
            path="/profile"
            element={<Profile currentUser={currentUser} onProfileUpdate={onProfileUpdate} onLogout={onLogout} />}
          />
          <Route path="/settings" element={<Settings currentUser={currentUser} />} />
        </Routes>
      </main>
    </div>
  )
}

export default Dashboard
