export const NOTIFICATION_TYPE_TONE = {
  Announcement: 'primary',
  Leave: 'blue',
  Birthday: 'amber',
  System: 'muted',
}

export const typeTone = (type) => NOTIFICATION_TYPE_TONE[type] || 'muted'

export const timeAgo = (value) => {
  const then = new Date(value).getTime()
  if (Number.isNaN(then)) return ''

  const seconds = Math.floor((Date.now() - then) / 1000)
  if (seconds < 60) return 'just now'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`

  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}
