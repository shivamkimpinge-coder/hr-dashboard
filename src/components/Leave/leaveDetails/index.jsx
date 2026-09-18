// function LeaveDetails({  }) {
//   return(
//     <div className="panel detail-panel">
//       <SectionTabs tabs={getLeaveTabs()} />

//       <div className="panel-heading">
//         <div>
//           <h2>Leave Details</h2>
//         </div>
//       </div>

//       <div className="panel-body">
//         <p>Leave details content goes here.</p>
//       </div>
//     </div>
//   )
// }

// export default LeaveDetails
import Button from '../../../utils/Button/button'
import { formatDateDisplay, statusPillClass } from '../leaveFormConfig'

function LeaveDetails({ leave, onClose }) {
  if (!leave) return null

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Leave</p>
            <h3>Leave Details</h3>
          </div>
          <Button variant="close" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>

        <div className="payslip-content">
          <div className="payslip-header">
            <div>
              <h4>{leave.employeeName}</h4>
              <p>
                {leave.employeeId}
                {leave.designation ? ` • ${leave.designation}` : ''}
                {leave.department ? ` • ${leave.department}` : ''}
              </p>
            </div>
            <div className="payslip-meta">
              <p>
                <strong>Status:</strong>{' '}
                <span className={`pill ${statusPillClass(leave.status)}`}>{leave.status}</span>
              </p>
              <p>
                <strong>Applied On:</strong> {formatDateDisplay(leave.appliedOn)}
              </p>
              {leave.decidedOn ? (
                <p>
                  <strong>Decided On:</strong> {formatDateDisplay(leave.decidedOn)}
                </p>
              ) : null}
            </div>
          </div>

          <div className="detail-grid">
            <div className="detail-card">
              <p className="eyebrow">Leave Period</p>
              <p>
                <strong>Type:</strong> {leave.leaveType}
              </p>
              <p>
                <strong>From:</strong> {formatDateDisplay(leave.startDate)}
              </p>
              <p>
                <strong>To:</strong> {formatDateDisplay(leave.endDate)}
              </p>
              <p>
                <strong>Duration:</strong> {leave.days} day{leave.days === 1 ? '' : 's'}
              </p>
            </div>
            <div className="detail-card">
              <p className="eyebrow">Reason</p>
              <p>{leave.reason}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LeaveDetails