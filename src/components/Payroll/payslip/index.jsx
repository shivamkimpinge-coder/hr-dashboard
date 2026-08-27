import Button from '../../../utils/Button/button'
import { formatCurrency } from '../payrollFormConfig'

function Payslip({ payroll, onClose }) {
  if (!payroll) return null

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card payslip-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Payroll</p>
            <h3>Payslip</h3>
          </div>
          <div className="action-row">
            <Button variant="secondary" onClick={() => window.print()}>
              Print
            </Button>
            <Button variant="close" onClick={onClose} aria-label="Close">
              ✕
            </Button>
          </div>
        </div>

        <div className="payslip-content">
          <div className="payslip-header">
            <div>
              <h4>{payroll.employeeName}</h4>
              <p>
                {payroll.employeeId}
                {payroll.designation ? ` • ${payroll.designation}` : ''}
                {payroll.department ? ` • ${payroll.department}` : ''}
              </p>
            </div>
            <div className="payslip-meta">
              <p>
                <strong>Payslip No:</strong> {payroll.payslipNo}
              </p>
              <p>
                <strong>Period:</strong> {payroll.month} {payroll.year}
              </p>
              <p>
                <strong>Status:</strong> {payroll.status}
              </p>
            </div>
          </div>

          <div className="detail-grid">
            <div className="detail-card">
              <p className="eyebrow">Earnings</p>
              <p>
                <strong>Basic Salary:</strong> {formatCurrency(payroll.basicSalary)}
              </p>
              <p>
                <strong>HRA:</strong> {formatCurrency(payroll.hra)}
              </p>
              <p>
                <strong>Allowance:</strong> {formatCurrency(payroll.allowance)}
              </p>
              <p>
                <strong>Bonus:</strong> {formatCurrency(payroll.bonus)}
              </p>
            </div>
            <div className="detail-card">
              <p className="eyebrow">Deductions</p>
              <p>
                <strong>PF:</strong> {formatCurrency(payroll.pf)}
              </p>
              <p>
                <strong>Tax:</strong> {formatCurrency(payroll.tax)}
              </p>
              <p>
                <strong>Deduction:</strong> {formatCurrency(payroll.deduction)}
              </p>
            </div>
          </div>

          <div className="payslip-net">
            <span>Net Salary</span>
            <strong>{formatCurrency(payroll.netSalary)}</strong>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Payslip
