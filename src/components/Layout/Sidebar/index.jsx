import { NavLink } from 'react-router-dom'
import Button from '../../../utils/Button/button'

function Sidebar({ onLogout, currentUser }) {
  const isAdmin = currentUser?.role === 'Admin'

  return (
    <aside className="sidebar-card">
      <div>
        <p className="eyebrow">HR office</p>
        {/* <h2>People Center</h2> */}
      </div>
      <nav className="sidebar-links">
        <NavLink to="/dashboard" end className={({ isActive }) => (isActive ? 'active-link' : '')}>
          Dashboard
        </NavLink>
        {isAdmin ? (
          <>
            <NavLink to="/dashboard/employees" className={({ isActive }) => (isActive ? 'active-link' : '')}>
              Employees
            </NavLink>
            <NavLink to="/dashboard/add-employee" className={({ isActive }) => (isActive ? 'active-link' : '')}>
              Add Employee
            </NavLink>
          </>
        ) : null}
        <NavLink to="/dashboard/attendance" className={({ isActive }) => (isActive ? 'active-link' : '')}>
          Attendance
        </NavLink>
        <NavLink to="/dashboard/payroll" className={({ isActive }) => (isActive ? 'active-link' : '')}>
          Payroll
        </NavLink>
        <NavLink to="/dashboard/leave" className={({ isActive }) => (isActive ? 'active-link' : '')}>
          Leave
        </NavLink>
        <NavLink to="/dashboard/profile" className={({ isActive }) => (isActive ? 'active-link' : '')}>
          Profile
        </NavLink>
        <Button variant="logout" onClick={onLogout}>
          Logout
        </Button>
      </nav>
    </aside>
  )
}

export default Sidebar
