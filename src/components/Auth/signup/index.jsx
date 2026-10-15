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
    defaultValues: { name: '', email: '', password: '', companyCode: '' },
  })

  // Only these four fields are ever sent — no companyId, no role, no status.
  // The backend looks up the company from companyCode and always forces
  // role: "Employee", status: "Pending" itself; nothing here can change that.
  const onSubmit = async ({ name, email, password, companyCode }) => {
    try {
      const data = await registerUser({ name, email, password, companyCode })
      onSignupSuccess?.(data?.message)
    } catch (err) {
      toast.error(err.message || 'Registration failed.')
    }
  }

  return (
    <div className="auth-page auth-page--dark">
      <div className="auth-card">
        <p className="eyebrow">HR Office</p>
        <h1>Create Your Account</h1>
        <p>Join your company&apos;s workspace.</p>

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
              label: 'Email Address',
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
              showToggle: true,
              placeholder: 'Create a password',
              className: 'auth-input',
              rules: {
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters long.' },
              },
            },
            {
              name: 'companyCode',
              label: 'Company Code',
              type: 'text',
              placeholder: 'e.g. A1B2C3',
              className: 'auth-input',
              rules: { required: 'Company code is required' },
            },
          ]}
          onSubmit={handleSubmit(onSubmit)}
        >
          <p className="form-hint">Please enter the company code provided by your company Admin or HR.</p>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Submitting...' : 'Request to Join'}
          </button>
        </CommonForm>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Signup
