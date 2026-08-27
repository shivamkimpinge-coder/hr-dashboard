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

const pad2 = (value) => String(value).padStart(2, '0')

export const getDateKey = (date = new Date()) => {
  const d = new Date(date)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export const formatHours = (hours) => {
  if (!hours || hours <= 0) return '0h 0m'
  const wholeHours = Math.floor(hours)
  const minutes = Math.round((hours - wholeHours) * 60)
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
        late: 0,
        earlyExit: 0,
        totalHours: 0,
        overtimeHours: 0,
      })
    }

    const summary = byEmployee.get(key)

    if (record.status === ATTENDANCE_STATUS.PRESENT) summary.present += 1
    else if (record.status === ATTENDANCE_STATUS.ABSENT) summary.absent += 1
    else if (record.status === ATTENDANCE_STATUS.HALF_DAY) summary.halfDay += 1
    else if (record.status === ATTENDANCE_STATUS.ON_LEAVE) summary.onLeave += 1

    if (record.isLate) summary.late += 1
    if (record.isEarlyExit) summary.earlyExit += 1
    summary.totalHours += record.workingHours || 0
    summary.overtimeHours += record.overtimeHours || 0
  })

  return Array.from(byEmployee.values())
}
