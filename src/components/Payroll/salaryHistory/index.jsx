import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Button from '../../../utils/Button/button'
import useApi from '../../../hooks/useApi'
import Payslip from '../payslip'

import { formatCurrency } from '../payrollFormConfig'

function SalaryHistory({ currentUser }) {
  const isAdmin = currentUser?.role === 'Admin'
  const navigate = useNavigate()
  const location = useLocation()
  const { listEmployees, listPayroll, getMyPayroll } = useApi()

  const [employees, setEmployees] = useState([])
  const [employeeFilter, setEmployeeFilter] = useState('')
  const [payrolls, setPayrolls] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPayroll, setSelectedPayroll] = useState(null)

  useEffect(() => {
    if (!isAdmin) return
    listEmployees({ limit: 200 })
      .then((data) => setEmployees(data.employees || []))
      .catch(() => {})
  }, [isAdmin, listEmployees])

  const fetchPayrolls = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { limit: 200 }
      if (employeeFilter) params.employeeId = employeeFilter
      const data = isAdmin ? await listPayroll(params) : await getMyPayroll()
      setPayrolls(data.payrolls || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [isAdmin, employeeFilter, listPayroll, getMyPayroll])

  useEffect(() => {
    fetchPayrolls()
  }, [fetchPayrolls])

  // GenerateSalary hands the newly created record over via navigation state
  // so the payslip modal can open right here, on this same route.
  useEffect(() => {
    if (location.state?.payroll) {
      setSelectedPayroll(location.state.payroll)
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.state, location.pathname, navigate])

  return (
    <div className="panel detail-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Payroll</p>
          <h3>{isAdmin ? 'Salary History' : 'My Salary Slips'}</h3>
        </div>
        {isAdmin ? (
          <div className="action-row">
            <Button variant="secondary" to="/dashboard/payroll/structure">
              Salary Structure
            </Button>
            <Button to="/dashboard/payroll/generate">+ Generate Salary</Button>
          </div>
        ) : null}
      </div>

      {isAdmin ? (
        <div className="form-field filter-field">
          <label htmlFor="history-employee-filter">Filter by employee</label>
          <select
            id="history-employee-filter"
            value={employeeFilter}
            onChange={(event) => setEmployeeFilter(event.target.value)}
          >
            <option value="">All employees</option>
            {employees.map((employee) => (
              <option key={employee._id} value={employee.employeeId}>
                {employee.employeeId} — {employee.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {error ? <div className="feedback-banner feedback-banner-error">{error}</div> : null}

      <div className="table-responsive">
        <table className="table table-dark table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>Payslip No</th>
              {isAdmin ? <th>Employee</th> : null}
              <th>Period</th>
              <th>Net Salary</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5}>Loading salary history...</td>
              </tr>
            ) : payrolls.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5}>No payroll records found.</td>
              </tr>
            ) : (
              payrolls.map((payroll) => (
                <tr key={payroll._id}>
                  <td>{payroll.payslipNo}</td>
                  {isAdmin ? (
                    <td>
                      {payroll.employeeName} <span className="text-muted">({payroll.employeeId})</span>
                    </td>
                  ) : null}
                  <td>
                    {payroll.month} {payroll.year}
                  </td>
                  <td>{formatCurrency(payroll.netSalary)}</td>
                  <td>
                    <span className={`pill ${payroll.status === 'Paid' ? 'pill-success' : 'pill-muted'}`}>
                      {payroll.status}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Button variant="view" onClick={() => setSelectedPayroll(payroll)}>
                        View Payslip
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Payslip payroll={selectedPayroll} onClose={() => setSelectedPayroll(null)} />
    </div>
  )
}

export default SalaryHistory
