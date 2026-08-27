import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../../../utils/Button/button'
import useApi from '../../../hooks/useApi'
import {
  formatDateDisplay,
  formatHours,
  formatTimeDisplay,
  getDateKey,
  getWeekDates,
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
// authoritative value once checkOut is actually recorded.
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

function CheckInOut({ currentUser }) {
  const isAdmin = currentUser?.role === 'Admin'
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
      const flags = [data.attendance?.isLate && 'Late entry', data.attendance?.isEarlyExit && 'Early exit']
        .filter(Boolean)
        .join(' · ')
      toast.success(flags ? `Checked out. ${flags} noted.` : 'Checked out successfully.')
      refresh()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const status = !record?.checkIn ? 'Not Checked In' : !record?.checkOut ? 'Checked In' : 'Checked Out'
  const todayPillClass = !record?.checkIn ? 'pill-muted' : !record?.checkOut ? 'pill-warning' : 'pill-success'

  return (
    <div className="panel detail-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Attendance</p>
          <h3>Mark Attendance</h3>
        </div>
        <div className="action-row">
          {isAdmin ? (
            <Button variant="secondary" to="/dashboard/attendance/mark">
              Mark for Employee
            </Button>
          ) : null}
          <Button to="/dashboard/attendance/reports">View Reports</Button>
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
                  <span className={`pill ${todayPillClass}`}>{status}</span>
                </p>
                <p>
                  <strong>Check In:</strong> {formatTimeDisplay(record?.checkIn)}
                </p>
                <p>
                  <strong>Check Out:</strong> {formatTimeDisplay(record?.checkOut)}
                </p>
                <p>
                  <strong>Working Hours:</strong> {formatHours(record?.checkOut ? record.workingHours : elapsedHours)}
                  {record?.checkIn && !record?.checkOut ? ' (running)' : ''}
                </p>
              </div>

              <div className="detail-card">
                <p className="eyebrow">Flags</p>
                {!record?.checkOut ? (
                  <p>Check out to see today's overtime and timing flags.</p>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    <span className={`pill ${record.isLate ? 'pill-warning' : 'pill-success'}`}>
                      {record.isLate ? 'Late Entry' : 'On Time'}
                    </span>
                    <span className={`pill ${record.isEarlyExit ? 'pill-danger' : 'pill-success'}`}>
                      {record.isEarlyExit ? 'Early Exit' : 'Full Shift'}
                    </span>
                    {record.overtimeHours > 0 ? (
                      <span className="pill pill-success">Overtime: {formatHours(record.overtimeHours)}</span>
                    ) : null}
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
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {weekHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5}>No attendance recorded this week yet.</td>
                  </tr>
                ) : (
                  weekHistory.map((item) => (
                    <tr key={item.date}>
                      <td>{formatDateDisplay(item.date)}</td>
                      <td>{formatTimeDisplay(item.checkIn)}</td>
                      <td>{formatTimeDisplay(item.checkOut)}</td>
                      <td>{formatHours(item.workingHours)}</td>
                      <td>
                        <span className={`pill ${statusPillClass(item.status)}`}>{item.status}</span>
                      </td>
                    </tr>
                  ))
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
