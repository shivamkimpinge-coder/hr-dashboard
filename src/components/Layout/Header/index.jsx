import Button from '../../../utils/Button/button'

function Header({ eyebrow = 'Employee management system', title = 'HR Dashboard', currentUser, onLogout }) {
  return (
    <header className="dashboard-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      <div className="header-actions">
        {currentUser ? <span className="header-user">Hi, {currentUser.name}</span> : null}
        <Button to="/dashboard/add-employee">+ Add Employee</Button>
        {/* <Button variant="secondary" onClick={onLogout}>
          Logout
        </Button> */}
      </div>
    </header>
  )
}

export default Header
