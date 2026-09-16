import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../../utils/Button/button'
import SectionTabs from '../../../utils/SectionTabs/sectionTabs'
import PerfAvatar from '../../Performance/PerfAvatar'
import useApi from '../../../hooks/useApi'
import {
  IconCalendar,
  IconUserCheck,
  IconUserOff,
  IconUsers,
} from '../../Layout/Sidebar/icons'
import {
  ATTENDANCE_STATUS,
  formatHours,
  formatTimeDisplay,
  getAttendanceTabs,
  getDateKey,
  getHoursStatus,
  HOURS_STATUS_LABEL,
  hoursStatusPillClass,
  MAX_SESSIONS_PER_DAY,
  statusPillClass,
} from '../../../utils/AttendanceUtils/attendanceStore'

function TeamAttendanceOverview() {
  const { listEmployees, listAttendance } = useApi()

  const todayKey = getDateKey()
  const [date, setDate] = useState(todayKey)
  const [employees, setEmployees] = useState([])
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [employeeData, attendanceData] = await Promise.all([
        listEmployees({ limit: 500 }),
        listAttendance({ from: date, to: date }),
      ])
      setEmployees(employeeData.employees || [])
      setRecords(attendanceData.attendance || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [listEmployees, listAttendance, date])

  useEffect(() => {
    refresh()
  }, [refresh])

  const shiftDate = (deltaDays) => {
    const d = new Date(`${date}T00:00:00`)
    d.setDate(d.getDate() + deltaDays)
    const next = getDateKey(d)
    if (next > todayKey) return
    setDate(next)
  }

  const recordByEmployeeId = useMemo(() => {
    const map = new Map()
    records.forEach((record) => map.set(record.employeeId, record))
    return map
  }, [records])

  const rows = useMemo(
    () =>
      employees
        .filter((employee) => employee.status === 'Active')
        .map((employee) => ({ employee, record: recordByEmployeeId.get(employee.employeeId) || null }))
        .sort((a, b) => a.employee.name.localeCompare(b.employee.name)),
    [employees, recordByEmployeeId]
  )

  const stats = useMemo(() => {
    let present = 0
    let absent = 0

    rows.forEach(({ record }) => {
      if (!record) return
      if (record.status === ATTENDANCE_STATUS.PRESENT || record.status === ATTENDANCE_STATUS.HALF_DAY) present += 1
      else if (record.status === ATTENDANCE_STATUS.ABSENT) absent += 1
    })

    return { total: rows.length, present, absent }
  }, [rows])

  const isToday = date === todayKey

  return (
    <div className="panel detail-panel">
      <SectionTabs tabs={getAttendanceTabs(true)} />

      <div className="panel-heading">
        <div>
          <p className="eyebrow">Attendance</p>
          <h3>Team Attendance</h3>
          <p className="form-hint">See who's in, who's out, and today's status across your team.</p>
        </div>
        <div className="action-row">
          <Button variant="secondary" to="/dashboard/attendance/mark">
            Mark Attendance
          </Button>
          <Button variant="secondary" to="/dashboard/attendance/reports">
            View Reports
          </Button>
        </div>
      </div>

      <div className="attendance-datenav" style={{ marginBottom: 18 }}>
        <label className="attendance-datenav-field">
          <IconCalendar />
          <input type="date" value={date} max={todayKey} onChange={(event) => setDate(event.target.value)} />
        </label>
        <button type="button" className="attendance-datenav-btn" onClick={() => shiftDate(-1)} aria-label="Previous day">
          ‹
        </button>
        <button
          type="button"
          className="attendance-datenav-btn"
          onClick={() => shiftDate(1)}
          disabled={isToday}
          aria-label="Next day"
        >
          ›
        </button>
        <Button onClick={() => setDate(todayKey)}>Today</Button>
      </div>

      {error ? <div className="feedback-banner feedback-banner-error">{error}</div> : null}

      <section className="stats-grid stats-grid--flow">
        {[
          { label: 'Total Employees', value: stats.total, icon: IconUsers, tone: 'blue' },
          { label: 'Present', value: stats.present, icon: IconUserCheck, tone: 'green' },
          { label: 'Absent', value: stats.absent, icon: IconUserOff, tone: 'red' },
        ].map((item) => (
          <article className={`stat-card stat-card--${item.tone}`} key={item.label}>
            <div className="stat-card-head">
              <span className="stat-card-icon">
                <item.icon />
              </span>
              <p>{item.label}</p>
            </div>
            <h2>{item.value}</h2>
          </article>
        ))}
      </section>

      <div className="panel-heading attendance-week-heading">
        <div>
          <p className="eyebrow">{isToday ? 'Today' : date}</p>
          <h4>Employee Status</h4>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-dark table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Working Hours</th>
              <th>Sessions</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>Loading attendance...</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7}>No active employees found.</td>
              </tr>
            ) : (
              rows.map(({ employee, record }) => {
                const hoursStatus = record ? getHoursStatus(record) : null
                return (
                  <tr key={employee._id}>
                    <td>
                      <Link className="table-link activity-row-name" to={`/dashboard/employees/${employee.employeeId}`}>
                        <PerfAvatar name={employee.name} size="sm" />
                        {employee.name}
                      </Link>
                    </td>
                    <td>{employee.department}</td>
                    <td>{record ? formatTimeDisplay(record.checkIn) : '—'}</td>
                    <td>{record ? formatTimeDisplay(record.checkOut) : '—'}</td>
                    <td>{record ? formatHours(record.workingHours) : '—'}</td>
                    <td>{record ? `${record.sessionsUsed ?? 0}/${record.maxSessionsPerDay ?? MAX_SESSIONS_PER_DAY}` : '—'}</td>
                    <td>
                      {record ? (
                        hoursStatus ? (
                          <span className={`pill ${hoursStatusPillClass(hoursStatus)}`}>{HOURS_STATUS_LABEL[hoursStatus]}</span>
                        ) : (
                          <span className={`pill ${statusPillClass(record.status)}`}>{record.status}</span>
                        )
                      ) : (
                        <span className="pill pill-muted">Not Checked In</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TeamAttendanceOverview
