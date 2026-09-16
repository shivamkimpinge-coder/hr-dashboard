import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useParams } from 'react-router-dom'
import Button from '../../../utils/Button/button'
import PerfAvatar from '../../Performance/PerfAvatar'
import useApi from '../../../hooks/useApi'
import SectionTabs from '../../../utils/SectionTabs/sectionTabs'
import {
  IconBriefcase,
  IconBuilding,
  IconCalendar,
  IconIdBadge,
  IconMail,
  IconUser,
} from '../../Layout/Sidebar/icons'
import AttendanceTableSection from '../Attendance/AttendanceTableSection'
import PerformanceTab from '../Performance.jsx/PerformanceTab'

const formatJoinDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

function HeaderFact({ icon: Icon, label, value }) {
  return (
    <div className="emp-fact">
      <span className="emp-fact-icon">
        <Icon />
      </span>
      <div>
        <p>{label}</p>
        <strong>{value || '—'}</strong>
      </div>
    </div>
  )
}

function EmployeeHeaderCard({ employee }) {
  return (
    <div className="emp-hero">
      <div className="emp-hero-main">
        <PerfAvatar name={employee.name} size="lg" />

        <div className="emp-hero-info">
          <div className="emp-hero-name-row">
            <h2>{employee.name}</h2>
            <span className={`pill ${employee.status === 'Active' ? 'pill-success' : 'pill-muted'}`}>
              {employee.status || 'Active'}
            </span>
          </div>

          <div className="emp-hero-meta">
            <span>
              <IconBriefcase />
              {employee.designation}
            </span>
            <span>
              <IconIdBadge />
              {employee.employeeId}
            </span>
            <span>
              <IconBuilding />
              {employee.department}
            </span>
            <span>
              <IconMail />
              {employee.email}
            </span>
          </div>
        </div>
      </div>

      <div className="emp-hero-facts">
        <HeaderFact icon={IconCalendar} label="Join Date" value={formatJoinDate(employee.joiningDate)} />
        <HeaderFact icon={IconBriefcase} label="Work Type" value={employee.workType} />
        <HeaderFact icon={IconUser} label="Manager" value={employee.reportingManager} />
      </div>
    </div>
  )
}

function EmployeeDetails() {
  const { employeeId } = useParams()
  const { getEmployee } = useApi()

  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setStatus(null)
    try {
      const data = await getEmployee(employeeId)
      setEmployee(data.employee)
    } catch (err) {
      if (err.status === 404) {
        setStatus('notFound')
      } else if (err.status === 403) {
        setStatus('forbidden')
      } else {
        setStatus('error')
        setErrorMessage(err.message)
      }
    } finally {
      setLoading(false)
    }
  }, [getEmployee, employeeId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <div className="emp-details-page">
      <nav className="breadcrumb">
        <Link to="/dashboard/employees">Employees</Link>
        <span aria-hidden="true">›</span>
        <span>Employee Details</span>
      </nav>

      <div className="emp-details-head">
        <div>
          <h1>Employee Details</h1>
          <p>View attendance, performance, and personal information</p>
        </div>
        <Button variant="secondary" to="/dashboard/employees">
          ← Back to Employees
        </Button>
      </div>

      {loading ? (
        <div className="panel">
          <p>Loading employee information...</p>
        </div>
      ) : status === 'notFound' ? (
        <div className="panel empty-state">
          <p>Employee not found.</p>
          <Button variant="secondary" to="/dashboard/employees">
            ← Back to Employees
          </Button>
        </div>
      ) : status === 'forbidden' ? (
        <div className="panel empty-state">
          <p>You don't have permission to view this employee's details.</p>
          <Button variant="secondary" to="/dashboard/employees">
            ← Back to Employees
          </Button>
        </div>
      ) : status === 'error' ? (
        <div className="feedback-banner feedback-banner-error">{errorMessage || 'Unable to load employee information.'}</div>
      ) : employee ? (
        <>
          <EmployeeHeaderCard employee={employee} />

          <SectionTabs
            tabs={[
              { to: `/dashboard/employees/${employeeId}/overview`, label: 'Overview', end: true },
              { to: `/dashboard/employees/${employeeId}/performance`, label: 'Performance' },
            ]}
          />

          <Routes>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<AttendanceTableSection employeeId={employeeId} />} />
            <Route path="performance" element={<PerformanceTab employeeId={employeeId} />} />
            <Route path="*" element={<Navigate to="overview" replace />} />
          </Routes>
        </>
      ) : null}
    </div>
  )
}

export default EmployeeDetails
