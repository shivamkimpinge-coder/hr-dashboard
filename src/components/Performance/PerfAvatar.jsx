const initials = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function PerfAvatar({ name, size = 'md' }) {
  const sizeClass = size === 'sm' ? ' perf-avatar--sm' : size === 'lg' ? ' perf-avatar--lg' : ''
  return (
    <span className={`perf-avatar${sizeClass}`} aria-hidden="true">
      {initials(name)}
    </span>
  )
}

export default PerfAvatar
