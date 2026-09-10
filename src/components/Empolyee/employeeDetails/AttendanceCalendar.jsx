import { useCallback, useEffect, useMemo, useState } from 'react'
import useApi from '../../../hooks/useApi'
import { IconChevronLeft, IconChevronRight } from '../../Layout/Sidebar/icons'
import { ATTENDANCE_STATUS, getDateKey, getHoursStatus, getMonthDates, monthValueOf } from '../../Attendance/attendanceStore'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const MONTH_LABEL = (monthValue) => {
  const [year, month] = monthValue.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

const shiftMonth = (monthValue, delta) => {
  const [year, month] = monthValue.split('-').map(Number)
  const d = new Date(year, month - 1 + delta, 1)
  return monthValueOf(d)
}

// Which colour a day cell gets. "Short" (worked less than the required hours)
// is used where a fixed-shift product would show "Late" — this app has no
// fixed shift start, so `isLate` is never set (see attendanceController).
const dayTone = (record) => {
  if (!record) return null
  if (getHoursStatus(record) === 'short') return 'short'
  if (record.status === ATTENDANCE_STATUS.ABSENT) return 'absent'
  if (record.status === ATTENDANCE_STATUS.PRESENT || record.status === ATTENDANCE_STATUS.HALF_DAY) return 'present'
  return null
}

function AttendanceCalendar({ employeeId, onSelectDay }) {
  const { listAttendance } = useApi()

  const [monthValue, setMonthValue] = useState(() => monthValueOf())
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(() => getDateKey())

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const days = getMonthDates(monthValue)
      const data = await listAttendance({ employeeId, from: days[0], to: days[days.length - 1] })
      setRecords(data.attendance || [])
    } catch {
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [listAttendance, employeeId, monthValue])

  useEffect(() => {
    refresh()
  }, [refresh])

  const recordByDate = useMemo(() => {
    const map = new Map()
    records.forEach((record) => map.set(record.date, record))
    return map
  }, [records])

  const cells = useMemo(() => {
    const [year, month] = monthValue.split('-').map(Number)
    const leading = new Date(year, month - 1, 1).getDay()
    const dayCount = new Date(year, month, 0).getDate()

    return [
      ...Array.from({ length: leading }, () => null),
      ...Array.from({ length: dayCount }, (_, i) => getDateKey(new Date(year, month - 1, i + 1))),
    ]
  }, [monthValue])

  const handleSelect = (dateKey) => {
    setSelected(dateKey)
    onSelectDay?.(dateKey, recordByDate.get(dateKey) || null)
  }

  return (
    <div className="panel cal-panel">
      <div className="panel-heading">
        <div>
          <h3>Monthly Attendance</h3>
        </div>
      </div>

      <div className="cal-nav">
        <button type="button" onClick={() => setMonthValue(shiftMonth(monthValue, -1))} aria-label="Previous month">
          <IconChevronLeft />
        </button>
        <strong>{MONTH_LABEL(monthValue)}</strong>
        <button type="button" onClick={() => setMonthValue(shiftMonth(monthValue, 1))} aria-label="Next month">
          <IconChevronRight />
        </button>
      </div>

      <div className="cal-grid cal-weekdays">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="cal-grid cal-days">
        {cells.map((dateKey, index) => {
          if (!dateKey) return <span key={`blank-${index}`} className="cal-day cal-day--blank" />

          const record = recordByDate.get(dateKey)
          const tone = dayTone(record)
          const isSelected = dateKey === selected
          const dayNumber = Number(dateKey.slice(-2))

          return (
            <button
              key={dateKey}
              type="button"
              className={`cal-day${tone ? ` cal-day--${tone}` : ''}${isSelected ? ' cal-day--selected' : ''}`}
              onClick={() => handleSelect(dateKey)}
              title={record ? record.status : 'No record'}
            >
              {dayNumber}
            </button>
          )
        })}
      </div>

      {loading ? <p className="form-hint cal-loading">Loading...</p> : null}

      <div className="cal-legend">
        <span>
          <i className="cal-dot cal-dot--present" />
          Present
        </span>
        <span>
          <i className="cal-dot cal-dot--absent" />
          Absent
        </span>
        <span>
          <i className="cal-dot cal-dot--short" />
          Short Hours
        </span>
        <span>
          <i className="cal-dot cal-dot--selected" />
          Selected
        </span>
      </div>
    </div>
  )
}

export default AttendanceCalendar
