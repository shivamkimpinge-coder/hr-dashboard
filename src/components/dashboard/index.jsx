import { useEffect, useMemo, useState } from 'react'
import { Route, Routes, useNavigate } from 'react-router-dom'
import Button from '../../utils/Button/button'
import Header from '../Layout/Header'
import Sidebar from '../Layout/Sidebar'

const STORAGE_KEY = 'hrEmployees'
const VERSION_KEY = 'hrEmployeesVersion'
const SEED_VERSION = 2

const initialEmployees = [
  {
    id: 'EMP001',
    fullName: 'shivam',
    email: 'shivam@gmail.com',
    phone: '+91 9876543210',
    gender: 'Male',
    dob: '2005-01-05',
    department: 'HR',
    designation: 'HR Manager',
    salary: '$8,500',
    joiningDate: '2021-01-12',
    address: 'Patna , Bihar',
    status: 'Active',
  },
  {
    id: 'EMP002',
    fullName: 'Ankit',
    email: 'Ankit@gmail.com',
    phone: '+91 9876543217',
    gender: 'Male',
    dob: '204-08-21',
    department: 'Engineering',
    designation: 'Frontend Developer',
    salary: '$6,200',
    joiningDate: '2023-06-18',
    address: 'Bangalore, Karnataka',
    status: 'Active',
  },
  {
    id: 'EMP003',
    fullName: 'Virt',
    email: 'Virat@gmai.com',
    phone: '+91 9876543218',
    gender: 'male',
    dob: '1995-11-09',
    department: 'Operations',
    designation: 'Operations Lead',
    salary: '$5,900',
    joiningDate: '2022-09-01',
    address: '7 Harbor Lane, Austin',
    status: 'Inactive',
  },
]

const emptyForm = {
  fullName: '',
  email: '',
  phone: '',
  gender: 'Male',
  dob: '',
  department: '',
  designation: '',
  salary: '',
  joiningDate: '',
  address: '',
  status: 'Active',
}

function OverviewContent({ employees, stats }) {
  return (
    <>
      <section className="stats-grid">
        {stats.map((item) => (
          <article className="stat-card" key={item.label}>
            <p>{item.label}</p>
            <h2>{item.value}</h2>
            <span>{item.trend}</span>
          </article>
        ))}
      </section>

      <section className="row g-3">
        <div className="col-lg-8">
          <div className="panel h-100">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Latest updates</p>
                <h3>Recent employee activity</h3>
              </div>
            <Button variant="secondary" to="/dashboard/employees">
                View all
              </Button>
            </div>
            <div className="table-responsive">
              <table className="table table-dark table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.slice(0, 4).map((employee) => (
                    <tr key={employee.id}>
                      <td>{employee.fullName}</td>
                      <td>{employee.department}</td>
                      <td>
                        <span className={`pill ${employee.status === 'Active' ? 'pill-success' : 'pill-muted'}`}>
                          {employee.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="panel h-100">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">This week</p>
                <h3>HR focus</h3>
              </div>
            </div>
            <div className="d-flex flex-column gap-3">
              <div className="overview-card">
                <h4>Onboarding</h4>
                <p>Review paperwork for the newest hires.</p>
              </div>
              <div className="overview-card">
                <h4>Payroll</h4>
                <p>Verify salary updates before Friday close.</p>
              </div>
              <div className="overview-card">
                <h4>Retention</h4>
                <p>Schedule check-ins for inactive employees.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function EmployeesContent({ employees, onView, onEdit, onDelete }) {
  return (
    <div className="panel detail-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Employee directory</p>
          <h3>All employees</h3>
        </div>
<Button to="/dashboard/add-employee">
          + Add Employee
        </Button>
      </div>

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
            {employees.map((employee) => (
              <tr key={employee.id}>
                <td>{employee.id}</td>
                <td>{employee.fullName}</td>
                <td>{employee.email}</td>
                <td>{employee.department}</td>
                <td>
                  <span className={`pill ${employee.status === 'Active' ? 'pill-success' : 'pill-muted'}`}>
                    {employee.status}
                  </span>
                </td>
                <td>
<div className="table-actions">
                    <Button variant="view" onClick={() => onView(employee)}>
                      View
                    </Button>
                    <Button variant="edit" onClick={() => onEdit(employee)}>
                      Edit
                    </Button>
                    <Button variant="delete" onClick={() => onDelete(employee)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AddEmployeeContent({ formData, onChange, onSubmit, editingId, feedback }) {
  return (
    <div className="panel detail-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Employee form</p>
          <h3>{editingId ? 'Edit Employee' : 'Add Employee'}</h3>
        </div>
        <Button variant="close" to="/dashboard/employees" aria-label="Close">
          ✕
        </Button>
      </div>

      {feedback ? <div className="feedback-banner">{feedback}</div> : null}

      <form className="employee-form" onSubmit={onSubmit}>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="fullName">Full Name</label>
            <input id="fullName" name="fullName" value={formData.fullName} onChange={onChange} required />
          </div>
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" value={formData.email} onChange={onChange} required />
          </div>
          <div className="form-field">
            <label htmlFor="phone">Phone Number</label>
            <input id="phone" name="phone" value={formData.phone} onChange={onChange} required />
          </div>
          <div className="form-field">
            <label htmlFor="gender">Gender</label>
            <select id="gender" name="gender" value={formData.gender} onChange={onChange}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="dob">Date of Birth</label>
            <input id="dob" name="dob" type="date" value={formData.dob} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="department">Department</label>
            <input id="department" name="department" value={formData.department} onChange={onChange} required />
          </div>
          <div className="form-field">
            <label htmlFor="designation">Designation</label>
            <input id="designation" name="designation" value={formData.designation} onChange={onChange} required />
          </div>
          <div className="form-field">
            <label htmlFor="salary">Salary</label>
            <input id="salary" name="salary" type="number" min="0" value={formData.salary} onChange={onChange} required />
          </div>
          <div className="form-field">
            <label htmlFor="joiningDate">Joining Date</label>
            <input id="joiningDate" name="joiningDate" type="date" value={formData.joiningDate} onChange={onChange} required />
          </div>
          <div className="form-field">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" value={formData.status} onChange={onChange}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="address">Address</label>
          <textarea id="address" name="address" rows="3" value={formData.address} onChange={onChange} required />
        </div>

<div className="action-row">
          <Button type="submit">
            {editingId ? 'Update Employee' : 'Save Employee'}
          </Button>
        </div>
      </form>
    </div>
  )
}

function EditEmployeeModal({ employee, onClose, onSubmit }) {
  const [formData, setFormData] = useState(() => {
    if (!employee) return emptyForm
    return {
      ...employee,
      salary: employee.salary ? employee.salary.replace(/[^0-9.-]+/g, '') : '',
    }
  })
  const [feedback, setFeedback] = useState('')

  if (!employee) return null

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!formData.fullName || !formData.email || !formData.phone || !formData.department || !formData.designation || !formData.salary || !formData.joiningDate || !formData.address) {
      setFeedback('Please complete all required employee fields.')
      return
    }

    const emailPattern = /\S+@\S+\.\S+/
    if (!emailPattern.test(formData.email)) {
      setFeedback('Please enter a valid email address.')
      return
    }

    const salaryValue = Number(formData.salary)
    if (Number.isNaN(salaryValue) || salaryValue <= 0) {
      setFeedback('Please enter a valid salary amount.')
      return
    }

    onSubmit({
      ...formData,
      salary: `$${salaryValue.toLocaleString()}`,
    })
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

{feedback ? <div className="feedback-banner">{feedback}</div> : null}

        <form className="employee-form" onSubmit={handleSubmit}>
          <div className="form-grid">
<div className="form-field">
              <label htmlFor="edit-fullName">Full Name</label>
              <input id="edit-fullName" name="fullName" value={formData.fullName} onChange={handleChange} required />
            </div>
            <div className="form-field">
              <label htmlFor="edit-email">Email</label>
              <input id="edit-email" name="email" type="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="form-field">
              <label htmlFor="edit-phone">Phone Number</label>
              <input id="edit-phone" name="phone" value={formData.phone} onChange={handleChange} required />
            </div>
            <div className="form-field">
              <label htmlFor="edit-gender">Gender</label>
              <select id="edit-gender" name="gender" value={formData.gender} onChange={handleChange}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="edit-dob">Date of Birth</label>
              <input id="edit-dob" name="dob" type="date" value={formData.dob} onChange={handleChange} />
            </div>
            <div className="form-field">
              <label htmlFor="edit-department">Department</label>
              <input id="edit-department" name="department" value={formData.department} onChange={handleChange} required />
            </div>
            <div className="form-field">
              <label htmlFor="edit-designation">Designation</label>
              <input id="edit-designation" name="designation" value={formData.designation} onChange={handleChange} required />
            </div>
            <div className="form-field">
              <label htmlFor="edit-salary">Salary</label>
              <input id="edit-salary" name="salary" type="number" min="0" value={formData.salary} onChange={handleChange} required />
            </div>
            <div className="form-field">
              <label htmlFor="edit-joiningDate">Joining Date</label>
              <input id="edit-joiningDate" name="joiningDate" type="date" value={formData.joiningDate} onChange={handleChange} required />
            </div>
            <div className="form-field">
              <label htmlFor="edit-status">Status</label>
              <select id="edit-status" name="status" value={formData.status} onChange={handleChange}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="edit-address">Address</label>
            <textarea id="edit-address" name="address" rows="3" value={formData.address} onChange={handleChange} required />
          </div>

<div className="action-row">
            <Button type="submit">
              Update Employee
            </Button>
            {/* <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button> */}
          </div>
        </form>
      </div>
    </div>
  )
}

function ProfileContent({ currentUser }) {
  const user = currentUser || {
    name: 'Guest',
    email: 'guest@hrhub.com',
    role: 'Viewer',
  }

  return (
    <div className="panel detail-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Profile</p>
          <h3>Account details</h3>
        </div>
      </div>
      <div className="overview-card">
        <h4>Welcome back, {user.name}</h4>
        
      </div>
      <div className="detail-grid">
        <div className="detail-card">
          <p className="eyebrow">Personal info</p>
          <p><strong>Full name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role || 'User'}</p>
          {user.id ? <p><strong>User ID:</strong> {user.id}</p> : null}
        </div>
      </div>
    </div>
  )
}

function EmployeeModal({ employee, onClose }) {
  if (!employee) return null

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Employee profile</p>
            <h3>{employee.fullName}</h3>
          </div>
<Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="detail-grid">
          <div className="detail-card">
            <p className="eyebrow">Basic info</p>
            <p><strong>ID:</strong> {employee.id}</p>
            <p><strong>Email:</strong> {employee.email}</p>
            <p><strong>Phone:</strong> {employee.phone}</p>
            <p><strong>Gender:</strong> {employee.gender}</p>
          </div>
          <div className="detail-card">
            <p className="eyebrow">Work info</p>
            <p><strong>Department:</strong> {employee.department}</p>
            <p><strong>Designation:</strong> {employee.designation}</p>
            <p><strong>Salary:</strong> {employee.salary}</p>
            <p><strong>Status:</strong> {employee.status}</p>
          </div>
        </div>

        <div className="detail-card mt-3">
          <p className="eyebrow">Additional details</p>
          <p><strong>Birthdate:</strong> {employee.dob}</p>
          <p><strong>Joining Date:</strong> {employee.joiningDate}</p>
          <p><strong>Address:</strong> {employee.address}</p>
        </div>
      </div>
    </div>
  )
}

function DeleteModal({ employee, onCancel, onConfirm }) {
  if (!employee) return null

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card confirm-card">
        <h3>Delete employee?</h3>
        <p>This will permanently remove {employee.fullName} from the employee roster.</p>
<div className="action-row">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>
            Confirm Delete
          </Button>
        </div>
      </div>
    </div>
  )
}

function Dashboard({ onLogout, currentUser }) {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState(() => {
    const storedVersion = localStorage.getItem(VERSION_KEY)
    if (storedVersion !== String(SEED_VERSION)) {
      return initialEmployees
    }
    const storedEmployees = localStorage.getItem(STORAGE_KEY)
    if (storedEmployees) {
      try {
        return JSON.parse(storedEmployees)
      } catch {
        return initialEmployees
      }
    }
    return initialEmployees
  })
  const [formData, setFormData] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [feedback, setFeedback] = useState('')
const [viewingEmployee, setViewingEmployee] = useState(null)
  const [employeeToDelete, setEmployeeToDelete] = useState(null)
  const [editingEmployee, setEditingEmployee] = useState(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(employees))
    localStorage.setItem(VERSION_KEY, String(SEED_VERSION))
  }, [employees])

  const stats = useMemo(() => {
    const total = employees.length
    const active = employees.filter((employee) => employee.status === 'Active').length
    const inactive = total - active
    const newEmployees = employees.filter((employee) => {
      if (!employee.joiningDate) return false
      const joiningDate = new Date(employee.joiningDate)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      return joiningDate >= sevenDaysAgo
    }).length

    return [
      { label: 'Total Employees', value: total, trend: 'All team members' },
      { label: 'Active Employees', value: active, trend: 'Currently active' },
      { label: 'Inactive Employees', value: inactive, trend: 'Need follow-up' },
      { label: 'New Employees', value: newEmployees, trend: 'Joined this week' },
    ]
  }, [employees])

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData(emptyForm)
    setEditingId(null)
    setFeedback('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!formData.fullName || !formData.email || !formData.phone || !formData.department || !formData.designation || !formData.salary || !formData.joiningDate || !formData.address) {
      setFeedback('Please complete all required employee fields.')
      return
    }

    const emailPattern = /\S+@\S+\.\S+/
    if (!emailPattern.test(formData.email)) {
      setFeedback('Please enter a valid email address.')
      return
    }

    const salaryValue = Number(formData.salary)
    if (Number.isNaN(salaryValue) || salaryValue <= 0) {
      setFeedback('Please enter a valid salary amount.')
      return
    }

    const employeePayload = {
      ...formData,
      salary: `$${salaryValue.toLocaleString()}`,
      id: editingId || `EMP${String(Math.max(0, ...employees.map((item) => Number(item.id.replace(/\D/g, '')))) + 1).padStart(3, '0')}`,
    }

if (editingId) {
      setEmployees((prev) => prev.map((employee) => (employee.id === editingId ? employeePayload : employee)))
      setFeedback('Employee updated successfully.')
    } else {
      setEmployees((prev) => [employeePayload, ...prev])
      setFeedback('Employee created successfully.')
    }

    resetForm()
    navigate('/dashboard/employees')
  }

const handleEdit = (employee) => {
    setEditingEmployee(employee)
  }

  const handleEditSubmit = (updatedEmployee) => {
    if (!editingEmployee) return
    setEmployees((prev) => prev.map((employee) => (employee.id === editingEmployee.id ? updatedEmployee : employee)))
    setEditingEmployee(null)
    setFeedback('Employee updated successfully.')
  }

  const handleDeleteRequest = (employee) => {
    setEmployeeToDelete(employee)
  }

  const confirmDelete = () => {
    if (!employeeToDelete) return
    setEmployees((prev) => prev.filter((employee) => employee.id !== employeeToDelete.id))
    setEmployeeToDelete(null)
    setFeedback('Employee removed successfully.')
  }

const cancelDelete = () => {
    setEmployeeToDelete(null)
  }

  return (
    <div className="dashboard-page">
      <Sidebar onLogout={onLogout} />

      <main className="dashboard-main">
        <Header currentUser={currentUser} onLogout={onLogout} />

        <Routes>
          <Route path="/" element={<OverviewContent employees={employees} stats={stats} />} />
          <Route path="/employees" element={<EmployeesContent employees={employees} onView={setViewingEmployee} onEdit={handleEdit} onDelete={handleDeleteRequest} />} />
<Route path="/add-employee" element={<AddEmployeeContent formData={formData} onChange={handleInputChange} onSubmit={handleSubmit} editingId={editingId} feedback={feedback} />} />
<Route path="/profile" element={<ProfileContent currentUser={currentUser} />} />
        </Routes>
      </main>

<EmployeeModal employee={viewingEmployee} onClose={() => setViewingEmployee(null)} />
      <DeleteModal employee={employeeToDelete} onCancel={cancelDelete} onConfirm={confirmDelete} />
      <EditEmployeeModal employee={editingEmployee} onClose={() => setEditingEmployee(null)} onSubmit={handleEditSubmit} />
    </div>
  )
}

export default Dashboard
