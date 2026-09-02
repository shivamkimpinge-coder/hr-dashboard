import { useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../../../utils/Button/button'
import useApi from '../../../hooks/useApi'
import EditEmployee from '../editEmployee'
import CreateEmployee from '../createEmployee'
import { formatSalary, toDateInput } from '../employeeFormConfig'

function EmployeeModal({ employee, onClose }) {
  if (!employee) return null

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Employee profile</p>
            <h3>{employee.name}</h3>
          </div>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="detail-grid">
          <div className="detail-card">
            <p className="eyebrow">Basic info</p>
            <p>
              <strong>ID:</strong> {employee.employeeId}
            </p>
            <p>
              <strong>Email:</strong> {employee.email}
            </p>
            <p>
              <strong>Phone:</strong> {employee.phone}
            </p>
            <p>
              <strong>Gender:</strong> {employee.gender}
            </p>
          </div>
          <div className="detail-card">
            <p className="eyebrow">Work info</p>
            <p>
              <strong>Department:</strong> {employee.department}
            </p>
            <p>
              <strong>Designation:</strong> {employee.designation}
            </p>
            <p>
              <strong>Salary:</strong> {formatSalary(employee.salary)}
            </p>
            <p>
              <strong>Status:</strong> {employee.status}
            </p>
          </div>
        </div>

        <div className="detail-card mt-3">
          <p className="eyebrow">Additional details</p>
          <p>
            <strong>Birthdate:</strong> {toDateInput(employee.dob) || '—'}
          </p>
          <p>
            <strong>Joining Date:</strong> {toDateInput(employee.joiningDate)}
          </p>
          <p>
            <strong>Address:</strong> {employee.address}
          </p>
        </div>
      </div>
    </div>
  )
}

function DeleteModal({ employee, onCancel, onConfirm, deleting, error }) {
  if (!employee) return null

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card confirm-card">
        <h3>Delete employee?</h3>
        <p>This will permanently remove {employee.name} from the employee roster.</p>
        {error ? <div className="feedback-banner feedback-banner-error">{error}</div> : null}
        <div className="action-row">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Confirm Delete'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function EmployeeList({ employees, loading, error, searchTerm = '', onChanged }) {
  const { deleteEmployee } = useApi()

  const [viewingEmployee, setViewingEmployee] = useState(null)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [isAddingEmployee, setIsAddingEmployee] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const handleDeleteRequest = (employee) => {
    setDeleteError('')
    setEmployeeToDelete(employee)
  }

  const cancelDelete = () => {
    setEmployeeToDelete(null)
    setDeleteError('')
  }

  const confirmDelete = async () => {
    if (!employeeToDelete) return
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteEmployee(employeeToDelete.employeeId || employeeToDelete._id)
      setEmployeeToDelete(null)
      toast.success('Employee removed successfully.')
      await onChanged?.()
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="panel detail-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Employee directory</p>
          <h3>{searchTerm ? `Search results for "${searchTerm}"` : 'All employees'}</h3>
        </div>
        <div className="action-row">
          {searchTerm ? (
            <Button variant="secondary" to="/dashboard/employees">
              Clear Search
            </Button>
          ) : null}
          <Button onClick={() => setIsAddingEmployee(true)}>+ Add Employee</Button>
        </div>
      </div>

      {error ? <div className="feedback-banner feedback-banner-error">{error}</div> : null}

      <div className="table-responsive">
        <table className="table table-dark table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>Loading employees...</td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  {searchTerm
                    ? `No employees found for "${searchTerm}".`
                    : 'No employees found. Add your first employee.'}
                </td>
              </tr>
            ) : (
              employees.map((employee) => (
                <tr key={employee._id}>
                  <td>{employee.employeeId}</td>
                  <td>{employee.name}</td>
                  <td>{employee.email}</td>
                  <td>{employee.department}</td>
                  <td>
                    <span
                      className={`pill ${employee.status === 'Active' ? 'pill-success' : 'pill-muted'}`}
                    >
                      {employee.status || 'Active'}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Button variant="view" onClick={() => setViewingEmployee(employee)}>
                        View
                      </Button>
                      <Button variant="edit" onClick={() => setEditingEmployee(employee)}>
                        Edit
                      </Button>
                      <Button variant="delete" onClick={() => handleDeleteRequest(employee)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <EmployeeModal employee={viewingEmployee} onClose={() => setViewingEmployee(null)} />
      <CreateEmployee
        open={isAddingEmployee}
        onClose={() => setIsAddingEmployee(false)}
        onCreated={onChanged}
      />
      <DeleteModal
        employee={employeeToDelete}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
        deleting={deleting}
        error={deleteError}
      />
      <EditEmployee employee={editingEmployee} onClose={() => setEditingEmployee(null)} onUpdated={onChanged} />
    </div>
  )
}

export default EmployeeList
