import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Button from '../../../utils/Button/button'
import SectionTabs from '../../../utils/SectionTabs/sectionTabs'
import CommonForm from '../../../utils/Form/commonform'
import useApi from '../../../hooks/useApi'
import { isAdminRole } from '../../../utils/roles'

import {
  emptyApplyForm,
  getApplyLeaveFields,
  computeLeaveDays,
  getLeaveTabs,
  HALF_DAY_LEAVE_TYPES,
  SINGLE_DAY_LEAVE_TYPES,
} from '../leaveFormConfig'

function ApplyLeave({ currentUser }) {
  const navigate = useNavigate()
  const { applyLeave } = useApi()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onTouched', defaultValues: emptyApplyForm })

  const leaveType = watch('leaveType')
  const startDate = watch('startDate')
  const endDate = watch('endDate')
  const isHalfDay = watch('isHalfDay')

  const supportsHalfDay = HALF_DAY_LEAVE_TYPES.includes(leaveType)
  const singleDayOnly = SINGLE_DAY_LEAVE_TYPES.includes(leaveType) || (supportsHalfDay && isHalfDay)

  // Short Leave, and a half-day Sick Leave, are always a single day — the End
  // Date field is read-only for them, so it has to be kept in sync here.
  useEffect(() => {
    if (singleDayOnly && startDate && endDate !== startDate) {
      setValue('endDate', startDate)
    }
  }, [singleDayOnly, startDate, endDate, setValue])

  // Half day only means something for Sick Leave — clear it when switching to
  // any other type so a stale checked value can't slip into the request.
  useEffect(() => {
    if (!supportsHalfDay && isHalfDay) {
      setValue('isHalfDay', false)
    }
  }, [supportsHalfDay, isHalfDay, setValue])

  const days = useMemo(
    () => computeLeaveDays(startDate, endDate, { isHalfDay: supportsHalfDay && isHalfDay }),
    [startDate, endDate, supportsHalfDay, isHalfDay]
  )

  const isAdmin = isAdminRole(currentUser)

  const onSubmit = async (formData) => {
    try {
      await applyLeave({ ...formData, isHalfDay: supportsHalfDay && Boolean(formData.isHalfDay) })
      toast.success('Leave request submitted successfully.')
      navigate('/dashboard/leave')
    } catch (error) {
      toast.error(error.message)
    }
  }

  if (isAdmin) {
    return <Navigate to="/dashboard/leave" replace />
  }

  return (
    <div className="panel detail-panel">
      <SectionTabs tabs={getLeaveTabs(currentUser)} />

      <div className="panel-heading">
        <div>
          <p className="eyebrow">Leave</p>
          <h3>Apply Leave</h3>
        </div>
      </div>

      <CommonForm
        formClassName="employee-form"
        layoutClassName="form-grid"
        fields={getApplyLeaveFields({ idPrefix: 'apply-', leaveType, isHalfDay })}
        register={register}
        errors={errors}
        onSubmit={handleSubmit(onSubmit)}
      >
        {SINGLE_DAY_LEAVE_TYPES.includes(leaveType) ? (
          <p className="form-hint">Short Leave is always a single day and counts as 1 short leave for the month.</p>
        ) : days > 0 ? (
          <p className="form-hint">
            {days} day{days === 1 ? '' : 's'} requested.
          </p>
        ) : null}

        <div className="action-row">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      </CommonForm>
    </div>
  )
}

export default ApplyLeave
