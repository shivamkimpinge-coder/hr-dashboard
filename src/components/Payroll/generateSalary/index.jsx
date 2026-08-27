import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Button from '../../../utils/Button/button'
import CommonForm from '../../../utils/Form/commonform'

import useApi from '../../../hooks/useApi'

import {
  MONTHS,
  emptyGenerateForm,
  getSalaryComponentFields,
  computeNetSalary,
  formatCurrency,
} from '../payrollFormConfig'

function GenerateSalary() {
  const navigate = useNavigate()
  const { listEmployees, getSalaryStructure, generateSalary } = useApi()

  const [employees, setEmployees] = useState([])
  const [structureMissing, setStructureMissing] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onTouched', defaultValues: emptyGenerateForm })

  useEffect(() => {
    listEmployees({ limit: 200 })
      .then((data) => setEmployees(data.employees || []))
      .catch(() => {})
  }, [listEmployees])

  const employeeId = watch('employeeId')

  useEffect(() => {
    if (!employeeId) {
      setStructureMissing(false)
      return
    }

    let cancelled = false
    setStructureMissing(false)

    getSalaryStructure(employeeId)
      .then((data) => {
        if (cancelled) return
        const s = data.salaryStructure
        setValue('basicSalary', s.basicSalary)
        setValue('hra', s.hra)
        setValue('allowance', s.allowance)
        setValue('bonus', s.bonus)
        setValue('pf', s.pf)
        setValue('tax', s.tax)
        setValue('deduction', s.deduction)
      })
      .catch((error) => {
        if (!cancelled && error.status === 404) {
          setStructureMissing(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [employeeId, getSalaryStructure, setValue])

  const values = watch()
  const previewNet = useMemo(() => computeNetSalary(values), [values])

  const onSubmit = async (formData) => {
    try {
      const { payroll } = await generateSalary(formData)
      toast.success('Salary generated successfully.')
      reset(emptyGenerateForm)
      navigate('/dashboard/payroll', { state: { payroll } })
    } catch (error) {
      toast.error(error.message)
    }
  }

  const periodFields = [
    {
      name: 'employeeId',
      label: 'Employee',
      id: 'gen-employeeId',
      type: 'select',
      rules: { required: 'Please select an employee' },
      options: [
        { value: '', label: 'Select an employee...' },
        ...employees.map((employee) => ({
          value: employee.employeeId,
          label: `${employee.employeeId} — ${employee.name}`,
        })),
      ],
    },
    {
      name: 'month',
      label: 'Month',
      id: 'gen-month',
      type: 'select',
      options: MONTHS.map((month) => ({ value: month, label: month })),
    },
    {
      name: 'year',
      label: 'Year',
      id: 'gen-year',
      type: 'number',
      min: '2000',
      max: '2100',
      rules: { required: 'Year is required', valueAsNumber: true },
    },
  ]

  return (
    <div className="panel detail-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Payroll</p>
          <h3>Generate Salary</h3>
        </div>
        <Button variant="close" to="/dashboard/payroll" aria-label="Close">
          ✕
        </Button>
      </div>

      {structureMissing ? (
        <div className="feedback-banner">
          No saved salary structure for this employee — fill in the amounts below to generate a one-off payslip.
        </div>
      ) : null}

      <CommonForm
        formClassName="employee-form"
        layoutClassName="form-grid"
        fields={[...periodFields, ...getSalaryComponentFields({ idPrefix: 'gen-' })]}
        register={register}
        errors={errors}
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="payroll-net-preview">
          <span>Net Salary</span>
          <strong>{formatCurrency(previewNet)}</strong>
        </div>
        <div className="action-row">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Generating...' : 'Generate Salary'}
          </Button>
        </div>
      </CommonForm>
    </div>
  )
}

export default GenerateSalary
