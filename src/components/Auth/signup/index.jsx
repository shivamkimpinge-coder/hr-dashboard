import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import CommonForm from '../../../utils/Form/commonform'
import useApi from '../../../hooks/useApi'

const EMAIL_PATTERN = /\S+@\S+\.\S+/

function Signup({ onSignupSuccess }) {
  const { register: registerUser, loading } = useApi()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: 'onTouched',
    defaultValues: { name: '', email: '', password: '' },
  })

  const onSubmit = async ({ name, email, password }) => {
    try {
      await registerUser({ name, email, password })
      onSignupSuccess?.()
    } catch (err) {
      toast.error(err.message || 'Registration failed.')
    }
  }

  return (
    <div className="auth-page auth-page--dark">
      <div className="auth-card">
        <h1>Create Account</h1>
        <p>Join HR Hub and manage your team.</p>

        <CommonForm
          formClassName="auth-form"
          fieldClassName="auth-field"
          register={register}
          errors={errors}
          fields={[
            {
              name: 'name',
              label: 'Full Name',
              type: 'text',
              placeholder: 'Your name',
              className: 'auth-input',
              rules: { required: 'Full name is required' },
            },
            {
              name: 'email',
              label: 'Email',
              type: 'email',
              placeholder: 'you@company.com',
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
              placeholder: 'Create a password',
              className: 'auth-input',
              rules: {
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters long.' },
              },
            },
          ]}
          onSubmit={handleSubmit(onSubmit)}
        >
          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </CommonForm>

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
