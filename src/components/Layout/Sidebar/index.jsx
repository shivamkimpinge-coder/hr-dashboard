import { useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import {
  IconGrid,
  IconUsers,
  IconClock,
  IconKanban,
  IconWallet,
  IconCalendar,
  IconSparkle,
  IconTrendingUp,
} from './icons'

// One flat, directly clickable link per section — no dropdowns/arrows.
// Sub-features (Add Employee, Mark Attendance, Salary Structure, Apply
// Leave, ...) live as in-page tabs inside their section instead of here.
// Profile and Logout live in the header's user menu, not here.
function buildNavItems(isAdmin) {
  return [
    { key: 'dashboard', label: 'Dashboard', icon: IconGrid, to: '/dashboard', end: true },
    isAdmin && { key: 'employees', label: 'Employees', icon: IconUsers, to: '/dashboard/employees' },
    { key: 'attendance', label: 'Attendance', icon: IconClock, to: '/dashboard/attendance' },
    { key: 'leaves', label: 'Leaves', icon: IconCalendar, to: '/dashboard/leave' },
    { key: 'performance', label: 'Performance', icon: IconTrendingUp, to: '/dashboard/performance' },
    { key: 'payroll', label: 'Payroll', icon: IconWallet, to: '/dashboard/payroll' },
    { key: 'tasks', label: 'Tasks', icon: IconKanban, to: '/dashboard/tasks' },
  ].filter(Boolean)
}

function Sidebar({ currentUser }) {
  const isAdmin = currentUser?.role === 'Admin'
  const navItems = useMemo(() => buildNavItems(isAdmin), [isAdmin])

  return (
    <aside className="sidebar-card">
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark" aria-hidden="true">
          <IconSparkle />
        </span>
        <div>
          <p className="eyebrow">HR office</p>
        </div>
      </div>

      <p className="sidebar-section-label">Menu</p>

      <nav className="sidebar-links">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.key}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-nav-item${isActive ? ' active-link' : ''}`}
            >
              <span className="sidebar-nav-icon">
                <Icon />
              </span>
              <span className="sidebar-nav-label">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar
