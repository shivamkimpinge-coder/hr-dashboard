import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useApi from '../../../hooks/useApi'
import { IconBell } from '../Sidebar/icons'
import { timeAgo, typeTone } from '../../../utils/Notifictions/notificationStore'

const POLL_MS = 60000

function NotificationBell() {
  const { listNotifications, markNotificationRead, markAllNotificationsRead } = useApi()
  const navigate = useNavigate()
  const wrapperRef = useRef(null)

  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const refresh = useCallback(async () => {
    try {
      const data = await listNotifications({ limit: 8 })
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch {

    }
  }, [listNotifications])

  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, POLL_MS)
    return () => clearInterval(timer)
  }, [refresh])

  useEffect(() => {
    if (!open) return undefined
    const onClickAway = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickAway)
    return () => document.removeEventListener('mousedown', onClickAway)
  }, [open])

  const openNotification = async (notification) => {
    setOpen(false)
    if (!notification.read) {
      setUnreadCount((count) => Math.max(0, count - 1))
      setNotifications((list) => list.map((n) => (n._id === notification._id ? { ...n, read: true } : n)))
      try {
        await markNotificationRead(notification._id)
      } catch {
        refresh()
      }
    }
    if (notification.link) navigate(notification.link)
  }

  const markAll = async () => {
    setUnreadCount(0)
    setNotifications((list) => list.map((n) => ({ ...n, read: true })))
    try {
      await markAllNotificationsRead()
    } catch {
      refresh()
    }
  }

  return (
    <div className="notif-bell" ref={wrapperRef}>
      <button
        type="button"
        className={`notif-bell-trigger${open ? ' is-open' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={open}
      >
        <IconBell />
        {unreadCount > 0 ? <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span> : null}
      </button>

      {open ? (
        <div className="notif-dropdown">
          <div className="notif-dropdown-head">
            <strong>Notifications</strong>
            {unreadCount > 0 ? (
              <button type="button" onClick={markAll}>
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <p className="notif-empty">You're all caught up.</p>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification._id}
                  type="button"
                  className={`notif-item${notification.read ? '' : ' is-unread'}`}
                  onClick={() => openNotification(notification)}
                >
                  <span className={`notif-type notif-type--${typeTone(notification.type)}`}>
                    {notification.type}
                  </span>
                  <span className="notif-item-body">
                    <strong>{notification.title}</strong>
                    {notification.message ? <small>{notification.message}</small> : null}
                    <time>{timeAgo(notification.createdAt)}</time>
                  </span>
                </button>
              ))
            )}
          </div>

          <button
            type="button"
            className="notif-viewall"
            onClick={() => {
              setOpen(false)
              navigate('/dashboard/notifications')
            }}
          >
            View all notifications
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default NotificationBell
