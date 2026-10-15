import PerfAvatar from '../Performance/PerfAvatar'
import { IconBriefcase, IconBuilding, IconCalendar, IconIdBadge, IconMail, IconUser } from '../Layout/Sidebar/icons'

const formatJoinDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

function HeaderFact({ icon: Icon, label, value }) {
  return (
    <div className="emp-fact">
      <span className="emp-fact-icon">
        <Icon />
      </span>
      <div>
        <p>{label}</p>
        <strong>{value || '—'}</strong>
      </div>
    </div>
  )
}

// Same hero-card layout as components/Empolyee/employeeDetails — shared
// between the full-page employee view (employeeDetail.jsx) and the
// roster-table "View" modal (companyDetail.jsx), so both render identical
// profile details instead of maintaining two copies of this markup.
function EmployeeHeroCard({ employee }) {
  return (
    <div className="emp-hero">
      <div className="emp-hero-main">
        <PerfAvatar name={employee.name} size="lg" />

        <div className="emp-hero-info">
          <div className="emp-hero-name-row">
            <h2>{employee.name}</h2>
            <span className={`pill ${employee.status === 'Active' ? 'pill-success' : 'pill-muted'}`}>
              {employee.status || 'Active'}
            </span>
          </div>

          <div className="emp-hero-meta">
            <span>
              <IconBriefcase />
              {employee.designation || employee.role}
            </span>
            <span>
              <IconIdBadge />
              {employee.employeeId || '—'}
            </span>
            <span>
              <IconBuilding />
              {employee.department || '—'}
            </span>
            <span>
              <IconMail />
              {employee.email}
            </span>
          </div>
        </div>
      </div>

      <div className="emp-hero-facts">
        <HeaderFact icon={IconCalendar} label="Join Date" value={formatJoinDate(employee.joiningDate)} />
        <HeaderFact icon={IconBriefcase} label="Work Type" value={employee.workType} />
        <HeaderFact icon={IconUser} label="Phone" value={employee.phone} />
      </div>
    </div>
  )
}

export default EmployeeHeroCard
