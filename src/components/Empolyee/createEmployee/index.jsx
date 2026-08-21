import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Button from '../../../utils/Button/button'
import CommonForm from '../../../utils/Form/commonform'
import useApi from '../../../hooks/useApi'
import { emptyForm, getEmployeeFields } from '../employeeFormConfig'

function CreateEmployee({ onCreated }) {
  const navigate = useNavigate()
  const { createEmployee } = useApi()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onTouched',
    defaultValues: emptyForm,
  })

  const onSubmit = async (formData) => {
    try {
      await createEmployee(formData)
      reset()
      toast.success('Employee added successfully.')
      await onCreated?.()
      navigate('/dashboard/employees')
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <div className="panel detail-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Employee form</p>
          <h3>Add Employee</h3>
        </div>
        <Button variant="close" to="/dashboard/employees" aria-label="Close">
          ✕
        </Button>
      </div>

      <CommonForm
        formClassName="employee-form"
        layoutClassName="form-grid"
        fields={getEmployeeFields()}
        register={register}
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
  )
}

export default CreateEmployee
