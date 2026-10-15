import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Button from '../../../utils/Button/button'
import CommonForm from '../../../utils/Form/commonform'
import useApi from '../../../hooks/useApi'
import { ATTENDANCE_STATUSES, getDateKey } from '../../../utils/AttendanceUtils/attendanceStore'

const PRESENT_LIKE_STATUSES = ['Present', 'Half Day']

const emptyForm = {
  date: '',
  requestedStatus: 'Present',
  requestedCheckIn: '',
  requestedCheckOut: '',
  reason: '',
}

// The actual form — shared by the full /dashboard/attendance/corrections/new
// page and the quick-access modal opened from the Check-In/Out card (both
// blank), and the "Edit" action on a specific day's View modal (pre-filled
// with that day's date/status/times) — so the fields, validation and submit
// behavior can't drift between entry points. onSuccess decides what happens
// next (navigate away vs. just close a modal), everything else is identical.
function CorrectionRequestForm({ onSuccess, submitLabel = 'Submit Request', defaultValues }) {
  const { requestAttendanceCorrection } = useApi()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onTouched', defaultValues: { ...emptyForm, ...defaultValues } })

  const requestedStatus = watch('requestedStatus')
  const requiresTimes = PRESENT_LIKE_STATUSES.includes(requestedStatus)

  const onSubmit = async (formData) => {
    try {
      await requestAttendanceCorrection({
        date: formData.date,
        requestedStatus: formData.requestedStatus,
        requestedCheckIn: requiresTimes ? formData.requestedCheckIn : undefined,
        requestedCheckOut: requiresTimes ? formData.requestedCheckOut || undefined : undefined,
        reason: formData.reason,
      })
      toast.success('Correction request submitted successfully.')
      onSuccess?.()
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <CommonForm
      formClassName="employee-form"
      layoutClassName="form-grid"
      register={register}
      errors={errors}
      fields={[
        {
          name: 'date',
          label: 'Date',
          id: 'correction-date',
          type: 'date',
          rules: {
            required: 'Date is required',
            validate: (value) => value <= getDateKey() || 'You can only request a correction for today or an earlier day.',
          },
        },
        {
          name: 'requestedStatus',
          label: 'Correct Status',
          id: 'correction-status',
          type: 'select',
          options: ATTENDANCE_STATUSES.map((status) => ({ value: status, label: status })),
          rules: { required: true },
        },
        {
          name: 'requestedCheckIn',
          label: 'Check-in Time',
          id: 'correction-checkin',
          type: 'time',
          rules: requiresTimes ? { required: 'Check-in time is required for this status' } : {},
        },
        {
          name: 'requestedCheckOut',
          label: 'Check-out Time (optional)',
          id: 'correction-checkout',
          type: 'time',
        },
        {
          name: 'reason',
          label: 'Reason',
          id: 'correction-reason',
          type: 'textarea',
          rows: 3,
          wrapperClassName: 'form-field form-field-full',
          rules: {
            required: 'Please explain why this correction is needed',
            minLength: { value: 3, message: 'Reason must be at least 3 characters.' },
            maxLength: { value: 500, message: 'Reason must be 500 characters or fewer.' },
          },
        },
      ]}
      onSubmit={handleSubmit(onSubmit)}
    >
      <p className="form-hint">
        {requiresTimes
          ? 'This status needs a check-in time. Check-out is optional if you only forgot one of the two.'
          : 'This status does not need check-in/check-out times.'}
      </p>

      <div className="action-row">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : submitLabel}
        </Button>
      </div>
    </CommonForm>
  )
}

export default CorrectionRequestForm
