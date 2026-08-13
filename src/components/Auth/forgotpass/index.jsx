import { useState } from 'react'

function ForgetPass({ onBack }) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    setError('')
    setSubmitted(true)
  }

  return (
    <div className="auth-page auth-page--light">
      <div className="auth-card">
        <h1>Forgot Password?</h1>
        <p>Enter your email and we’ll send you a reset link.</p>

        {submitted ? (
          <div className="auth-success-box">
            <p>Reset link sent to {email}</p>
            <button type="button" className="auth-secondary-btn" onClick={onBack}>
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <label>Email</label>
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />

            {error ? <p className="auth-error">{error}</p> : null}

            <button type="submit" className="auth-submit-btn">Send Reset Link</button>
            <button type="button" className="auth-text-btn" onClick={onBack}>
              Back to Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default ForgetPass
