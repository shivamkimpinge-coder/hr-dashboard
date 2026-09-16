import { useCallback, useEffect, useMemo, useState } from 'react'
import useApi from '../../../hooks/useApi'
import Button from '../../../utils/Button/button'
import Pager from '../../../utils/Pagination/pager'
import { usePagination } from '../../../utils/Pagination/usePagination'
import { SessionRows } from '../../Attendance/checkInOut'
import { IconCalendar, IconClock, IconTrendingUp, IconUserOff } from '../../Layout/Sidebar/icons'
import {
  ATTENDANCE_STATUS,
  formatDateDisplay,
  formatHours,
  formatTimeDisplay,
  getDateKey,
  getHoursStatus,
  getMonthDates,
  HOURS_STATUS_LABEL,
  hoursStatusPillClass,
  monthValueOf,
  statusPillClass,
} from '../../../utils/AttendanceUtils/attendanceStore'

const PAGE_SIZE = 5

function StatCard({ icon: Icon, tone, label, value, sub }) {
  return (
    <article className={`emp-stat emp-stat--${tone}`}>
      <div className="emp-stat-head">
        <span className="emp-stat-icon">
          <Icon />
        </span>
        <p>{label}</p>
      </div>
      <h2>{value}</h2>
      <span>{sub}</span>
    </article>
  )
}

function StatusPill({ record }) {
  const hoursStatus = getHoursStatus(record)
  const useHoursLabel = hoursStatus === 'in-progress' || hoursStatus === 'short'
  const className = useHoursLabel ? hoursStatusPillClass(hoursStatus) : statusPillClass(record.status)
  const label = useHoursLabel ? HOURS_STATUS_LABEL[hoursStatus] : record.status

  return (
    <span className={`pill pill-dot ${className}`}>
      <i aria-hidden="true" />
      {label}
    </span>
  )
}

function DayDetailModal({ record, onClose }) {
  if (!record) return null

  const sessions = record.sessions?.length
    ? record.sessions
    : record.checkIn
      ? [{ checkIn: record.checkIn, checkOut: record.checkOut }]
      : []

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Attendance</p>
            <h3>{formatDateDisplay(record.date)}</h3>
          </div>
          <Button variant="close" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>

        <div className="attendance-hero-status-top">
          <StatusPill record={record} />
          <span className="attendance-session-count">{formatHours(record.workingHours)} worked</span>
        </div>

        <div className="attendance-sessions" style={{ marginTop: 14 }}>
          {sessions.length > 0 ? <SessionRows sessions={sessions} /> : <p className="form-hint">No sessions logged.</p>}
        </div>
      </div>
    </div>
  )
}

function AttendanceTableSection({ employeeId }) {
  const { listAttendance } = useApi()

  const defaultRange = useMemo(() => {
    const month = getMonthDates(monthValueOf())
    return { from: month[0], to: getDateKey() }
  }, [])
console.log('defaultRange:', defaultRange);
  const [draftFrom, setDraftFrom] = useState(defaultRange.from)
  const [draftTo, setDraftTo] = useState(defaultRange.to)
  const [appliedRange, setAppliedRange] = useState(defaultRange)
  const [fieldError, setFieldError] = useState('')

  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewRecord, setViewRecord] = useState(null)

  const refresh = useCallback(async () => {
    debugger;
    setLoading(true)
    setError('')
    try {
      const data = await listAttendance({ employeeId, from: appliedRange.from, to: appliedRange.to })
      console.log('Attendance data:', data);
      setRecords(data.attendance || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [listAttendance, employeeId, appliedRange])

  useEffect(() => {
    refresh()
  }, [refresh])

  const applyRange = () => {
    if (draftFrom > draftTo) {
      setFieldError('"From" date must be before "To" date.')
      return
    }
    setFieldError('')
    setAppliedRange({ from: draftFrom, to: draftTo })
  }

  const sortedRecords = useMemo(() => [...records].sort((a, b) => b.date.localeCompare(a.date)), [records])

  const stats = useMemo(() => {
    const total = sortedRecords.length
    const present = sortedRecords.filter(
      (r) => r.status === ATTENDANCE_STATUS.PRESENT || r.status === ATTENDANCE_STATUS.HALF_DAY
    ).length
    const absent = sortedRecords.filter((r) => r.status === ATTENDANCE_STATUS.ABSENT).length
    const short = sortedRecords.filter((r) => getHoursStatus(r) === 'short').length
    const pct = (n) => (total > 0 ? `${Math.round((n / total) * 100)}%` : '0%')

    return { total, present, absent, short, pct }
  }, [sortedRecords])

  const paged = usePagination(sortedRecords, PAGE_SIZE)

  return (
    <>
      <section className="emp-stats">
        <StatCard icon={IconCalendar} tone="blue" label="Total Days" value={stats.total} sub="In selected range" />
        <StatCard
          icon={IconTrendingUp}
          tone="green"
          label="Present Days"
          value={stats.present}
          sub={`${stats.pct(stats.present)} Attendance`}
        />
        <StatCard icon={IconUserOff} tone="red" label="Absent Days" value={stats.absent} sub={stats.pct(stats.absent)} />
        <StatCard icon={IconClock} tone="amber" label="Short Hours" value={stats.short} sub={stats.pct(stats.short)} />
      </section>

      <div className="row g-3 emp-overview-row">
        <div className="col-12">
          <div className="panel h-100">
            <div className="panel-heading emp-records-head">
              <h3>Attendance Records</h3>

              <div className="emp-filter">
                <div className="form-field">
                  <label htmlFor="attendance-table-from">From</label>
                  <input id="attendance-table-from" type="date" value={draftFrom} onChange={(e) => setDraftFrom(e.target.value)} />
                </div>
                <div className="form-field">
                  <label htmlFor="attendance-table-to">To</label>
                  <input id="attendance-table-to" type="date" value={draftTo} onChange={(e) => setDraftTo(e.target.value)} />
                </div>
                <Button onClick={applyRange}>Apply</Button>
              </div>
            </div>

            {fieldError ? <p className="field-error">{fieldError}</p> : null}
            {error ? <div className="feedback-banner feedback-banner-error">{error}</div> : null}

            <div className="table-responsive">
              <table className="table table-dark table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Working Hours</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6}>Loading attendance...</td>
                    </tr>
                  ) : paged.totalItems === 0 ? (
                    <tr>
                      <td colSpan={6}>No attendance records found for the selected date range.</td>
                    </tr>
                  ) : (
                    paged.pageItems.map((record) => (
                      <tr key={record._id || record.date}>
                        <td>{formatDateDisplay(record.date)}</td>
                        <td>{formatTimeDisplay(record.checkIn)}</td>
                        <td>{formatTimeDisplay(record.checkOut)}</td>
                        <td>{formatHours(record.workingHours)}</td>
                        <td>
                          <StatusPill record={record} />
                        </td>
                        <td>
                          <Button variant="view" onClick={() => setViewRecord(record)}>
                            View
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pager
              page={paged.page}
              pageSize={paged.pageSize}
              totalItems={paged.totalItems}
              totalPages={paged.totalPages}
              onChange={paged.setPage}
            />
          </div>
        </div>
      </div>

      <DayDetailModal record={viewRecord} onClose={() => setViewRecord(null)} />
    </>
  )
}

export default AttendanceTableSection
