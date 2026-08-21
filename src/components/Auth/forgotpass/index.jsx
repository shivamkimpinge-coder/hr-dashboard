import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import CommonForm from '../../../utils/Form/commonform'
import useApi from '../../../hooks/useApi'

const EMAIL_PATTERN = /\S+@\S+\.\S+/

function ForgetPass({ onBack }) {
  const [submitted, setSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const { forgotPassword, loading } = useApi()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: 'onTouched',
    defaultValues: { email: '' },
  })

  const onSubmit = async ({ email }) => {
    try {
      await forgotPassword({ email })
      toast.success('Reset link sent to your email.')
      setSubmittedEmail(email)
      setSubmitted(true)
    } catch (err) {
      toast.error(err.message || 'Failed to send reset link.')
    }
  }

  return (
    <div className="auth-page auth-page--dark">
      <div className="auth-card">
        <h1>Forgot Password?</h1>
        <p>Enter your email and we’ll send you a reset link.</p>

        {submitted ? (
          <div className="auth-success-box">
            <p>Reset link sent to {submittedEmail}</p>
            <button type="button" className="auth-secondary-btn" onClick={onBack}>
              Back to Sign In
            </button>
          </div>
        ) : (
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
            ]}
            onSubmit={handleSubmit(onSubmit)}
          >
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <button type="button" className="auth-text-btn" onClick={onBack}>
              Back to Sign In
            </button>
          </CommonForm>
        )}
      </div>
    </div>
  )
}

export default ForgetPass
