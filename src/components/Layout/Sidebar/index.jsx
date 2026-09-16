import { useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import {
  IconGrid,
  IconUsers,
  IconClock,
  IconKanban,
  IconWallet,
  IconCalendar,
  IconTrendingUp,
} from './icons'

function buildNavItems(canManageEmployees) {
  return [
    { key: 'dashboard', label: 'Dashboard', icon: IconGrid, to: '/dashboard', end: true },

    canManageEmployees && {
  key: 'employees',
  label: 'Employees',
  icon: IconUsers,
  to: '/dashboard/employees'
},

    { key: 'attendance', label: 'Attendance', icon: IconClock, to: '/dashboard/attendance' },
    { key: 'leaves', label: 'Leaves', icon: IconCalendar, to: '/dashboard/leave' },
    { key: 'performance', label: 'Performance', icon: IconTrendingUp, to: '/dashboard/performance' },
    { key: 'payroll', label: 'Payroll', icon: IconWallet, to: '/dashboard/payroll' },
    { key: 'tasks', label: 'Tasks', icon: IconKanban, to: '/dashboard/tasks' },
  ].filter(Boolean)
}

function Sidebar({ currentUser, collapsed = false, mobileOpen = false, onNavigate }) {
  const isAdmin = currentUser?.role === 'Admin'
const isHR = currentUser?.role === 'HR'

const canManageEmployees = isAdmin || isHR

const navItems = useMemo(
  () => buildNavItems(canManageEmployees),
  [canManageEmployees]
)

  return (
    <aside className={`sidebar-card${collapsed ? ' is-collapsed' : ''}${mobileOpen ? ' is-mobile-open' : ''}`}>
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark" aria-hidden="true">
          HR
        </span>
        <span className="sidebar-brand-text">HR Office</span>
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
              title={collapsed ? item.label : undefined}
              onClick={onNavigate}
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
