import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import CommonForm from '../../../utils/Form/commonform'
import useApi from '../../../hooks/useApi'

const EMAIL_PATTERN = /\S+@\S+\.\S+/

function Login({ onLoginSuccess, onForgotPassword }) {
  const location = useLocation()
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
      toast.success('Account created! Please sign in.', { id: 'signup-success' })
    }
  }, [location.state])

  const onSubmit = async ({ email, password }) => {
    try {
      const data = await login({ email, password })
      toast.success('Welcome back!')
      onLoginSuccess?.(data.user, data.token)
    } catch (err) {
      toast.error(err.message || 'Invalid email or password.')
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
