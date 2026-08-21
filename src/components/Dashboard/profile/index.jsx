import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Button from '../../../utils/Button/button'
import CommonForm from '../../../utils/Form/commonform'
import useApi from '../../../hooks/useApi'
import { getProfileImageUrl } from '../../../utils/api'

const EMAIL_PATTERN = /\S+@\S+\.\S+/
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Ccircle cx='40' cy='40' r='40' fill='%23cbd5e1'/%3E%3Ccircle cx='40' cy='32' r='14' fill='%23f1f5f9'/%3E%3Cpath d='M14 72c4-16 18-24 26-24s22 8 26 24' fill='%23f1f5f9'/%3E%3C/svg%3E"

function Profile({ currentUser, onProfileUpdate, onLogout }) {
  const { getProfile, updateProfile, uploadProfileImage, changePassword } = useApi()

  const [user, setUser] = useState(currentUser || null)
  const [loading, setLoading] = useState(true)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef(null)

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfileForm,
    formState: { errors: profileErrors, isSubmitting: savingProfile },
  } = useForm({
    mode: 'onTouched',
    defaultValues: { name: '', email: '' },
  })

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    watch: watchPassword,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors, isSubmitting: changingPassword },
  } = useForm({
    mode: 'onTouched',
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  useEffect(() => {
    let ignore = false

    const loadProfile = async () => {
      setLoading(true)
      try {
        const data = await getProfile()
        if (ignore) return
        setUser(data.user)
        resetProfileForm({ name: data.user.name || '', email: data.user.email || '' })
      } catch (error) {
        if (error.status === 401) {
          onLogout?.()
          return
        }
        toast.error(error.message)
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadProfile()
    return () => {
      ignore = true
    }
  }, [getProfile, onLogout, resetProfileForm])

  const onProfileSubmit = async (formData) => {
    try {
      const data = await updateProfile(formData)
      setUser(data.user)
      onProfileUpdate?.(data.user)
      toast.success('Profile updated successfully.')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Please select a valid image file (jpeg, png, gif, or webp).')
      event.target.value = ''
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('Image must be smaller than 5MB.')
      event.target.value = ''
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)

    try {
      setUploadingImage(true)
      const data = await uploadProfileImage(file)
      setUser((prev) => ({ ...prev, ...data.user }))
      onProfileUpdate?.(data.user)
      toast.success('Profile image updated successfully.')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setUploadingImage(false)
      URL.revokeObjectURL(previewUrl)
      setImagePreview(null)
      event.target.value = ''
    }
  }

  const onPasswordSubmit = async ({ currentPassword, newPassword }) => {
    try {
      await changePassword({ currentPassword, newPassword })
      resetPasswordForm()
      toast.success('Password changed successfully.')
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <div className="panel detail-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Profile</p>
          <h3>Account details</h3>
        </div>
      </div>

      {loading ? (
        <p>Loading profile...</p>
      ) : (
        <>
          <div className="overview-card">
            <h4>Welcome back, {user?.name}</h4>
          </div>

          <div className="detail-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img
              src={imagePreview || getProfileImageUrl(user?.profileImage) || DEFAULT_AVATAR}
              alt="Profile avatar"
              onError={(e) => {
                e.currentTarget.onerror = null
                e.currentTarget.src = DEFAULT_AVATAR
              }}
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1px solid var(--border-color, #ddd)',
              }}
            />
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageChange}
                disabled={uploadingImage}
                style={{ display: 'none' }}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
              >
                {uploadingImage ? 'Uploading...' : 'Change Photo'}
              </Button>
            </div>
          </div>

          <CommonForm
            formClassName="employee-form"
            layoutClassName="form-grid"
            register={registerProfile}
            errors={profileErrors}
            fields={[
              {
                name: 'name',
                label: 'Full Name',
                id: 'profile-name',
                rules: { required: 'Full name is required' },
              },
              {
                name: 'email',
                label: 'Email',
                id: 'profile-email',
                type: 'email',
                rules: {
                  required: 'Email is required',
                  pattern: { value: EMAIL_PATTERN, message: 'Please enter a valid email address' },
                },
              },
              {
                name: 'role',
                label: 'Role',
                id: 'profile-role',
                static: true,
                value: user?.role || 'User',
                disabled: true,
              },
            ]}
            onSubmit={handleProfileSubmit(onProfileSubmit)}
          >
            <div className="action-row">
              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CommonForm>

          <div className="detail-card mt-3">
            <p className="eyebrow">Change password</p>
            <CommonForm
              formClassName="employee-form"
              layoutClassName="form-grid"
              register={registerPassword}
              errors={passwordErrors}
              fields={[
                {
                  name: 'currentPassword',
                  label: 'Current Password',
                  id: 'current-password',
                  type: 'password',
                  rules: { required: 'Current password is required' },
                },
                {
                  name: 'newPassword',
                  label: 'New Password',
                  id: 'new-password',
                  type: 'password',
                  rules: {
                    required: 'New password is required',
                    minLength: { value: 6, message: 'New password must be at least 6 characters long.' },
                  },
                },
                {
                  name: 'confirmPassword',
                  label: 'Confirm New Password',
                  id: 'confirm-password',
                  type: 'password',
                  rules: {
                    required: 'Please confirm your new password',
                    validate: (value) =>
                      value === watchPassword('newPassword') || 'New password and confirmation do not match.',
                  },
                },
              ]}
              onSubmit={handlePasswordSubmit(onPasswordSubmit)}
            >
              <div className="action-row">
                <Button type="submit" disabled={changingPassword}>
                  {changingPassword ? 'Updating...' : 'Change Password'}
                </Button>
              </div>
            </CommonForm>
          </div>
        </>
      )}
    </div>
  )
}

export default Profile
