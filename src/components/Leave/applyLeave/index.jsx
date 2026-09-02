import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Button from '../../../utils/Button/button'
import SectionTabs from '../../../utils/SectionTabs/sectionTabs'
import CommonForm from '../../../utils/Form/commonform'
import useApi from '../../../hooks/useApi'

import { emptyApplyForm, getApplyLeaveFields, computeLeaveDays } from '../leaveFormConfig'

function ApplyLeave() {
  const navigate = useNavigate()
  const { applyLeave } = useApi()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onTouched', defaultValues: emptyApplyForm })

  const startDate = watch('startDate')
  const endDate = watch('endDate')
  const days = useMemo(() => computeLeaveDays(startDate, endDate), [startDate, endDate])

  const onSubmit = async (formData) => {
    try {
      await applyLeave(formData)
      toast.success('Leave request submitted successfully.')
      navigate('/dashboard/leave')
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <div className="panel detail-panel">
      <SectionTabs
        tabs={[
          { label: 'My Requests', to: '/dashboard/leave', end: true },
          { label: 'Apply Leave', to: '/dashboard/leave/apply' },
        ]}
      />

      <div className="panel-heading">
        <div>
          <p className="eyebrow">Leave</p>
          <h3>Apply Leave</h3>
        </div>
      </div>

      <CommonForm
        formClassName="employee-form"
        layoutClassName="form-grid"
        fields={getApplyLeaveFields({ idPrefix: 'apply-' })}
        register={register}
        errors={errors}
        onSubmit={handleSubmit(onSubmit)}
      >
        {days > 0 ? (
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
