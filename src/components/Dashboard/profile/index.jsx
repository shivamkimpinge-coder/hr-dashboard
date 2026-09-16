import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Button from '../../../utils/Button/button'
import CommonForm from '../../../utils/Form/commonform'
import useApi from '../../../hooks/useApi'
import { getProfileImageUrl } from '../../../hooks/api'
import { isValidPhoneNumber } from 'react-phone-number-input'

const EMAIL_PATTERN = /\S+@\S+\.\S+/
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Ccircle cx='40' cy='40' r='40' fill='%23cbd5e1'/%3E%3Ccircle cx='40' cy='32' r='14' fill='%23f1f5f9'/%3E%3Cpath d='M14 72c4-16 18-24 26-24s22 8 26 24' fill='%23f1f5f9'/%3E%3C/svg%3E"

const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
]

const toDateInputValue = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function ChangePasswordModal({ changePassword, onClose }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onTouched',
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const onSubmit = async ({ currentPassword, newPassword }) => {
    try {
      await changePassword({ currentPassword, newPassword })
      toast.success('Password changed successfully.')
      onClose()
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Profile</p>
            <h3>Change Password</h3>
          </div>
          <Button variant="close" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>

        <CommonForm
          formClassName="employee-form"
          layoutClassName="form-grid"
          register={register}
          errors={errors}
          fields={[
            {
              name: 'currentPassword',
              label: 'Current Password',
              id: 'edit-current-password',
              type: 'password',
              rules: { required: 'Current password is required' },
            },
            {
              name: 'newPassword',
              label: 'New Password',
              id: 'edit-new-password',
              type: 'password',
              rules: {
                required: 'New password is required',
                minLength: { value: 6, message: 'New password must be at least 6 characters long.' },
              },
            },
            {
              name: 'confirmPassword',
              label: 'Confirm New Password',
              id: 'edit-confirm-password',
              type: 'password',
              rules: {
                required: 'Please confirm your new password',
                validate: (value) => value === watch('newPassword') || 'New password and confirmation do not match.',
              },
            },
          ]}
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="action-row">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Change Password'}
            </Button>
          </div>
        </CommonForm>
      </div>
    </div>
  )
}

function Profile({ currentUser, onProfileUpdate, onLogout }) {
  const { getProfile, updateProfile, uploadProfileImage, changePassword } = useApi()

  const [user, setUser] = useState(currentUser || null)
  const [loading, setLoading] = useState(true)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const fileInputRef = useRef(null)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onTouched',
    defaultValues: { name: '', email: '', phone: '', gender: '', dob: '' },
  })

  useEffect(() => {
    let ignore = false

    const loadProfile = async () => {
      setLoading(true)
      try {
        const data = await getProfile()
        if (ignore) return
        setUser(data.user)
        reset({
          name: data.user.name || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
          gender: data.user.gender || '',
          dob: toDateInputValue(data.user.dob),
        })
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
  }, [getProfile, onLogout, reset])

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

  const rolePillClass =
    user?.role === 'Admin' ? 'pill-danger' : user?.role === 'HR' ? 'pill-warning' : 'pill-muted'
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : null

  return (
    <div className="panel detail-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Profile</p>
          <h3>Account settings</h3>
        </div>
      </div>

      {loading ? (
        <p>Loading profile...</p>
      ) : (
        <div className="profile-layout">
          <aside className="profile-summary">
            <div className="profile-avatar-wrap">
              <img
                className="profile-avatar-img"
                src={imagePreview || getProfileImageUrl(user?.profileImage) || DEFAULT_AVATAR}
                alt="Profile avatar"
                onError={(e) => {
                  e.currentTarget.onerror = null
                  e.currentTarget.src = DEFAULT_AVATAR
                }}
              />
              <button
                type="button"
                className="profile-avatar-edit"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                aria-label="Change photo"
                title="Change photo"
              >
                {uploadingImage ? '...' : '✎'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageChange}
                disabled={uploadingImage}
                style={{ display: 'none' }}
              />
            </div>

            <h4 className="profile-summary-name">{user?.name}</h4>
            <p className="profile-summary-email">{user?.email}</p>
            <span className={`pill ${rolePillClass}`}>{user?.role || 'User'}</span>
            {memberSince ? <p className="profile-summary-since">Member since {memberSince}</p> : null}

            <Button
              type="button"
              variant="secondary"
              className="profile-summary-action"
              onClick={() => setPasswordModalOpen(true)}
            >
              Change Password
            </Button>
          </aside>

          <div className="profile-form-col">
            <CommonForm
              formClassName="employee-form"
              layoutClassName="form-grid"
              register={register}
              control={control}
              errors={errors}
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
                  name: 'phone',
                  label: 'Phone Number',
                  id: 'profile-phone',
                  type: 'phone',
                  rules: {
                    validate: (value) =>
                      value ? isValidPhoneNumber(value) || 'Please enter a valid phone number' : true,
                  },
                },
                {
                  name: 'gender',
                  label: 'Gender',
                  id: 'profile-gender',
                  type: 'select',
                  options: GENDER_OPTIONS,
                },
                {
                  name: 'dob',
                  label: 'Date of Birth',
                  id: 'profile-dob',
                  type: 'date',
                },
              ]}
              onSubmit={handleSubmit(onProfileSubmit)}
            >
              <div className="action-row">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CommonForm>
          </div>
        </div>
      )}

      {passwordModalOpen ? (
        <ChangePasswordModal changePassword={changePassword} onClose={() => setPasswordModalOpen(false)} />
      ) : null}
    </div>
  )
}

export default Profile
