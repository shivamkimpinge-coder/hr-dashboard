import { useState } from 'react'
import { Link } from 'react-router-dom'

function Signup({ onSignup, error }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSignup?.(formData.name, formData.email, formData.password)
  }

  return (
    <div className="auth-page auth-page--dark">
      <div className="auth-card">
        <h1>Create Account</h1>
        <p>Join HR Hub and manage your team.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label>Full Name</label>
            <input className="auth-input" type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Your name" required />
          </div>

          <div className="auth-field">
            <label>Email</label>
            <input className="auth-input" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@company.com" required />
          </div>

          <div className="auth-field">
            <label>Password</label>
            <input className="auth-input" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Create a password" required />
          </div>

          {error ? <p className="auth-error">{error}</p> : null}

          <button type="submit" className="auth-submit-btn">Create Account</button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Signup
