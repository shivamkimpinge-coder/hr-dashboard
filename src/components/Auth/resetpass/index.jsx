import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import CommonForm from '../../../utils/Form/commonform'
import useApi from '../../../hooks/useApi'

function ResetPass({ onBack }) {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [submitted, setSubmitted] = useState(false)
  const { resetPassword, loading } = useApi()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    mode: 'onTouched',
    defaultValues: { password: '', confirmPassword: '' },
  })

  const onSubmit = async ({ password }) => {
    if (!token) {
      toast.error('Reset link is invalid or missing a token.')
      return
    }

    try {
      await resetPassword(token, { password })
      toast.success('Password reset successfully!')
      setSubmitted(true)
    } catch (err) {
      toast.error(err.message || 'Failed to reset password.')
    }
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
          <CommonForm
            formClassName="auth-form"
            fieldClassName="auth-field"
            register={register}
            errors={errors}
            fields={[
              {
                name: 'password',
                label: 'New Password',
                type: 'password',
                placeholder: 'Enter new password',
                className: 'auth-input',
                rules: {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters.' },
                },
              },
              {
                name: 'confirmPassword',
                label: 'Confirm Password',
                type: 'password',
                placeholder: 'Confirm new password',
                className: 'auth-input',
                rules: {
                  required: 'Please confirm your password',
                  validate: (value) => value === watch('password') || 'Passwords do not match.',
                },
              },
            ]}
            onSubmit={handleSubmit(onSubmit)}
          >
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
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

export default ResetPass
