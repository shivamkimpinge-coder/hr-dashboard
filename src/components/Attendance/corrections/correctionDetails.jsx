import Button from '../../../utils/Button/button'
import {
  correctionStatusPillClass,
  formatDateDisplay,
  formatTimeDisplay,
} from '../../../utils/AttendanceUtils/attendanceStore'

// formatDateDisplay expects a bare "YYYY-MM-DD" string (that's what
// correction.date is), but appliedOn/decidedOn are real timestamps — a
// separate formatter for those avoids "Invalid Date".
const formatTimestampDisplay = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function CorrectionDetails({ correction, onClose }) {
  if (!correction) return null

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Attendance</p>
            <h3>Correction Request</h3>
          </div>
          <Button variant="close" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>

        <div className="payslip-content">
          <div className="payslip-header">
            <div>
              <h4>{correction.employeeName}</h4>
              <p>{correction.employeeId}</p>
            </div>
            <div className="payslip-meta">
              <p>
                <strong>Status:</strong>{' '}
                <span className={`pill ${correctionStatusPillClass(correction.status)}`}>{correction.status}</span>
              </p>
              <p>
                <strong>Applied On:</strong> {formatTimestampDisplay(correction.appliedOn)}
              </p>
              {correction.decidedOn ? (
                <p>
                  <strong>Decided On:</strong> {formatTimestampDisplay(correction.decidedOn)}
                  {correction.decidedByName ? ` by ${correction.decidedByName}` : ''}
                </p>
              ) : null}
            </div>
          </div>

          <div className="detail-grid">
            <div className="detail-card">
              <p className="eyebrow">Currently on record</p>
              <p>
                <strong>Date:</strong> {formatDateDisplay(correction.date)}
              </p>
              <p>
                <strong>Status:</strong> {correction.existingStatus || 'No record'}
              </p>
              <p>
                <strong>Check-in:</strong> {formatTimeDisplay(correction.existingCheckIn)}
              </p>
              <p>
                <strong>Check-out:</strong> {formatTimeDisplay(correction.existingCheckOut)}
              </p>
            </div>
            <div className="detail-card">
              <p className="eyebrow">Requested</p>
              <p>
                <strong>Status:</strong> {correction.requestedStatus}
              </p>
              <p>
                <strong>Check-in:</strong> {formatTimeDisplay(correction.requestedCheckIn)}
              </p>
              <p>
                <strong>Check-out:</strong> {formatTimeDisplay(correction.requestedCheckOut)}
              </p>
            </div>
          </div>

          <div className="detail-card">
            <p className="eyebrow">Reason</p>
            <p>{correction.reason}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CorrectionDetails
