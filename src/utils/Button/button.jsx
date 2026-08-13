import { Link } from 'react-router-dom'

const variantClass = {
  primary: 'primary-btn',
  secondary: 'secondary-btn',
  view: 'action-btn action-btn-view',
  edit: 'action-btn action-btn-edit',
  delete: 'action-btn action-btn-delete',
  logout: 'sidebar-logout',
  close: 'close-btn',
}

function Button({ variant = 'primary', to, type = 'button', onClick, children, className = '', ...rest }) {
  const classes = `${variantClass[variant] || variantClass.primary} ${className}`.trim()

  if (to) {
    return (
      <Link to={to} className={classes} onClick={onClick} {...rest}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} className={classes} onClick={onClick} {...rest}>
      {children}
    </button>
  )
}

export default Button
