import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../../../utils/Button/button'
import SectionTabs from '../../../utils/SectionTabs/sectionTabs'
import useApi from '../../../hooks/useApi'
import { IconCalendar, IconClock, IconSparkle, IconTarget } from '../../Layout/Sidebar/icons'
import {
  ATTENDANCE_STATUS,
  MAX_SESSIONS_PER_DAY,
  REQUIRED_WORKING_HOURS,
  canStartNewSession,
  formatDateDisplay,
  formatHours,
  formatTimeDisplay,
  getAttendanceTabs,
  getDateKey,
  getHoursStatus,
  getMonthDates,
  getOvertimeHours,
  getRemainingHours,
  HOURS_STATUS_LABEL,
  hoursStatusPillClass,
  isWeekday,
  monthValueOf,
  previousMonthValue,
  statusPillClass,
} from '../attendanceStore'

const QUOTES = [
  'Discipline is the bridge between goals and accomplishment.',
  'Small daily improvements lead to stunning results over time.',
  'Consistency is what turns average into excellence.',
  "Don't watch the clock; do what it does — keep going.",
  'Success is the sum of small efforts, repeated day in and day out.',
]

const dailyQuote = () => {
  const start = new Date(new Date().getFullYear(), 0, 0)
  const dayOfYear = Math.floor((Date.now() - start.getTime()) / 86400000)
  return QUOTES[dayOfYear % QUOTES.length]
}

const greetingForHour = (hour) => {
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

const HISTORY_FILTERS = [
  { value: 'all', label: 'All' },
  { value: ATTENDANCE_STATUS.PRESENT, label: 'Present' },
  { value: ATTENDANCE_STATUS.ABSENT, label: 'Absent' },
  { value: 'short', label: 'Short Hours' },
  { value: ATTENDANCE_STATUS.ON_LEAVE, label: 'On Leave' },
]

// Greeting card: live clock, date, and a rotating daily quote — the
// left-most panel of the "today" hero row.
function GreetingCard() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="attendance-hero-clock">
      <span className="attendance-hero-blob attendance-hero-blob--a" aria-hidden="true" />
      <span className="attendance-hero-blob attendance-hero-blob--b" aria-hidden="true" />
      <p className="attendance-greeting-text">{greetingForHour(now.getHours())} 👋</p>
      <p className="attendance-clock-time">
        {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </p>
      <p className="attendance-clock-date">
        {now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
      <blockquote className="attendance-quote">“{dailyQuote()}”</blockquote>
    </div>
  )
}

// Ticks the current open session's elapsed hours forward every 30s, purely
// for display — the backend recomputes the authoritative total once that
// session is actually checked out. There is no fixed shift end time, so
// this simply reflects elapsed time since the session's check-in.
const useLiveElapsedHours = (openSessionCheckIn) => {
  const [elapsedHours, setElapsedHours] = useState(0)

  useEffect(() => {
    if (!openSessionCheckIn) {
      setElapsedHours(0)
      return undefined
    }
    const tick = () => {
      const [h, m] = openSessionCheckIn.split(':').map(Number)
      const started = new Date()
      started.setHours(h, m, 0, 0)
      setElapsedHours(Math.max(0, (Date.now() - started.getTime()) / 3600000))
    }
    tick()
    const timer = setInterval(tick, 30000)
    return () => clearInterval(timer)
  }, [openSessionCheckIn])

  return elapsedHours
}

// Small ring showing hours worked so far against the 8h goal — reads at a
// glance instead of making someone parse a "Xh Ym / 8h" line of text.
function HoursGauge({ percent, label, sub }) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0))
  const size = 104
  const stroke = 10
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - clamped / 100)

  return (
    <div className="attendance-gauge">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${Math.round(clamped)} percent of daily goal`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--p-100)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--p)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 420ms var(--ease)' }}
        />
      </svg>
      <div className="attendance-gauge-label">
        <strong>{label}</strong>
        <span>{sub}</span>
      </div>
    </div>
  )
}

function DateNav({ selectedDate, todayKey, onChange, onShift, onToday }) {
  const isToday = selectedDate === todayKey

  return (
    <div className="attendance-datenav">
      <label className="attendance-datenav-field">
        <IconCalendar />
        <input type="date" value={selectedDate} max={todayKey} onChange={(event) => onChange(event.target.value)} />
      </label>
      <button type="button" className="attendance-datenav-btn" onClick={() => onShift(-1)} aria-label="Previous day">
        ‹
      </button>
      <button
        type="button"
        className="attendance-datenav-btn"
        onClick={() => onShift(1)}
        disabled={isToday}
        aria-label="Next day"
      >
        ›
      </button>
      <Button onClick={onToday}>Today</Button>
    </div>
  )
}

// Exported so the Employee Details > Attendance tab can reuse the exact
// same per-session check-in/out breakdown instead of re-deriving it.
export function SessionRows({ sessions }) {
  if (sessions.length === 0) {
    return (
      <div className="attendance-time-chips">
        <div className="attendance-time-chip">
          <span className="attendance-time-chip-label">Check In</span>
          <strong>—</strong>
        </div>
        <span className="attendance-time-chip-arrow" aria-hidden="true">
          →
        </span>
        <div className="attendance-time-chip">
          <span className="attendance-time-chip-label">Check Out</span>
          <strong>—</strong>
        </div>
      </div>
    )
  }

  return sessions.map((session, index) => (
    <div className="attendance-time-chips" key={`${session.checkIn}-${index}`}>
      <span className="attendance-session-index">#{index + 1}</span>
      <div className="attendance-time-chip">
        <span className="attendance-time-chip-label">Check In</span>
        <strong>{formatTimeDisplay(session.checkIn)}</strong>
      </div>
      <span className="attendance-time-chip-arrow" aria-hidden="true">
        →
      </span>
      <div className="attendance-time-chip">
        <span className="attendance-time-chip-label">Check Out</span>
        <strong>{session.checkOut ? formatTimeDisplay(session.checkOut) : 'In progress'}</strong>
      </div>
    </div>
  ))
}

function DayDetailModal({ record, onClose }) {
  if (!record) return null

  const sessions = record.sessions?.length ? record.sessions : record.checkIn ? [{ checkIn: record.checkIn, checkOut: record.checkOut }] : []
  const hoursStatus = getHoursStatus(record)

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
          <span className={`pill ${hoursStatus ? hoursStatusPillClass(hoursStatus) : statusPillClass(record.status)}`}>
            {hoursStatus ? HOURS_STATUS_LABEL[hoursStatus] : record.status}
          </span>
          <span className="attendance-session-count">{formatHours(record.workingHours)} worked</span>
        </div>

        <div className="attendance-sessions" style={{ marginTop: 14 }}>
          {sessions.length === 0 ? <p className="form-hint">No check-ins recorded for this day.</p> : <SessionRows sessions={sessions} />}
        </div>
      </div>
    </div>
  )
}

function CheckInOut() {
  const { checkInAttendance, checkOutAttendance, getMyAttendance } = useApi()

  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => getDateKey())
  const [historyFilter, setHistoryFilter] = useState('all')
  const [viewRecord, setViewRecord] = useState(null)

  const todayKey = getDateKey()
  const isViewingToday = selectedDate === todayKey

  // Covers the current month plus the previous one, in a single fetch, so
  // the stat cards below can compare this month/week against the last.
  const [fetchRange] = useState(() => {
    const now = new Date()
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return { from: getDateKey(prevMonthStart), to: getDateKey(now) }
  })

  const selectedRecord = useMemo(() => history.find((item) => item.date === selectedDate) || null, [history, selectedDate])

  const refresh = useCallback(async () => {
    setError('')
    try {
      const data = await getMyAttendance({ from: fetchRange.from, to: fetchRange.to })
      setHistory(data.attendance || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [getMyAttendance, fetchRange])

  useEffect(() => {
    refresh()
  }, [refresh])

  const sessions = selectedRecord?.sessions || []
  const sessionsUsed = selectedRecord?.sessionsUsed ?? sessions.length
  const maxSessions = selectedRecord?.maxSessionsPerDay ?? MAX_SESSIONS_PER_DAY
  const lastSession = sessions[sessions.length - 1] || null
  const canCheckInAgain = isViewingToday && canStartNewSession(selectedRecord)
  const isOpenSession = isViewingToday && Boolean(selectedRecord?.hasOpenSession)

  const elapsedHours = useLiveElapsedHours(isOpenSession ? lastSession?.checkIn : null)

  const handleCheckIn = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      await checkInAttendance()
      toast.success('Checked in successfully.')
      refresh()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCheckOut = async () => {
    if (submitting) return
    setSubmitting(true)
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
    } finally {
      setSubmitting(false)
    }
  }

  const handleShiftDate = (deltaDays) => {
    const d = new Date(`${selectedDate}T00:00:00`)
    d.setDate(d.getDate() + deltaDays)
    const next = getDateKey(d)
    if (next > todayKey) return
    setSelectedDate(next)
  }

  // Hours worked for the selected day — every closed session's duration
  // (final, from the backend) plus a live estimate if today's session is
  // still open. Required/short/overtime are always graded against this.
  const workingHours = (selectedRecord?.workingHours || 0) + elapsedHours
  const remainingHours = getRemainingHours(workingHours)
  const overtimeHours = getOvertimeHours(workingHours)
  const goalPercent = (workingHours / REQUIRED_WORKING_HOURS) * 100

  const hoursStatus = getHoursStatus(selectedRecord)
  const statusLabel = hoursStatus ? HOURS_STATUS_LABEL[hoursStatus] : 'Not Checked In'
  const statusClass = hoursStatus ? hoursStatusPillClass(hoursStatus) : 'pill-muted'
  const heroTitle = isViewingToday ? "Today's Check-ins" : `${formatDateDisplay(selectedDate)} Check-ins`

  // ---- Stat cards: this week's hours, this month's present days, average
  // daily hours, and overtime — each compared against the prior period
  // where that comparison makes sense, all derived from the one fetch.
  const stats = useMemo(() => {
    const byDate = new Map(history.map((item) => [item.date, item]))
    const hoursOn = (dateKey) => byDate.get(dateKey)?.workingHours || 0
    const statusOn = (dateKey) => byDate.get(dateKey)?.status

    const weekDatesEndingToday = (endDate) =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(`${endDate}T00:00:00`)
        d.setDate(d.getDate() - i)
        return getDateKey(d)
      })

    const thisWeekDates = weekDatesEndingToday(todayKey)
    const lastWeekEnd = (() => {
      const d = new Date(`${todayKey}T00:00:00`)
      d.setDate(d.getDate() - 7)
      return getDateKey(d)
    })()
    const lastWeekDates = weekDatesEndingToday(lastWeekEnd)

    const thisWeekHours = thisWeekDates.reduce((sum, d) => sum + hoursOn(d), 0)
    const lastWeekHours = lastWeekDates.reduce((sum, d) => sum + hoursOn(d), 0)
    const weekTrend = lastWeekHours > 0 ? Math.round(((thisWeekHours - lastWeekHours) / lastWeekHours) * 100) : null

    const thisMonthValue = monthValueOf(new Date())
    const lastMonthValue = previousMonthValue(thisMonthValue)
    const thisMonthDates = getMonthDates(thisMonthValue)
    const lastMonthDates = getMonthDates(lastMonthValue)

    const workingDaysThisMonth = thisMonthDates.filter(isWeekday).length
    const presentDaysThisMonth = thisMonthDates.filter((d) => statusOn(d) === ATTENDANCE_STATUS.PRESENT).length
    const presentDaysLastMonth = lastMonthDates.filter((d) => statusOn(d) === ATTENDANCE_STATUS.PRESENT).length

    const thisMonthHours = thisMonthDates.reduce((sum, d) => sum + hoursOn(d), 0)
    const lastMonthHours = lastMonthDates.reduce((sum, d) => sum + hoursOn(d), 0)

    const avgThisMonth = presentDaysThisMonth > 0 ? thisMonthHours / presentDaysThisMonth : 0
    const avgLastMonth = presentDaysLastMonth > 0 ? lastMonthHours / presentDaysLastMonth : 0
    const avgTrend = avgLastMonth > 0 ? Math.round(((avgThisMonth - avgLastMonth) / avgLastMonth) * 100) : null

    const overtimeThisMonth = thisMonthDates.reduce((sum, d) => sum + getOvertimeHours(hoursOn(d)), 0)

    return [
      {
        label: 'Total Working Hours',
        period: 'This Week',
        value: formatHours(thisWeekHours),
        trend: weekTrend,
        trendLabel: 'from last week',
        caption: "This week's total",
        icon: IconClock,
        tone: 'primary',
      },
      {
        label: 'Total Days',
        period: 'This Month',
        value: `${presentDaysThisMonth} / ${workingDaysThisMonth}`,
        caption: 'Present days',
        icon: IconCalendar,
        tone: 'green',
      },
      {
        label: 'Average Daily Hours',
        value: formatHours(avgThisMonth),
        trend: avgTrend,
        trendLabel: 'from last month',
        caption: "This month's average",
        icon: IconTarget,
        tone: 'blue',
      },
      {
        label: 'Overtime Hours',
        value: formatHours(overtimeThisMonth),
        caption: 'This Month',
        icon: IconSparkle,
        tone: 'amber',
      },
    ]
  }, [history, todayKey])

  const filteredHistory = useMemo(() => {
    if (historyFilter === 'all') return history
    if (historyFilter === 'short') return history.filter((item) => getHoursStatus(item) === 'short')
    return history.filter((item) => item.status === historyFilter)
  }, [history, historyFilter])

  return (
    <div className="panel detail-panel">
      <div className="attendance-page-nav">
        <SectionTabs tabs={getAttendanceTabs(false)} />
        <DateNav
          selectedDate={selectedDate}
          todayKey={todayKey}
          onChange={setSelectedDate}
          onShift={handleShiftDate}
          onToday={() => setSelectedDate(todayKey)}
        />
      </div>

      <div className="panel-heading">
        <div>
          <p className="eyebrow">Attendance</p>
          <h3>My Attendance</h3>
          <p className="form-hint">Track your working hours, check-in/out time and attendance history.</p>
        </div>
      </div>

      {error ? <div className="feedback-banner feedback-banner-error">{error}</div> : null}

      {loading ? (
        <p>Loading attendance...</p>
      ) : (
        <>
          <div className="attendance-hero">
            <GreetingCard />

            <div className="attendance-hero-status">
              <div className="attendance-hero-status-top">
                <div className="attendance-hero-status-title">
                  <h4>{heroTitle}</h4>
                  <span className={`pill ${statusClass}`}>{statusLabel}</span>
                </div>
                <span className="attendance-session-count">
                  {sessionsUsed}/{maxSessions} check-ins used
                </span>
              </div>

              <div className="attendance-sessions">
                <SessionRows sessions={sessions} />
              </div>

              {!isViewingToday ? (
                <span className="form-hint">Viewing a past day — check-in/out is only available for today.</span>
              ) : overtimeHours > 0 ? (
                <span className="form-hint attendance-hint-positive">+{formatHours(overtimeHours)} overtime today</span>
              ) : selectedRecord?.checkIn && remainingHours > 0 ? (
                <span className="form-hint">
                  {formatHours(remainingHours)} left to reach the {REQUIRED_WORKING_HOURS}h goal
                  {isOpenSession ? ' (estimate)' : ''}
                </span>
              ) : null}

              {isViewingToday ? (
                <div className="action-row">
                  {isOpenSession ? (
                    <Button onClick={handleCheckOut} disabled={submitting}>
                      {submitting ? 'Checking Out...' : 'Check Out'}
                    </Button>
                  ) : canCheckInAgain ? (
                    <Button onClick={handleCheckIn} disabled={submitting}>
                      {submitting ? 'Checking In...' : sessionsUsed === 0 ? 'Check In' : 'Check In Again'}
                    </Button>
                  ) : (
                    <span className="pill pill-success">All {maxSessions} check-ins used for today</span>
                  )}
                </div>
              ) : null}
            </div>

            <div className="attendance-hero-gauge">
              <HoursGauge percent={goalPercent} label={formatHours(workingHours)} sub={`of ${REQUIRED_WORKING_HOURS}h goal`} />
              <p className="attendance-goal-hint">
                {remainingHours > 0
                  ? `${formatHours(remainingHours)} left to reach the ${REQUIRED_WORKING_HOURS}h goal`
                  : `${REQUIRED_WORKING_HOURS}h goal reached`}
              </p>
              <div className="attendance-goal-bar-track">
                <div className="attendance-goal-bar-fill" style={{ width: `${Math.min(100, Math.max(0, goalPercent))}%` }} />
              </div>
              <span className="attendance-goal-bar-pct">{Math.min(100, Math.round(goalPercent))}%</span>

              <div className="attendance-keepgoing">
                <span className="attendance-keepgoing-badge">
                  <IconCalendar />
                </span>
                <p className="attendance-keepgoing-text">Keep Going!</p>
              </div>
            </div>
          </div>

          <section className="stats-grid attendance-stats-grid">
            {stats.map((item) => (
              <article className="stat-card" key={item.label}>
                <div className="stat-card-head">
                  <span className={`stat-card-icon stat-card-icon--${item.tone}`}>
                    <item.icon />
                  </span>
                  {item.period ? <span className="attendance-stat-period">{item.period}</span> : null}
                </div>
                <p>{item.label}</p>
                <h2>{item.value}</h2>
                {item.trend != null ? (
                  <span className={`attendance-stat-trend ${item.trend >= 0 ? 'is-up' : 'is-down'}`}>
                    {item.trend >= 0 ? '↑' : '↓'} {Math.abs(item.trend)}%{' '}
                    <span className="attendance-stat-trend-label">{item.trendLabel}</span>
                  </span>
                ) : (
                  <span>{item.caption}</span>
                )}
              </article>
            ))}
          </section>

          <div className="panel-heading attendance-week-heading">
            <div>
              <p className="eyebrow">Your Attendance History</p>
              <h4>A detailed view of your attendance records</h4>
            </div>
            <div className="range-toggle">
              {HISTORY_FILTERS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={historyFilter === option.value ? 'is-active' : ''}
                  onClick={() => setHistoryFilter(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Sessions</th>
                  <th>Working Hours</th>
                  <th>Overtime</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={9}>No attendance records found.</td>
                  </tr>
                ) : (
                  filteredHistory.map((item) => {
                    const itemHoursStatus = getHoursStatus(item)
                    const itemOvertime = getOvertimeHours(item.workingHours || 0)
                    const dayName = new Date(`${item.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long' })

                    return (
                      <tr key={item.date} className={item.date === todayKey ? 'attendance-row-today' : ''}>
                        <td>
                          {formatDateDisplay(item.date)}
                          {item.date === todayKey ? <span className="pill pill-muted attendance-today-tag">Today</span> : null}
                        </td>
                        <td>{dayName}</td>
                        <td>{formatTimeDisplay(item.checkIn)}</td>
                        <td>{formatTimeDisplay(item.checkOut)}</td>
                        <td>
                          {item.sessionsUsed ?? (item.checkIn ? 1 : 0)}/{item.maxSessionsPerDay ?? MAX_SESSIONS_PER_DAY}
                        </td>
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
                        <td>
                          <Button variant="view" onClick={() => setViewRecord(item)}>
                            View
                          </Button>
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

      <DayDetailModal record={viewRecord} onClose={() => setViewRecord(null)} />
    </div>
  )
}

export default CheckInOut
