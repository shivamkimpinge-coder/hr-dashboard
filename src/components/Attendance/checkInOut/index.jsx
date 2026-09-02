import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../../../utils/Button/button'
import SectionTabs from '../../../utils/SectionTabs/sectionTabs'
import useApi from '../../../hooks/useApi'
import {
  REQUIRED_WORKING_HOURS,
  formatDateDisplay,
  formatHours,
  formatTimeDisplay,
  getDateKey,
  getHoursStatus,
  getOvertimeHours,
  getRemainingHours,
  getWeekDates,
  HOURS_STATUS_LABEL,
  hoursStatusPillClass,
  statusPillClass,
} from '../attendanceStore'

function LiveClock() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="attendance-clock">
      <p className="attendance-clock-time">
        {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </p>
      <p className="attendance-clock-date">
        {now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
    </div>
  )
}

// Ticks the "working hours" figure forward every 30s while checked in but
// not yet checked out, purely for display — the backend recomputes the
// authoritative value once checkOut is actually recorded. There is no
// fixed shift end time, so this simply reflects elapsed time since check-in.
const useLiveElapsedHours = (checkIn, checkOut) => {
  const [elapsedHours, setElapsedHours] = useState(0)

  useEffect(() => {
    if (!checkIn || checkOut) return undefined
    const tick = () => {
      const [h, m] = checkIn.split(':').map(Number)
      const started = new Date()
      started.setHours(h, m, 0, 0)
      setElapsedHours(Math.max(0, (Date.now() - started.getTime()) / 3600000))
    }
    tick()
    const timer = setInterval(tick, 30000)
    return () => clearInterval(timer)
  }, [checkIn, checkOut])

  return elapsedHours
}

function HoursProgressBar({ workingHours, overtimeHours }) {
  const percent = Math.min(100, (workingHours / REQUIRED_WORKING_HOURS) * 100)

  return (
    <div className="hours-progress">
      <div className="hours-progress-track">
        <div className="hours-progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="hours-progress-meta">
        <span>
          {formatHours(workingHours)} / {REQUIRED_WORKING_HOURS}h
        </span>
        {overtimeHours > 0 ? <span className="hours-progress-overtime">+{formatHours(overtimeHours)} overtime</span> : null}
      </div>
    </div>
  )
}

function CheckInOut() {
  const { checkInAttendance, checkOutAttendance, getMyAttendance } = useApi()

  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const todayKey = getDateKey()
  const record = useMemo(() => history.find((item) => item.date === todayKey) || null, [history, todayKey])
  const weekHistory = useMemo(() => {
    const weekStart = getWeekDates()[0]
    return history.filter((item) => item.date >= weekStart)
  }, [history])

  const refresh = useCallback(async () => {
    setError('')
    try {
      const data = await getMyAttendance()
      setHistory(data.attendance || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [getMyAttendance])

  useEffect(() => {
    refresh()
  }, [refresh])

  const elapsedHours = useLiveElapsedHours(record?.checkIn, record?.checkOut)

  const handleCheckIn = async () => {
    try {
      await checkInAttendance()
      toast.success('Checked in successfully.')
      refresh()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleCheckOut = async () => {
    try {
      const data = await checkOutAttendance()
      const hours = data.attendance?.workingHours || 0
      if (hours >= REQUIRED_WORKING_HOURS) {
        const overtime = getOvertimeHours(hours)
        toast.success(
          overtime > 0 ? `Checked out. ${formatHours(overtime)} overtime today.` : 'Checked out. Required hours completed.'
        )
      } else {
        toast.success(`Checked out. ${formatHours(getRemainingHours(hours))} short of the required 8h.`)
      }
      refresh()
    } catch (err) {
      toast.error(err.message)
    }
  }

  // Hours worked so far — final (from the backend) once checked out, a live
  // estimate while still checked in, and 0 before check-in. Required/short/
  // overtime are always graded against this, never against a clock time.
  const workingHours = record?.checkOut ? record.workingHours || 0 : record?.checkIn ? elapsedHours : 0
  const remainingHours = getRemainingHours(workingHours)
  const overtimeHours = getOvertimeHours(workingHours)

  const hoursStatus = getHoursStatus(record)
  const statusLabel = hoursStatus ? HOURS_STATUS_LABEL[hoursStatus] : 'Not Checked In'
  const statusClass = hoursStatus ? hoursStatusPillClass(hoursStatus) : 'pill-muted'

  return (
    <div className="panel detail-panel">
      <SectionTabs
        tabs={[
          { label: 'My Attendance', to: '/dashboard/attendance', end: true },
          { label: 'Reports', to: '/dashboard/attendance/reports' },
        ]}
      />

      <div className="panel-heading">
        <div>
          <p className="eyebrow">Attendance</p>
          <h3>My Attendance</h3>
        </div>
      </div>

      {error ? <div className="feedback-banner feedback-banner-error">{error}</div> : null}

      {loading ? (
        <p>Loading attendance...</p>
      ) : (
        <>
          <div className="attendance-today">
            <LiveClock />

            <div className="detail-grid">
              <div className="detail-card">
                <p className="eyebrow">Today's Status</p>
                <p>
                  <span className={`pill ${statusClass}`}>{statusLabel}</span>
                </p>
                <p>
                  <strong>Check In:</strong> {formatTimeDisplay(record?.checkIn)}
                </p>
                <p>
                  <strong>Check Out:</strong> {formatTimeDisplay(record?.checkOut)}
                </p>
                <p>
                  <strong>Working Hours:</strong> {formatHours(workingHours)}
                  {record?.checkIn && !record?.checkOut ? ' (estimate)' : ''}
                </p>
                <p>
                  <strong>Required Hours:</strong> {REQUIRED_WORKING_HOURS}h
                </p>
                {remainingHours > 0 ? (
                  <p>
                    <strong>Remaining Hours:</strong> {formatHours(remainingHours)}
                  </p>
                ) : null}
                {overtimeHours > 0 ? (
                  <p>
                    <strong>Overtime:</strong> {formatHours(overtimeHours)}
                  </p>
                ) : null}

                <HoursProgressBar workingHours={workingHours} overtimeHours={overtimeHours} />
              </div>

              <div className="detail-card">
                <p className="eyebrow">Summary</p>
                {!record?.checkIn ? (
                  <p>Check in to see today's summary.</p>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    <span className={`pill ${statusClass}`}>{statusLabel}</span>
                    {overtimeHours > 0 ? (
                      <span className="pill pill-success">Overtime: {formatHours(overtimeHours)}</span>
                    ) : null}
                    {!record?.checkOut ? <span className="form-hint">Estimate — check out to finalize.</span> : null}
                  </div>
                )}
              </div>
            </div>

            <div className="action-row">
              {!record?.checkIn ? (
                <Button onClick={handleCheckIn}>Check In</Button>
              ) : !record?.checkOut ? (
                <Button onClick={handleCheckOut}>Check Out</Button>
              ) : (
                <p className="form-hint">Attendance completed for today.</p>
              )}
            </div>
          </div>

          <p className="eyebrow" style={{ marginTop: '1.5rem' }}>
            This Week
          </p>
          <div className="table-responsive">
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
                {weekHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No attendance recorded this week yet.</td>
                  </tr>
                ) : (
                  weekHistory.map((item) => {
                    const itemHoursStatus = getHoursStatus(item)
                    const itemOvertime = getOvertimeHours(item.workingHours || 0)

                    return (
                      <tr key={item.date}>
                        <td>{formatDateDisplay(item.date)}</td>
                        <td>{formatTimeDisplay(item.checkIn)}</td>
                        <td>{formatTimeDisplay(item.checkOut)}</td>
                        <td>{formatHours(item.workingHours)}</td>
                        <td>{itemOvertime > 0 ? formatHours(itemOvertime) : '—'}</td>
                        <td>
                          {itemHoursStatus ? (
                            <span className={`pill ${hoursStatusPillClass(itemHoursStatus)}`}>
                              {HOURS_STATUS_LABEL[itemHoursStatus]}
                            </span>
                          ) : (
                            <span className={`pill ${statusPillClass(item.status)}`}>{item.status}</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

export default CheckInOut
