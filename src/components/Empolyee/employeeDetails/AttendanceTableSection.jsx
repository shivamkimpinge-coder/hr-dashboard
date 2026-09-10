import { useCallback, useEffect, useMemo, useState } from 'react'
import useApi from '../../../hooks/useApi'
import Button from '../../../utils/Button/button'
import { SessionRows } from '../../Attendance/checkInOut'
import { IconCalendar, IconChevronLeft, IconChevronRight, IconClock, IconTrendingUp, IconUserOff } from '../../Layout/Sidebar/icons'
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
} from '../../Attendance/attendanceStore'
import AttendanceCalendar from './AttendanceCalendar'

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

// A finished full-length day just reads as its plain status ("Present") —
// only an open session or an under-hours day gets the hours-based wording.
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

  const [draftFrom, setDraftFrom] = useState(defaultRange.from)
  const [draftTo, setDraftTo] = useState(defaultRange.to)
  const [appliedRange, setAppliedRange] = useState(defaultRange)
  const [fieldError, setFieldError] = useState('')

  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [viewRecord, setViewRecord] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listAttendance({ employeeId, from: appliedRange.from, to: appliedRange.to })
      setRecords(data.attendance || [])
      setPage(1)
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

  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageRecords = sortedRecords.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const firstShown = sortedRecords.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const lastShown = Math.min(currentPage * PAGE_SIZE, sortedRecords.length)

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
        <div className="col-xl-8">
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
                  ) : pageRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6}>No attendance records found for the selected date range.</td>
                    </tr>
                  ) : (
                    pageRecords.map((record) => (
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

            {sortedRecords.length > 0 ? (
              <div className="emp-pagination">
                <p>
                  Showing {firstShown} to {lastShown} of {sortedRecords.length} records
                </p>
                <div className="emp-pager">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                  >
                    <IconChevronLeft />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={n === currentPage ? 'is-active' : ''}
                      onClick={() => setPage(n)}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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

        <div className="col-xl-4">
          <AttendanceCalendar employeeId={employeeId} onSelectDay={(_, record) => record && setViewRecord(record)} />
        </div>
      </div>

      <DayDetailModal record={viewRecord} onClose={() => setViewRecord(null)} />
    </>
  )
}

export default AttendanceTableSection
