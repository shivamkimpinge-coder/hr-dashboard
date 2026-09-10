import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Button from '../../utils/Button/button'
import useApi from '../../hooks/useApi'
import { isManagerRole } from '../../utils/roles'
import useEmployeeDirectory from '../Performance/useEmployeeDirectory'
import { timeAgo, typeTone } from './notificationStore'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'Announcement', label: 'Announcements' },
  { key: 'Leave', label: 'Leave' },
  { key: 'Birthday', label: 'Birthdays' },
]

function SendNotificationModal({ open, onClose, onSent, employees }) {
  const { sendNotification } = useApi()

  const [audience, setAudience] = useState('all')
  const [employeeId, setEmployeeId] = useState('')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!open) return null

  const submit = async (event) => {
    event.preventDefault()
    if (!title.trim()) {
      toast.error('Title is required.')
      return
    }
    if (audience === 'employee' && !employeeId) {
      toast.error('Please select an employee.')
      return
    }

    setSubmitting(true)
    try {
      const result = await sendNotification({
        audience,
        employeeId: audience === 'employee' ? employeeId : undefined,
        title,
        message,
      })
      toast.success(result.message || 'Notification sent')
      setTitle('')
      setMessage('')
      setEmployeeId('')
      onSent?.()
      onClose()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Notifications</p>
            <h3>Send Notification</h3>
          </div>
          <Button variant="close" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>

        <form className="employee-form" onSubmit={submit}>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="notif-audience">Send to</label>
              <select id="notif-audience" value={audience} onChange={(e) => setAudience(e.target.value)}>
                <option value="all">Everyone (announcement)</option>
                <option value="employee">A specific employee</option>
              </select>
            </div>

            {audience === 'employee' ? (
              <div className="form-field">
                <label htmlFor="notif-employee">Employee</label>
                <select id="notif-employee" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                  <option value="">Select an employee</option>
                  {employees.map((employee) => (
                    <option key={employee.employeeId} value={employee.employeeId}>
                      {employee.name} ({employee.employeeId})
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="form-field form-field-full">
              <label htmlFor="notif-title">Title</label>
              <input
                id="notif-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Office closed on Friday"
              />
            </div>

            <div className="form-field form-field-full">
              <label htmlFor="notif-message">Message</label>
              <textarea
                id="notif-message"
                rows="3"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add more detail (optional)"
              />
            </div>
          </div>

          <div className="action-row">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Notifications({ currentUser }) {
  const { listNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification } = useApi()
  const navigate = useNavigate()
  const isManager = isManagerRole(currentUser)
  const { employees } = useEmployeeDirectory(currentUser)

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { limit: 100 }
      if (filter === 'unread') params.unread = true
      else if (filter !== 'all') params.type = filter

      const data = await listNotifications(params)
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [listNotifications, filter])

  useEffect(() => {
    refresh()
  }, [refresh])

  const openNotification = async (notification) => {
    if (!notification.read) {
      try {
        await markNotificationRead(notification._id)
      } catch {
        // fall through — navigation still makes sense
      }
    }
    if (notification.link) navigate(notification.link)
    else refresh()
  }

  const markAll = async () => {
    try {
      await markAllNotificationsRead()
      toast.success('All notifications marked as read')
      refresh()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const remove = async (event, id) => {
    event.stopPropagation()
    try {
      await deleteNotification(id)
      refresh()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="panel detail-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Notifications</p>
          <h3>{unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}</h3>
        </div>
        <div className="action-row">
          {unreadCount > 0 ? (
            <Button variant="secondary" onClick={markAll}>
              Mark all read
            </Button>
          ) : null}
          {isManager ? <Button onClick={() => setSending(true)}>+ Send Notification</Button> : null}
        </div>
      </div>

      {error ? <div className="feedback-banner feedback-banner-error">{error}</div> : null}

      <div className="range-toggle notif-filters">
        {FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={filter === item.key ? 'is-active' : ''}
            onClick={() => setFilter(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="notif-page-list">
        {loading ? (
          <p className="form-hint">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <p>No notifications here yet.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              className={`notif-row${notification.read ? '' : ' is-unread'}`}
              role="button"
              tabIndex={0}
              onClick={() => openNotification(notification)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') openNotification(notification)
              }}
            >
              <span className={`notif-type notif-type--${typeTone(notification.type)}`}>
                {notification.type}
              </span>

              <div className="notif-row-body">
                <strong>{notification.title}</strong>
                {notification.message ? <p>{notification.message}</p> : null}
                <small>
                  {timeAgo(notification.createdAt)}
                  {notification.senderName && notification.senderName !== 'System'
                    ? ` · from ${notification.senderName}`
                    : ''}
                </small>
              </div>

              <button
                type="button"
                className="notif-remove"
                onClick={(event) => remove(event, notification._id)}
                aria-label="Delete notification"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      <SendNotificationModal
        open={sending}
        onClose={() => setSending(false)}
        onSent={refresh}
        employees={employees}
      />
    </div>
  )
}

export default Notifications
