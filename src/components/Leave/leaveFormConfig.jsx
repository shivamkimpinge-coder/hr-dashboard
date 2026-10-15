import { isAdminRole } from '../../utils/roles'

export const LEAVE_TYPES = ['Casual Leave', 'Sick Leave', 'Short Leave', 'Annual Leave', 'Work From Home']

// Mirrors backend/utils/leavePolicy.js — kept in sync manually since the two
// apps don't share a config module. Only used to decide what the Apply Leave
// form shows; the backend is the one place that actually enforces these.
export const HALF_DAY_LEAVE_TYPES = ['Sick Leave']
export const SINGLE_DAY_LEAVE_TYPES = ['Short Leave']

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
  isHalfDay: false,
  reason: '',
}

export const computeLeaveDays = (startDate, endDate, { isHalfDay = false } = {}) => {
  if (!startDate || !endDate) return 0
  if (isHalfDay) return startDate === endDate ? 0.5 : 0
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
      return 'pill-muted'
  }
}

export const getLeaveTabs = (currentUser) =>
  [
    { label: 'Requests', to: '/dashboard/leave', end: true },
    !isAdminRole(currentUser) && { label: 'Apply Leave', to: '/dashboard/leave/apply' },
  ].filter(Boolean)

export const getApplyLeaveFields = ({ idPrefix = '', leaveType, isHalfDay } = {}) => {
  const singleDayOnly = SINGLE_DAY_LEAVE_TYPES.includes(leaveType) || isHalfDay

  const fields = [
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
      readOnly: singleDayOnly,
      rules: {
        required: 'End date is required',
        validate: (value, formValues) =>
          !formValues.startDate || value >= formValues.startDate || 'End date cannot be before start date',
      },
    },
  ]

  if (HALF_DAY_LEAVE_TYPES.includes(leaveType)) {
    fields.push({
      name: 'isHalfDay',
      label: 'Half day (0.5 day)',
      id: `${idPrefix}isHalfDay`,
      type: 'checkbox',
    })
  }

  fields.push({
    name: 'reason',
    label: 'Reason',
    id: `${idPrefix}reason`,
    type: 'textarea',
    rows: '3',
    wrapperClassName: 'form-field form-field-full',
    rules: {
      required: 'Please provide a reason for the leave',
      minLength: { value: 3, message: 'Reason must be at least 3 characters' },
    },
  })

  return fields
}
