export const LEAVE_TYPES = ['Casual Leave', 'Sick Leave', 'Annual Leave', 'Work From Home']

export const LEAVE_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
}

export const emptyApplyForm = {
  leaveType: LEAVE_TYPES[0],
  startDate: '',
  endDate: '',
  reason: '',
}

export const computeLeaveDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0
  const start = new Date(startDate)
  const end = new Date(endDate)
  const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1
  return days > 0 ? days : 0
}

export const formatDateDisplay = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export const statusPillClass = (status) => {
  switch (status) {
    case LEAVE_STATUS.APPROVED:
      return 'pill-success'
    case LEAVE_STATUS.PENDING:
      return 'pill-warning'
    case LEAVE_STATUS.REJECTED:
      return 'pill-danger'
    default:
      return 'pill-muted' // Cancelled
  }
}

// Apply Leave always applies for the logged-in user themselves — no employee
// picker. The backend resolves "who" from the JWT, not from the request body.
export const getApplyLeaveFields = ({ idPrefix = '' } = {}) => [
  {
    name: 'leaveType',
    label: 'Leave Type',
    id: `${idPrefix}leaveType`,
    type: 'select',
    options: LEAVE_TYPES.map((type) => ({ value: type, label: type })),
  },
  {
    name: 'startDate',
    label: 'Start Date',
    id: `${idPrefix}startDate`,
    type: 'date',
    rules: { required: 'Start date is required' },
  },
  {
    name: 'endDate',
    label: 'End Date',
    id: `${idPrefix}endDate`,
    type: 'date',
    rules: {
      required: 'End date is required',
      validate: (value, formValues) =>
        !formValues.startDate || value >= formValues.startDate || 'End date cannot be before start date',
    },
  },
  {
    name: 'reason',
    label: 'Reason',
    id: `${idPrefix}reason`,
    type: 'textarea',
    rows: '3',
    wrapperClassName: 'form-field form-field-full',
    rules: { required: 'Please provide a reason for the leave' },
  },
]
