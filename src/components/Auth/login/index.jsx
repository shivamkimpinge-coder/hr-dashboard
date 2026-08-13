import { useState } from 'react'
import { Link } from 'react-router-dom'

function Login({ onLogin, error, onForgotPassword }) {
  const [formData, setFormData] = useState({
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
    onLogin?.(formData.email, formData.password)
  }

  return (
    <div className="auth-page auth-page--dark">
      <div className="auth-card">
        <h1>Welcome Back</h1>
        <p>Sign in to continue</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>Email</label>
            <input
              className="auth-input"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-field">
            <label>Password</label>
            <input
              className="auth-input"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {error ? <p className="auth-error">{error}</p> : null}

          <div className="auth-options">
            <label>
              <input type="checkbox" /> Remember me
            </label>

            <button type="button" className="auth-text-btn" onClick={onForgotPassword}>
              Forgot Password?
            </button>
          </div>

          <button type="submit" className="auth-submit-btn">Sign In</button>
        </form>

        <div className="auth-footer">
          Don&apos;t have an account? <Link to="/signup">Create Account</Link>
        </div>
      </div>
    </div>
  )
}

export default Login
