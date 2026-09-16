import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../../../utils/Button/button'
import SectionTabs from '../../../utils/SectionTabs/sectionTabs'
import useApi from '../../../hooks/useApi'
import {
  ATTENDANCE_STATUS,
  ATTENDANCE_STATUSES,
  formatHours,
  formatTimeDisplay,
  getAttendanceTabs,
  getDateKey,
  statusPillClass,
} from '../../../utils/AttendanceUtils/attendanceStore'

const emptyForm = {
  employeeId: '',
  date: getDateKey(),
  status: ATTENDANCE_STATUS.PRESENT,
  checkIn: '',
  checkOut: '',
}

function MarkAttendance() {
  const { listEmployees, listAttendance, markAttendance } = useApi()
  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [dayRecords, setDayRecords] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    listEmployees({ limit: 200 })
      .then((data) => setEmployees(data.employees || []))
      .catch(() => {})
  }, [listEmployees])

  const refreshDay = useCallback(
    async (date) => {
      setError('')
      try {
        const data = await listAttendance({ from: date, to: date })
        setDayRecords(data.attendance || [])
      } catch (err) {
        setError(err.message)
      }
    },
    [listAttendance]
  )

  useEffect(() => {
    refreshDay(form.date)
  }, [form.date, refreshDay])

  const requiresTimes = form.status === ATTENDANCE_STATUS.PRESENT || form.status === ATTENDANCE_STATUS.HALF_DAY

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleEmployeeChange = (event) => {
    const employeeId = event.target.value
    const existing = dayRecords.find((record) => record.employeeId === employeeId)
    setForm((prev) => ({
      ...prev,
      employeeId,
      status: existing?.status || ATTENDANCE_STATUS.PRESENT,
      checkIn: existing?.checkIn || '',
      checkOut: existing?.checkOut || '',
    }))
  }

  const handleEditRow = (record) => {
    setForm({
      employeeId: record.employeeId,
      date: record.date,
      status: record.status,
      checkIn: record.checkIn || '',
      checkOut: record.checkOut || '',
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.employeeId) {
      toast.error('Please select an employee.')
      return
    }
    if (requiresTimes && !form.checkIn) {
      toast.error('Check-in time is required for this status.')
      return
    }
    if (form.checkIn && form.checkOut && form.checkOut <= form.checkIn) {
      toast.error('Check-out time must be after check-in time.')
      return
    }

    try {
      await markAttendance({
        employeeId: form.employeeId,
        date: form.date,
        status: form.status,
        checkIn: requiresTimes ? form.checkIn : null,
        checkOut: requiresTimes ? form.checkOut || null : null,
      })
      toast.success('Attendance saved successfully.')
      refreshDay(form.date)
      setForm((prev) => ({ ...emptyForm, date: prev.date }))
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="panel detail-panel">
      <SectionTabs tabs={getAttendanceTabs(true)} />

      <div className="panel-heading">
        <div>
          <p className="eyebrow">Attendance</p>
          <h3>Mark Attendance</h3>
        </div>
      </div>

      <form className="employee-form" onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="mark-employee">Employee</label>
            <select id="mark-employee" value={form.employeeId} onChange={handleEmployeeChange} required>
              <option value="">Select employee</option>
              {employees.map((employee) => (
                <option key={employee._id} value={employee.employeeId}>
                  {employee.employeeId} — {employee.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="mark-date">Date</label>
            <input
              id="mark-date"
              type="date"
              max={getDateKey()}
              value={form.date}
              onChange={handleChange('date')}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="mark-status">Status</label>
            <select id="mark-status" value={form.status} onChange={handleChange('status')}>
              {ATTENDANCE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {requiresTimes ? (
            <>
              <div className="form-field">
                <label htmlFor="mark-checkin">Check In</label>
                <input id="mark-checkin" type="time" value={form.checkIn} onChange={handleChange('checkIn')} required />
              </div>
              <div className="form-field">
                <label htmlFor="mark-checkout">Check Out</label>
                <input id="mark-checkout" type="time" value={form.checkOut} onChange={handleChange('checkOut')} />
              </div>
            </>
          ) : null}
        </div>

        <div className="action-row">
          <Button type="submit">Save Attendance</Button>
        </div>
      </form>

      {error ? <div className="feedback-banner feedback-banner-error">{error}</div> : null}

      <p className="eyebrow" style={{ marginTop: '1.5rem' }}>
        Attendance for {form.date}
      </p>
      <div className="table-responsive">
        <table className="table table-dark table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Working Hours</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {dayRecords.length === 0 ? (
              <tr>
                <td colSpan={6}>No attendance marked for this date yet.</td>
              </tr>
            ) : (
              dayRecords.map((record) => (
                <tr key={`${record.employeeId}-${record.date}`}>
                  <td>
                    {record.employeeName} <span className="text-muted">({record.employeeId})</span>
                  </td>
                  <td>{formatTimeDisplay(record.checkIn)}</td>
                  <td>{formatTimeDisplay(record.checkOut)}</td>
                  <td>{formatHours(record.workingHours)}</td>
                  <td>
                    <span className={`pill ${statusPillClass(record.status)}`}>{record.status}</span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Button variant="edit" onClick={() => handleEditRow(record)}>
                        Edit
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default MarkAttendance
