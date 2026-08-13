import { useState } from 'react'

function ResetPass({ onBack }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!password || !confirmPassword) {
      setError('Please fill all fields.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setError('')
    setSubmitted(true)
  }

  return (
    <div className="auth-page auth-page--light">
      <div className="auth-card">
        <h1>Reset Password</h1>

        <p>Enter your new password and confirm it below.</p>

        {submitted ? (
          <div className="auth-success-box">
            <p>Password reset successfully!</p>

            <button type="button" className="auth-secondary-btn" onClick={onBack}>
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <label>New Password</label>
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
            />

            <label>Confirm Password</label>
            <input
              className="auth-input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />

            {error ? <p className="auth-error">{error}</p> : null}

            <button type="submit" className="auth-submit-btn">Reset Password</button>

            <button type="button" className="auth-text-btn" onClick={onBack}>
              Back to Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default ResetPass
