import { useCallback, useEffect, useMemo, useState } from 'react'
import { isManagerRole } from '../../../utils/roles'
import SectionTabs from '../../../utils/SectionTabs/sectionTabs'
import useApi from '../../../hooks/useApi'
import { IconAlertTriangle, IconClock, IconUserCheck, IconUserOff } from '../../Layout/Sidebar/icons'
import {
  formatDateDisplay,
  formatHours,
  formatTimeDisplay,
  getAttendanceTabs,
  getDateKey,
  getHoursStatus,
  getMonthDates,
  getOvertimeHours,
  getWeekDates,
  HOURS_STATUS_LABEL,
  hoursStatusPillClass,
  statusPillClass,
  summarizeByEmployee,
} from '../../../utils/AttendanceUtils/attendanceStore'

const PERIODS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

const currentMonthValue = () => getDateKey().slice(0, 7)

function StatCards({ stats }) {
  return (
    <section className="stats-grid">
      {stats.map((item) => (
        <article className={`stat-card stat-card--${item.tone}`} key={item.label}>
          <div className="stat-card-head">
            <span className="stat-card-icon">
              <item.icon />
            </span>
            <p>{item.label}</p>
          </div>
          <h2>{item.value}</h2>
          <span className="stat-card-trend">{item.trend}</span>
        </article>
      ))}
    </section>
  )
}

function AttendanceReports({ currentUser }) {
  const isManager = isManagerRole(currentUser)
  const { listAttendance, getMyAttendance } = useApi()

  const [period, setPeriod] = useState('daily')
  const [day, setDay] = useState(getDateKey())
  const [weekAnchor, setWeekAnchor] = useState(getDateKey())
  const [month, setMonth] = useState(currentMonthValue())
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const range = useMemo(() => {
    if (period === 'daily') return { from: day, to: day, dates: [day] }
    if (period === 'weekly') {
      const dates = getWeekDates(weekAnchor)
      return { from: dates[0], to: dates[dates.length - 1], dates }
    }
    const dates = getMonthDates(month)
    return { from: dates[0], to: dates[dates.length - 1], dates }
  }, [period, day, weekAnchor, month])

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = isManager
        ? await listAttendance({ from: range.from, to: range.to })
        : await getMyAttendance({ from: range.from, to: range.to })
      setRecords(data.attendance || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [isManager, range, listAttendance, getMyAttendance])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const stats = useMemo(() => {
    const present = records.filter((r) => r.status === 'Present').length
    const absent = records.filter((r) => r.status === 'Absent').length
    const shortHoursCount = records.filter((r) => getHoursStatus(r) === 'short').length
    const totalOvertime = records.reduce((sum, r) => sum + getOvertimeHours(r.workingHours), 0)

    return [
      { label: 'Present', value: present, trend: `${range.dates.length} day period`, icon: IconUserCheck, tone: 'green' },
      { label: 'Absent', value: absent, trend: 'Marked absent', icon: IconUserOff, tone: absent > 0 ? 'red' : 'slate' },
      {
        label: 'Short Hours Days',
        value: shortHoursCount,
        trend: 'Below 8h required',
        icon: IconAlertTriangle,
        tone: shortHoursCount > 0 ? 'amber' : 'slate',
      },
      { label: 'Total Overtime', value: formatHours(totalOvertime), trend: 'Beyond 8h required', icon: IconClock, tone: 'purple' },
    ]
  }, [records, range.dates.length])

  const employeeSummaries = useMemo(() => summarizeByEmployee(records), [records])

  return (
    <div className="panel detail-panel">
      <SectionTabs tabs={getAttendanceTabs(isManager)} />

      <div className="panel-heading">
        <div>
          <p className="eyebrow">Attendance</p>
          <h3>Attendance Reports</h3>
        </div>
      </div>

      <div className="report-tabs">
        {PERIODS.map((item) => (
          <button
            key={item.value}
            type="button"
            className={`report-tab ${period === item.value ? 'report-tab-active' : ''}`}
            onClick={() => setPeriod(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="form-field filter-field">
        {period === 'daily' ? (
          <>
            <label htmlFor="report-day">Date</label>
            <input id="report-day" type="date" max={getDateKey()} value={day} onChange={(e) => setDay(e.target.value)} />
          </>
        ) : null}
        {period === 'weekly' ? (
          <>
            <label htmlFor="report-week">Any day in the week</label>
            <input
              id="report-week"
              type="date"
              max={getDateKey()}
              value={weekAnchor}
              onChange={(e) => setWeekAnchor(e.target.value)}
            />
            <span className="form-hint">
              Week of {formatDateDisplay(range.dates[0])} – {formatDateDisplay(range.dates[range.dates.length - 1])}
            </span>
          </>
        ) : null}
        {period === 'monthly' ? (
          <>
            <label htmlFor="report-month">Month</label>
            <input
              id="report-month"
              type="month"
              max={currentMonthValue()}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </>
        ) : null}
      </div>

      {error ? <div className="feedback-banner feedback-banner-error">{error}</div> : null}

      <StatCards stats={stats} />

      <div className="table-responsive">
        {loading ? (
          <p>Loading attendance...</p>
        ) : period === 'daily' ? (
          <table className="table table-dark table-hover align-middle mb-0">
            <thead>
              <tr>
                {isManager ? <th>Employee</th> : null}
                <th>Check In</th>
                <th>Check Out</th>
                <th>Working Hours</th>
                <th>Status</th>
                <th>Hours Status</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={isManager ? 6 : 5}>No attendance records for this date.</td>
                </tr>
              ) : (
                records.map((record) => {
                  const hoursStatus = getHoursStatus(record)
                  const overtime = getOvertimeHours(record.workingHours)

                  return (
                    <tr key={`${record.employeeId}-${record.date}`}>
                      {isManager ? (
                        <td>
                          {record.employeeName} <span className="text-muted">({record.employeeId})</span>
                        </td>
                      ) : null}
                      <td>{formatTimeDisplay(record.checkIn)}</td>
                      <td>{formatTimeDisplay(record.checkOut)}</td>
                      <td>{formatHours(record.workingHours)}</td>
                      <td>
                        <span className={`pill ${statusPillClass(record.status)}`}>{record.status}</span>
                      </td>
                      <td>
                        {hoursStatus ? (
                          <span className={`pill ${hoursStatusPillClass(hoursStatus)}`}>
                            {HOURS_STATUS_LABEL[hoursStatus]}
                          </span>
                        ) : null}{' '}
                        {overtime > 0 ? <span className="pill pill-success">OT {formatHours(overtime)}</span> : null}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        ) : isManager ? (
          <table className="table table-dark table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Short Hours Days</th>
                <th>Total Hours</th>
                <th>Overtime</th>
              </tr>
            </thead>
            <tbody>
              {employeeSummaries.length === 0 ? (
                <tr>
                  <td colSpan={6}>No attendance records for this period.</td>
                </tr>
              ) : (
                employeeSummaries.map((summary) => (
                  <tr key={summary.employeeId}>
                    <td>
                      {summary.employeeName} <span className="text-muted">({summary.employeeId})</span>
                    </td>
                    <td>{summary.present}</td>
                    <td>{summary.absent}</td>
                    <td>{summary.shortHoursDays}</td>
                    <td>{formatHours(summary.totalHours)}</td>
                    <td>{formatHours(summary.overtimeHours)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="table table-dark table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Working Hours</th>
                <th>Overtime</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6}>No attendance records for this period.</td>
                </tr>
              ) : (
                records.map((record) => {
                  const hoursStatus = getHoursStatus(record)
                  const overtime = getOvertimeHours(record.workingHours)

                  return (
                  <tr key={record.date}>
                    <td>{formatDateDisplay(record.date)}</td>
                    <td>{formatTimeDisplay(record.checkIn)}</td>
                    <td>{formatTimeDisplay(record.checkOut)}</td>
                    <td>{formatHours(record.workingHours)}</td>
                    <td>{overtime > 0 ? formatHours(overtime) : '—'}</td>
                    <td>
                      {hoursStatus ? (
                        <span className={`pill ${hoursStatusPillClass(hoursStatus)}`}>
                          {HOURS_STATUS_LABEL[hoursStatus]}
                        </span>
                      ) : (
                        <span className={`pill ${statusPillClass(record.status)}`}>{record.status}</span>
                      )}
                    </td>
                  </tr>
                  )
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default AttendanceReports
