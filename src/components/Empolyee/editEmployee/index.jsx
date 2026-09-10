import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Button from '../../../utils/Button/button'
import CommonForm from '../../../utils/Form/commonform'
import useApi from '../../../hooks/useApi'
import { emptyForm, getEmployeeFields, toDateInput } from '../employeeFormConfig'
import { isAdminRole } from '../../../utils/roles'

function EditEmployee({ employee, onClose, onUpdated, currentUser }) {
  const { updateEmployee } = useApi()

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
    if (employee) {
      reset({
        name: employee.name || '',
        email: employee.email || '',
        password: '',
        phone: employee.phone || '',
        gender: employee.gender || 'Male',
        dob: toDateInput(employee.dob),
        department: employee.department || '',
        designation: employee.designation || '',
        workType: employee.workType || 'Full Time',
        reportingManager: employee.reportingManager || '',
        salary: employee.salary ?? '',
        joiningDate: toDateInput(employee.joiningDate),
        address: employee.address || '',
        status: employee.status || 'Active',
        role: employee.role || 'Employee',
      })
    }
  }, [employee, reset])

  if (!employee) return null

  const onSubmit = async (formData) => {
    const payload = { ...formData }
    if (!payload.password) delete payload.password

    try {
      const id = employee.employeeId || employee._id
      await updateEmployee(id, payload)
      onClose?.()
      toast.success('Employee updated successfully.')
      await onUpdated?.()
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Employee form</p>
            <h3>Edit Employee</h3>
          </div>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>

        <CommonForm
          formClassName="employee-form"
          layoutClassName="form-grid"
          fields={getEmployeeFields({ idPrefix: 'edit-', includePassword: true, canManageRole: isAdminRole(currentUser) })}
          register={register}
          control={control}
          errors={errors}
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="action-row">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Employee'}
            </Button>
          </div>
        </CommonForm>
      </div>
    </div>
  )
}

export default EditEmployee
