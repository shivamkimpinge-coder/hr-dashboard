import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../Layout/Sidebar'
import Header from '../Layout/Header'

// Same Sidebar/Header shell as the regular DashboardLayout, for visual
// parity — Sidebar already branches to a SuperAdmin-only nav (just
// "Companies") for this role, so nothing else needs to change there.
function SuperAdminLayout({ currentUser, onLogout }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false)

  const toggleSidebar = () => {
    if (window.matchMedia('(max-width: 960px)').matches) {
      setSidebarMobileOpen((prev) => !prev)
    } else {
      setSidebarCollapsed((prev) => !prev)
    }
  }

  return (
    <div className={`dashboard-page${sidebarCollapsed ? ' sidebar-is-collapsed' : ''}`}>
      <Sidebar
        currentUser={currentUser}
        collapsed={sidebarCollapsed}
        mobileOpen={sidebarMobileOpen}
        onNavigate={() => setSidebarMobileOpen(false)}
      />

      {sidebarMobileOpen ? (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setSidebarMobileOpen(false)}
        />
      ) : null}

      <main className="dashboard-main">
        <Header
          eyebrow="Platform administration"
          title="Super Admin"
          currentUser={currentUser}
          onLogout={onLogout}
          onToggleSidebar={toggleSidebar}
        />
        <Outlet />
      </main>
    </div>
  )
}

export default SuperAdminLayout
