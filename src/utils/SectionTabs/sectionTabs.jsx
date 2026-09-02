import { NavLink } from 'react-router-dom'

// A small in-page tab row used to switch between the sub-pages of one
// sidebar section (e.g. Attendance -> My Attendance / Mark / Reports),
// now that the sidebar itself only links to the section's main page.
function SectionTabs({ tabs }) {
  const visibleTabs = tabs.filter(Boolean)
  if (visibleTabs.length < 2) return null

  return (
    <nav className="section-tabs">
      {visibleTabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => `section-tab${isActive ? ' is-active' : ''}`}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}

export default SectionTabs
