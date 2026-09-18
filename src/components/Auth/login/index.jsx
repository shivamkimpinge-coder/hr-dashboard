import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { takeSessionEndedMessage } from '../../../hooks/api'
import CommonForm from '../../../utils/Form/commonform'
import useApi from '../../../hooks/useApi'

const EMAIL_PATTERN = /\S+@\S+\.\S+/

function Login({ onLoginSuccess, onForgotPassword }) {
  const location = useLocation()
  const [token1,setToken1] = useState(null)
  const { login, loading } = useApi()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => {
    if (location.state?.signupSuccess) {
      toast.success(
        location.state.message || 'Account created. An Admin or HR must approve it before you can sign in.',
        { id: 'signup-success', duration: 6000 }
      )
    }
  }, [location.state])

  useEffect(() => {
    const endedMessage = takeSessionEndedMessage()
    if (endedMessage) {
      toast.error(endedMessage, { id: 'session-ended', duration: 6000 })
    }
  }, [])

  const onSubmit = async ({ email, password }) => {
    try {
      const data = await login({ email, password })
      console.log('Login successful:', data)
      toast.success('Welcome back!')
      onLoginSuccess?.(data.user, data.token)
      setToken1(data.token)
    } catch (err) {
      // A pending or deactivated account is a longer explanation than a simple
      // credential error, so it gets more time on screen.
      const isStatusBlock = err.status === 403
      toast.error(err.message || 'Invalid email or password.', {
        duration: isStatusBlock ? 6000 : 4000,
      })
    }
  }

  return (
    <div className="auth-page auth-page--dark">
      <div className="auth-card">
        <h1>Welcome Back</h1>
        <p>Sign in to continue</p>

        <CommonForm
          formClassName="auth-form"
          fieldClassName="auth-field"
          register={register}
          errors={errors}
          fields={[
            {
              name: 'email',
              label: 'Email',
              type: 'email',
              placeholder: 'Enter your email',
              className: 'auth-input',
              rules: {
                required: 'Email is required',
                pattern: { value: EMAIL_PATTERN, message: 'Please enter a valid email address' },
              },
            },
            {
              name: 'password',
              label: 'Password',
              type: 'password',
              showToggle: true,
              placeholder: 'Enter your password',
              className: 'auth-input',
              rules: { required: 'Password is required' },
            },
          ]}
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="auth-options">
            <label>
              <input type="checkbox" /> Remember me
            </label>

            <button type="button" className="auth-text-btn" onClick={onForgotPassword}>
              Forgot Password?
            </button>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </CommonForm>

        <div className="auth-footer">
          Don&apos;t have an account? <Link to="/signup">Create Account</Link>
        </div>
      </div>
    </div>
  )
}

export default Login
