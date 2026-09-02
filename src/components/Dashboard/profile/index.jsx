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

const GENDER_OPTIONS = [
  { value: '', label: 'Prefer not to say' },
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

function DetailsTab({ user, updateProfile, onSaved }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onTouched',
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      gender: user?.gender || '',
      dob: toDateInputValue(user?.dob),
    },
  })

  const onSubmit = async (formData) => {
    try {
      const data = await updateProfile(formData)
      toast.success('Profile updated successfully.')
      onSaved(data.user)
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <CommonForm
      formClassName="employee-form"
      layoutClassName="form-grid"
      register={register}
      errors={errors}
      fields={[
        {
          name: 'name',
          label: 'Full Name',
          id: 'edit-profile-name',
          rules: { required: 'Full name is required' },
        },
        {
          name: 'email',
          label: 'Email',
          id: 'edit-profile-email',
          type: 'email',
          rules: {
            required: 'Email is required',
            pattern: { value: EMAIL_PATTERN, message: 'Please enter a valid email address' },
          },
        },
        {
          name: 'phone',
          label: 'Phone Number',
          id: 'edit-profile-phone',
          type: 'tel',
          rules: {
            pattern: { value: /^[0-9+\-\s()]{7,20}$/, message: 'Please enter a valid phone number' },
          },
        },
        {
          name: 'gender',
          label: 'Gender',
          id: 'edit-profile-gender',
          type: 'select',
          options: GENDER_OPTIONS,
        },
        {
          name: 'dob',
          label: 'Date of Birth',
          id: 'edit-profile-dob',
          type: 'date',
        },
      ]}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="action-row">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </CommonForm>
  )
}

function PasswordTab({ changePassword, onDone }) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onTouched',
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const onSubmit = async ({ currentPassword, newPassword }) => {
    try {
      await changePassword({ currentPassword, newPassword })
      reset()
      toast.success('Password changed successfully.')
      onDone?.()
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
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
  )
}

function ProfileEditModal({ user, updateProfile, changePassword, onClose, onSaved }) {
  const [activeTab, setActiveTab] = useState('details') // 'details' | 'password'

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Profile</p>
            <h3>Update Profile</h3>
          </div>
          <Button variant="close" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>

        <div className="range-toggle">
          <button type="button" className={activeTab === 'details' ? 'is-active' : ''} onClick={() => setActiveTab('details')}>
            Profile Details
          </button>
          <button type="button" className={activeTab === 'password' ? 'is-active' : ''} onClick={() => setActiveTab('password')}>
            Change Password
          </button>
        </div>

        {activeTab === 'details' ? (
          <DetailsTab user={user} updateProfile={updateProfile} onSaved={onSaved} />
        ) : (
          <PasswordTab changePassword={changePassword} onDone={onClose} />
        )}
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
  const [editOpen, setEditOpen] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    let ignore = false

    const loadProfile = async () => {
      setLoading(true)
      try {
        const data = await getProfile()
        if (ignore) return
        setUser(data.user)
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
  }, [getProfile, onLogout])

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

  return (
    <div className="panel detail-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Profile</p>
          <h3>Account details</h3>
        </div>
        <Button onClick={() => setEditOpen(true)}>Update Profile</Button>
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

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="profile-name">Full Name</label>
              <input id="profile-name" type="text" value={user?.name || ''} readOnly />
            </div>
            <div className="form-field">
              <label htmlFor="profile-email">Email</label>
              <input id="profile-email" type="email" value={user?.email || ''} readOnly />
            </div>
            <div className="form-field">
              <label htmlFor="profile-phone">Phone Number</label>
              <input id="profile-phone" type="text" value={user?.phone || '—'} readOnly />
            </div>
            <div className="form-field">
              <label htmlFor="profile-gender">Gender</label>
              <input id="profile-gender" type="text" value={user?.gender || '—'} readOnly />
            </div>
            <div className="form-field">
              <label htmlFor="profile-dob">Date of Birth</label>
              <input
                id="profile-dob"
                type="text"
                value={user?.dob ? new Date(user.dob).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                readOnly
              />
            </div>
            <div className="form-field">
              <label htmlFor="profile-role">Role</label>
              <input id="profile-role" type="text" value={user?.role || 'User'} readOnly disabled />
            </div>
          </div>
        </>
      )}

      {editOpen ? (
        <ProfileEditModal
          user={user}
          updateProfile={updateProfile}
          changePassword={changePassword}
          onClose={() => setEditOpen(false)}
          onSaved={(updatedUser) => {
            setUser(updatedUser)
            onProfileUpdate?.(updatedUser)
            setEditOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}

export default Profile
