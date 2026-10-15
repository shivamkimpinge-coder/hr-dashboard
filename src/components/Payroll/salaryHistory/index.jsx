import { useCallback, useEffect, useState } from 'react'
import { isManagerRole } from '../../../utils/roles'
import { useLocation, useNavigate } from 'react-router-dom'
import Button from '../../../utils/Button/button'
import SectionTabs from '../../../utils/SectionTabs/sectionTabs'
import EmployeeSearchFilter from '../../../utils/EmployeeSearchFilter'
import useApi from '../../../hooks/useApi'
import Payslip from '../payslip'

import { formatCurrency } from '../payrollFormConfig'

function SalaryHistory({ currentUser }) {
  const isManager = isManagerRole(currentUser)
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
    if (!isManager) return
    listEmployees({ limit: 200 })
      .then((data) => setEmployees(data.employees || []))
      .catch(() => {})
  }, [isManager, listEmployees])

  const fetchPayrolls = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { limit: 200 }
      if (employeeFilter) params.employeeId = employeeFilter
      const data = isManager ? await listPayroll(params) : await getMyPayroll()
      setPayrolls(data.payrolls || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [isManager, employeeFilter, listPayroll, getMyPayroll])

  useEffect(() => {
    fetchPayrolls()
  }, [fetchPayrolls])

  useEffect(() => {
    if (location.state?.payroll) {
      setSelectedPayroll(location.state.payroll)
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.state, location.pathname, navigate])

  return (
    <div className="panel detail-panel">
      <SectionTabs
        tabs={[
          { label: 'My Payslips', to: '/dashboard/payroll', end: true },
          isManager && { label: 'Salary Structure', to: '/dashboard/payroll/structure' },
          isManager && { label: 'Generate Salary', to: '/dashboard/payroll/generate' },
        ]}
      />

      <div className="panel-heading">
        <div>
          <p className="eyebrow">Payroll</p>
          <h3>{isManager ? 'Salary History' : 'My Salary Slips'}</h3>
        </div>
      </div>

      {isManager ? (
        <EmployeeSearchFilter
          id="history-employee-filter"
          employees={employees}
          value={employeeFilter}
          onChange={setEmployeeFilter}
        />
      ) : null}

      {error ? <div className="feedback-banner feedback-banner-error">{error}</div> : null}

      <div className="table-responsive">
        <table className="table table-dark table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>Payslip No</th>
              {isManager ? <th>Employee</th> : null}
              <th>Period</th>
              <th>Net Salary</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={isManager ? 6 : 5}>Loading salary history...</td>
              </tr>
            ) : payrolls.length === 0 ? (
              <tr>
                <td colSpan={isManager ? 6 : 5}>No payroll records found.</td>
              </tr>
            ) : (
              payrolls.map((payroll) => (
                <tr key={payroll._id}>
                  <td>{payroll.payslipNo}</td>
                  {isManager ? (
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
