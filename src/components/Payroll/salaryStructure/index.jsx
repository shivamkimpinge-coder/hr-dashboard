import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Button from '../../../utils/Button/button'
import CommonForm from '../../../utils/Form/commonform'

import useApi from '../../../hooks/useApi'

import { emptyStructureForm, getSalaryComponentFields, computeNetSalary, formatCurrency } from '../payrollFormConfig'

function SalaryStructure() {
  const { listEmployees, getSalaryStructure, saveSalaryStructure } = useApi()

  const [employees, setEmployees] = useState([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [loadingStructure, setLoadingStructure] = useState(false)
  const [isNew, setIsNew] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onTouched', defaultValues: emptyStructureForm })

  useEffect(() => {
    listEmployees({ limit: 200 })
      .then((data) => setEmployees(data.employees || []))
      .catch(() => {})
  }, [listEmployees])

  useEffect(() => {
    if (!selectedEmployeeId) {
      reset(emptyStructureForm)
      setIsNew(false)
      return undefined
    }

    let cancelled = false
    setLoadingStructure(true)
    setIsNew(false)

    getSalaryStructure(selectedEmployeeId)
      .then((data) => {
        if (cancelled) return
        const s = data.salaryStructure
        reset({
          basicSalary: s.basicSalary,
          hra: s.hra,
          allowance: s.allowance,
          bonus: s.bonus,
          pf: s.pf,
          tax: s.tax,
          deduction: s.deduction,
        })
      })
      .catch((error) => {
        if (cancelled) return
        if (error.status === 404) {
          reset(emptyStructureForm)
          setIsNew(true)
        } else {
          toast.error(error.message)
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingStructure(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedEmployeeId, getSalaryStructure, reset])

  const values = watch()
  const previewNet = useMemo(() => computeNetSalary(values), [values])

  const onSubmit = async (formData) => {
    try {
      await saveSalaryStructure(selectedEmployeeId, formData)
      toast.success('Salary structure saved successfully.')
      setIsNew(false)
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <div className="panel detail-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Payroll</p>
          <h3>Salary Structure</h3>
        </div>
        <Button variant="close" to="/dashboard/payroll" aria-label="Close">
          ✕
        </Button>
      </div>

      <div className="form-field payroll-employee-select">
        <label htmlFor="structure-employee">Employee</label>
        <select
          id="structure-employee"
          value={selectedEmployeeId}
          onChange={(event) => setSelectedEmployeeId(event.target.value)}
        >
          <option value="">Select an employee...</option>
          {employees.map((employee) => (
            <option key={employee._id} value={employee.employeeId}>
              {employee.employeeId} — {employee.name}
            </option>
          ))}
        </select>
      </div>

      {!selectedEmployeeId ? (
        <p className="form-hint">Select an employee to view or set their salary structure.</p>
      ) : loadingStructure ? (
        <p className="form-hint">Loading salary structure...</p>
      ) : (
        <>
          {isNew ? (
            <div className="feedback-banner">
              No salary structure set yet for this employee. Fill in the form below to create one.
            </div>
          ) : null}

          <CommonForm
            formClassName="employee-form"
            layoutClassName="form-grid"
            fields={getSalaryComponentFields()}
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
                {isSubmitting ? 'Saving...' : 'Save Salary Structure'}
              </Button>
            </div>
          </CommonForm>
        </>
      )}
    </div>
  )
}

export default SalaryStructure
