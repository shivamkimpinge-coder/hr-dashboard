// Shared display helpers + constants for the Attendance UI. Actual data
// comes from the backend (/api/attendance, via useApi) — this module only
// formats and groups what the API returns. Records from the API already
// carry derived workingHours/overtimeHours/isLate/isEarlyExit fields.

export const ATTENDANCE_STATUS = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  HALF_DAY: 'Half Day',
  ON_LEAVE: 'On Leave',
}

export const ATTENDANCE_STATUSES = Object.values(ATTENDANCE_STATUS)

// Admin/HR land on the team overview + get a "Mark Attendance" tab; a plain
// employee only ever sees their own check-in history. Shared by every page
// in this module so the tab set stays identical wherever it appears.
export const getAttendanceTabs = (isManager) =>
  isManager
    ? [
        { label: 'Team Overview', to: '/dashboard/attendance', end: true },
        { label: 'Mark Attendance', to: '/dashboard/attendance/mark' },
        { label: 'Reports', to: '/dashboard/attendance/reports' },
      ]
    : [
        { label: 'My Attendance', to: '/dashboard/attendance', end: true },
        { label: 'Reports', to: '/dashboard/attendance/reports' },
      ]

const pad2 = (value) => String(value).padStart(2, '0')

export const getDateKey = (date = new Date()) => {
  const d = new Date(date)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export const formatHours = (hours) => {
  if (!hours || hours <= 0) return '0h 0m'
  let wholeHours = Math.floor(hours)
  let minutes = Math.round((hours - wholeHours) * 60)
  // Rounding minutes up can land exactly on 60 (e.g. 7h 59.6m) — carry
  // that into the next hour instead of ever displaying "60m".
  if (minutes === 60) {
    minutes = 0
    wholeHours += 1
  }
  return `${wholeHours}h ${minutes}m`
}

export const formatTimeDisplay = (time) => {
  if (!time) return '—'
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  return `${hour12}:${pad2(minutes)} ${period}`
}

export const formatDateDisplay = (dateKey) => {
  if (!dateKey) return ''
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export const statusPillClass = (status) => {
  switch (status) {
    case ATTENDANCE_STATUS.PRESENT:
      return 'pill-success'
    case ATTENDANCE_STATUS.HALF_DAY:
      return 'pill-warning'
    case ATTENDANCE_STATUS.ABSENT:
      return 'pill-danger'
    default:
      return 'pill-muted' // On Leave
  }
}

// Flexible working hours: there is no fixed shift start/end time, so a day
// is graded purely on total hours worked against this requirement — never
// against a clock-in/clock-out cutoff.
export const REQUIRED_WORKING_HOURS = 8

// An employee may check in/out up to this many times per day (e.g. to cover
// breaks) — mirrors the backend's Attendance.MAX_SESSIONS_PER_DAY. The
// backend always echoes the real cap on a record as `maxSessionsPerDay`;
// this is only the fallback for a day with no record yet.
export const MAX_SESSIONS_PER_DAY = 3

// null   = no check-in yet today (Absent / On Leave / not started)
// 'in-progress' = currently checked into a session — hours aren't final yet
// 'completed'   = every session for today is closed, workingHours >= required
// 'short'       = every session for today is closed, workingHours < required
export const getHoursStatus = (record) => {
  if (!record?.checkIn) return null
  if (record.hasOpenSession) return 'in-progress'
  return (record.workingHours || 0) >= REQUIRED_WORKING_HOURS ? 'completed' : 'short'
}

// Whether a new check-in session can still be started today — false while
// currently checked in, or once the daily session cap has been used up.
export const canStartNewSession = (record) => {
  if (!record) return true
  const used = record.sessionsUsed ?? (record.checkIn ? 1 : 0)
  const max = record.maxSessionsPerDay ?? MAX_SESSIONS_PER_DAY
  return !record.hasOpenSession && used < max
}

// Overtime/remaining are derived from `workingHours` against the 8h
// requirement, on the frontend — the backend's own `overtimeHours` field is
// still pegged to its old fixed-shift-length constant, so it isn't used
// here; `workingHours` (raw checkOut − checkIn) is unaffected by that and
// safe to reuse as-is.
export const getOvertimeHours = (workingHours = 0) => Math.max(0, (workingHours || 0) - REQUIRED_WORKING_HOURS)

export const getRemainingHours = (workingHours = 0) => Math.max(0, REQUIRED_WORKING_HOURS - (workingHours || 0))

export const HOURS_STATUS_LABEL = {
  'in-progress': 'Currently Working',
  completed: 'Completed',
  short: 'Short Hours',
}

export const hoursStatusPillClass = (hoursStatus) => {
  switch (hoursStatus) {
    case 'completed':
      return 'pill-success'
    case 'short':
      return 'pill-warning'
    case 'in-progress':
      return 'pill-warning'
    default:
      return 'pill-muted'
  }
}

// Monday-start week containing `date`, as an array of 7 date-key strings.
export const getWeekDates = (date = new Date()) => {
  const d = new Date(date)
  const diffToMonday = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - diffToMonday)
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(d)
    day.setDate(d.getDate() + i)
    return getDateKey(day)
  })
}

// All date-key strings in the calendar month that `monthValue` ("YYYY-MM") falls in.
export const getMonthDates = (monthValue) => {
  const [year, month] = monthValue.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()
  return Array.from({ length: daysInMonth }, (_, i) => getDateKey(new Date(year, month - 1, i + 1)))
}

// "YYYY-MM" for the calendar month a date falls in, and for the month right
// before it — used to compare this-month vs last-month attendance stats.
export const monthValueOf = (date = new Date()) => getDateKey(date).slice(0, 7)

export const previousMonthValue = (monthValue) => {
  const [year, month] = monthValue.split('-').map(Number)
  return monthValueOf(new Date(year, month - 2, 1))
}

export const isWeekday = (dateKey) => {
  const day = new Date(`${dateKey}T00:00:00`).getDay()
  return day !== 0 && day !== 6
}

// Groups records by employee and totals up present/absent/late/hours —
// used by the Weekly and Monthly report tabs.
export const summarizeByEmployee = (records) => {
  const byEmployee = new Map()

  records.forEach((record) => {
    const key = record.employeeId
    if (!byEmployee.has(key)) {
      byEmployee.set(key, {
        employeeId: record.employeeId,
        employeeName: record.employeeName,
        present: 0,
        absent: 0,
        halfDay: 0,
        onLeave: 0,
        shortHoursDays: 0,
        totalHours: 0,
        overtimeHours: 0,
      })
    }

    const summary = byEmployee.get(key)

    if (record.status === ATTENDANCE_STATUS.PRESENT) summary.present += 1
    else if (record.status === ATTENDANCE_STATUS.ABSENT) summary.absent += 1
    else if (record.status === ATTENDANCE_STATUS.HALF_DAY) summary.halfDay += 1
    else if (record.status === ATTENDANCE_STATUS.ON_LEAVE) summary.onLeave += 1

    if (getHoursStatus(record) === 'short') summary.shortHoursDays += 1
    summary.totalHours += record.workingHours || 0
    summary.overtimeHours += getOvertimeHours(record.workingHours)
  })

  return Array.from(byEmployee.values())
}
