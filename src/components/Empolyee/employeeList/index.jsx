import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Button from '../../../utils/Button/button'
import useApi from '../../../hooks/useApi'
import EditEmployee from '../updateEmployee'
import CreateEmployee from '../createEmployee'
import { isAdminRole } from '../../../utils/roles'
import { formatSalary } from '../../../utils/EmployeeUtils/employeeFormConfig'

const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function EmployeeModal({ employee, onClose }) {
  if (!employee) return null

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Employee</p>
            <h3>{employee.name}</h3>
          </div>
          <Button variant="close" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>

        <div className="attendance-hero-status-top">
          <span className={`pill ${employee.role === 'Admin' ? 'pill-danger' : employee.role === 'HR' ? 'pill-warning' : 'pill-muted'}`}>
            {employee.role || 'Employee'}
          </span>
          <span className={`pill ${employee.status === 'Active' ? 'pill-success' : 'pill-muted'}`}>
            {employee.status || 'Active'}
          </span>
        </div>

        <div className="detail-grid mt-3">
          <div className="detail-card">
            <p>Employee ID</p>
            <p>{employee.employeeId}</p>
          </div>
          <div className="detail-card">
            <p>Email</p>
            <p>{employee.email}</p>
          </div>
          <div className="detail-card">
            <p>Phone</p>
            <p>{employee.phone || '—'}</p>
          </div>
          <div className="detail-card">
            <p>Gender</p>
            <p>{employee.gender || '—'}</p>
          </div>
          <div className="detail-card">
            <p>Date of Birth</p>
            <p>{formatDate(employee.dob)}</p>
          </div>
          <div className="detail-card">
            <p>Department</p>
            <p>{employee.department}</p>
          </div>
          <div className="detail-card">
            <p>Designation</p>
            <p>{employee.designation}</p>
          </div>
          <div className="detail-card">
            <p>Joining Date</p>
            <p>{formatDate(employee.joiningDate)}</p>
          </div>
          <div className="detail-card">
            <p>Salary</p>
            <p>{formatSalary(employee.salary)}</p>
          </div>
          <div className="detail-card">
            <p>Address</p>
            <p>{employee.address || '—'}</p>
          </div>
        </div>

        <div className="action-row mt-3">
          <Button variant="secondary" to={`/dashboard/employees/${employee.employeeId}`}>
            View Full Details →
          </Button>
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

function EmployeeList({ employees, loading, error, searchTerm = '', onChanged, currentUser }) {
  const { deleteEmployee } = useApi()
  const isAdmin = isAdminRole(currentUser)

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
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>Loading employees...</td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  {searchTerm
                    ? `No employees found for "${searchTerm}".`
                    : 'No employees found. Add your first employee.'}
                </td>
              </tr>
            ) : (
              employees.map((employee) => (
                <tr key={employee._id}>
                  <td>
                    <Link className="table-link" to={`/dashboard/employees/${employee.employeeId}`}>
                      {employee.employeeId}
                    </Link>
                  </td>
                  <td>{employee.name}</td>
                  <td>{employee.email}</td>
                  <td>{employee.department}</td>
                  <td>
                    <span className={`pill ${employee.role === 'Admin' ? 'pill-danger' : employee.role === 'HR' ? 'pill-warning' : 'pill-muted'}`}>
                      {employee.role || 'Employee'}
                    </span>
                  </td>
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
                      {isAdmin ? (
                        <Button variant="delete" onClick={() => handleDeleteRequest(employee)}>
                          Delete
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CreateEmployee
        open={isAddingEmployee}
        onClose={() => setIsAddingEmployee(false)}
        onCreated={onChanged}
        currentUser={currentUser}
      />
      <EmployeeModal employee={viewingEmployee} onClose={() => setViewingEmployee(null)} />
      <DeleteModal
        employee={employeeToDelete}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
        deleting={deleting}
        error={deleteError}
      />
      <EditEmployee
        employee={editingEmployee}
        onClose={() => setEditingEmployee(null)}
        onUpdated={onChanged}
        currentUser={currentUser}
      />
    </div>
  )
}

export default EmployeeList
