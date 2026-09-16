import { NavLink } from 'react-router-dom'

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
