import Button from '../../../utils/Button/button'
import CorrectionRequestForm from './CorrectionRequestForm'

function RequestCorrectionModal({ onClose, onSubmitted, defaultValues }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Attendance</p>
            <h3>Request Correction</h3>
          </div>
          <Button variant="close" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>

        <CorrectionRequestForm
          submitLabel="Submit Request"
          defaultValues={defaultValues}
          onSuccess={() => {
            onSubmitted?.()
            onClose()
          }}
        />
      </div>
    </div>
  )
}

export default RequestCorrectionModal
