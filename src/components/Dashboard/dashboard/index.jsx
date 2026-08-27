import { useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useSearchParams } from 'react-router-dom'
import Button from '../../../utils/Button/button'
import Header from '../../Layout/Header'
import Sidebar from '../../Layout/Sidebar'
import Profile from '../profile'
import CreateEmployee from '../../Empolyee/createEmployee'
import EmployeeList from '../../Empolyee/employeeList'
import SalaryHistory from '../../Payroll/salaryHistory'
import SalaryStructure from '../../Payroll/salaryStructure'
import GenerateSalary from '../../Payroll/generateSalary'
import LeaveList from '../../Leave/leaveList'
import ApplyLeave from '../../Leave/applyLeave'
import CheckInOut from '../../Attendance/checkInOut'
import MarkAttendance from '../../Attendance/markAttendance'
import AttendanceReports from '../../Attendance/attendanceReports'
import useApi from '../../../hooks/useApi'

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
            <div className="col-lg-4">
              <div className="overview-card">
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
            <div className="col-lg-4">
              <div className="overview-card">
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
            <div className="col-lg-4">
              <div className="overview-card">
                <h4>Payroll</h4>
                <p>View your salary slips.</p>
                <div className="action-row">
                  <Button variant="secondary" to="/dashboard/payroll">
                    My Salary Slips
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

function OverviewContent({ employees, stats, loading }) {
  return (
    <>
      <section className="stats-grid">
        {stats.map((item) => (
          <article className="stat-card" key={item.label}>
            <p>{item.label}</p>
            <h2>{item.value}</h2>
            <span>{item.trend}</span>
          </article>
        ))}
      </section>

      <section className="row g-3">
        <div className="col-lg-8">
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

        <div className="col-lg-4">
          <div className="panel h-100">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">This week</p>
                <h3>HR focus</h3>
              </div>
            </div>
            <div className="d-flex flex-column gap-3">
              <div className="overview-card">
                <h4>Onboarding</h4>
                <p>Review paperwork for the newest hires.</p>
              </div>
              <div className="overview-card">
                <h4>Retention</h4>
                <p>Schedule check-ins for inactive employees.</p>
              </div>
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

  const refreshEmployeeData = () => Promise.all([fetchEmployees({ silent: true }), fetchStats()])

  return (
    <div className="dashboard-page">
      <Sidebar onLogout={onLogout} currentUser={currentUser} />

      <main className="dashboard-main">
        <Header currentUser={currentUser} />

        <Routes>
          <Route
            path="/"
            element={
              isAdmin ? (
                <OverviewContent employees={employees} stats={stats} loading={loading} />
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
          <Route
            path="/add-employee"
            element={
              <RequireAdmin currentUser={currentUser}>
                <CreateEmployee onCreated={refreshEmployeeData} />
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
          <Route
            path="/profile"
            element={<Profile currentUser={currentUser} onProfileUpdate={onProfileUpdate} onLogout={onLogout} />}
          />
        </Routes>
      </main>
    </div>
  )
}

export default Dashboard
