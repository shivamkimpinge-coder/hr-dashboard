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

// One flat, directly clickable link per section — no dropdowns/arrows.
// Sub-features (Add Employee, Mark Attendance, Salary Structure, Apply
// Leave, ...) live as in-page tabs inside their section instead of here.
// Profile and Logout live in the header's user menu, not here.
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

// `collapsed` narrows the rail to icons only on desktop; `mobileOpen` slides the
// full panel in over the content on small screens. Both are owned by
// DashboardLayout so the header's toggle and the sidebar stay in sync.
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
