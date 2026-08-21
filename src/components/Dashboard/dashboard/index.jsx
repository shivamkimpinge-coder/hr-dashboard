import { useCallback, useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import Button from '../../../utils/Button/button'
import Header from '../../Layout/Header'
import Sidebar from '../../Layout/Sidebar'
import Profile from '../profile'
import CreateEmployee from '../../Empolyee/createEmployee'
import EmployeeList from '../../Empolyee/employeeList'
import useApi from '../../../hooks/useApi'

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
                <h4>Payroll</h4>
                <p>Verify salary updates before Friday close.</p>
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
        const data = await listEmployees({ limit: 200 })
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
    [listEmployees, onLogout]
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
    fetchEmployees()
    fetchStats()
  }, [fetchEmployees, fetchStats])

  const stats = [
    { label: 'Total Employees', value: statsData.total, trend: 'All team members' },
    { label: 'Active Employees', value: statsData.active, trend: 'Currently active' },
    { label: 'Inactive Employees', value: statsData.inactive, trend: 'Need follow-up' },
    { label: 'New Employees', value: statsData.newEmployees, trend: 'Joined this week' },
  ]

  const refreshEmployeeData = () => Promise.all([fetchEmployees({ silent: true }), fetchStats()])

  return (
    <div className="dashboard-page">
      <Sidebar onLogout={onLogout} />

      <main className="dashboard-main">
        <Header currentUser={currentUser} onLogout={onLogout} />

        <Routes>
          <Route
            path="/"
            element={<OverviewContent employees={employees} stats={stats} loading={loading} />}
          />
          <Route
            path="/employees"
            element={
              <EmployeeList
                employees={employees}
                loading={loading}
                error={listError}
                onChanged={refreshEmployeeData}
              />
            }
          />
          <Route path="/add-employee" element={<CreateEmployee onCreated={refreshEmployeeData} />} />
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
