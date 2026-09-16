import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Button from '../../../utils/Button/button'
import CommonForm from '../../../utils/Form/commonform'
import useApi from '../../../hooks/useApi'
import { emptyForm, getEmployeeFields } from '../../../utils/EmployeeUtils/employeeFormConfig'
import { isAdminRole } from '../../../utils/roles'

function CreateEmployee({ open, onClose, onCreated, currentUser }) {
  const { createEmployee } = useApi()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onTouched',
    defaultValues: emptyForm,
  })

  useEffect(() => {
    if (open) reset(emptyForm)
  }, [open, reset])

  if (!open) return null

  const onSubmit = async (formData) => {
    try {
      await createEmployee(formData)
      toast.success('Employee added successfully.')
      onClose?.()
      await onCreated?.()
    } catch (error) {
      toast.error(error.message)
    }
  }
console.log('open', open)
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Employee form</p>
            <h3>Add Employee</h3>
          </div>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>

        <CommonForm
          formClassName="employee-form"
          layoutClassName="form-grid"
          fields={getEmployeeFields({ canManageRole: isAdminRole(currentUser) })}
          register={register}
          control={control}
          errors={errors}
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="action-row">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Employee'}
            </Button>
          </div>
        </CommonForm>
      </div>
    </div>
  )
}

export default CreateEmployee
