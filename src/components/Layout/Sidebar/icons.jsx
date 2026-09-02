function base(props) {
  return {
    width: 20,
    height: 20,
    viewBox: '0 0 20 20',
    fill: 'none',
    'aria-hidden': true,
    ...props,
  }
}

export function IconGrid(props) {
  return (
    <svg {...base(props)}>
      <rect x="2.75" y="2.75" width="6" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11.25" y="2.75" width="6" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2.75" y="11.25" width="6" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11.25" y="11.25" width="6" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function IconUsers(props) {
  return (
    <svg {...base(props)}>
      <circle cx="7.3" cy="6.8" r="2.55" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.6 16c.5-2.9 2.4-4.5 4.7-4.5s4.2 1.6 4.7 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12.6 4.7c1.2.2 2.1 1.3 2.1 2.6 0 1.2-.8 2.3-1.9 2.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13.6 11.7c1.9.5 3.2 1.9 3.6 4.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function IconUserPlus(props) {
  return (
    <svg {...base(props)}>
      <circle cx="7.6" cy="6.8" r="2.55" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.6 16c.5-2.9 2.4-4.5 5-4.5.63 0 1.2.09 1.72.26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15.4 8v5.2M12.8 10.6h5.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function IconClock(props) {
  return (
    <svg {...base(props)}>
      <circle cx="10" cy="10" r="7.1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 6v4.2l2.8 1.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconKanban(props) {
  return (
    <svg {...base(props)}>
      <rect x="2.75" y="3.25" width="14.5" height="13.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 6v8M13 6v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function IconWallet(props) {
  return (
    <svg {...base(props)}>
      <rect x="2.5" y="5" width="15" height="11" rx="2.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.5 8.3h15" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="13.6" cy="12" r="1.1" fill="currentColor" />
    </svg>
  )
}

export function IconCalendar(props) {
  return (
    <svg {...base(props)}>
      <rect x="2.75" y="3.9" width="14.5" height="13.1" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.75 7.6h14.5M6.3 2.5v2.6M13.7 2.5v2.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function IconUser(props) {
  return (
    <svg {...base(props)}>
      <circle cx="10" cy="6.8" r="3.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.6 17c.7-3.6 3-5.6 6.4-5.6s5.7 2 6.4 5.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function IconUserCheck(props) {
  return (
    <svg {...base(props)}>
      <circle cx="7.6" cy="6.8" r="2.55" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.6 16c.5-2.9 2.4-4.5 5-4.5.63 0 1.2.09 1.72.26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12.8 10.9l1.6 1.6 3-3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconUserOff(props) {
  return (
    <svg {...base(props)}>
      <circle cx="7.6" cy="6.8" r="2.55" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.6 16c.5-2.9 2.4-4.5 5-4.5.63 0 1.2.09 1.72.26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12.6 8.9l4.2 4.2M16.8 8.9l-4.2 4.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function IconSettings(props) {
  return (
    <svg {...base(props)}>
      <circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 3.2v1.7M10 15.1v1.7M16.8 10h-1.7M4.9 10H3.2M14.9 5.1l-1.2 1.2M6.3 13.7l-1.2 1.2M14.9 14.9l-1.2-1.2M6.3 6.3 5.1 5.1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconChevronDown(props) {
  return (
    <svg {...base(props)} width={16} height={16} viewBox="0 0 16 16">
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconLogout(props) {
  return (
    <svg {...base(props)}>
      <path d="M8.2 3.2H4.8a1.6 1.6 0 0 0-1.6 1.6v10.4a1.6 1.6 0 0 0 1.6 1.6h3.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.4 13.4l3.4-3.4-3.4-3.4M15.5 10H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconTrendingUp(props) {
  return (
    <svg {...base(props)}>
      <path d="M2.75 13.5l4.4-4.6 3 3 5.6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.2 5.9h3.55v3.55" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconTarget(props) {
  return (
    <svg {...base(props)}>
      <circle cx="10" cy="10" r="7.1" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="0.9" fill="currentColor" />
    </svg>
  )
}

export function IconAlertTriangle(props) {
  return (
    <svg {...base(props)}>
      <path
        d="M10 3.4l7.4 12.8c.3.55-.08 1.25-.72 1.25H3.32c-.64 0-1.02-.7-.72-1.25L10 3.4z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M10 8.2v3.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="14.2" r="0.9" fill="currentColor" />
    </svg>
  )
}

export function IconArrowUpRight(props) {
  return (
    <svg {...base(props)}>
      <path d="M5.5 14.5l9-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 5.3h6.7V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconSparkle(props) {
  return (
    <svg {...base(props)}>
      <path
        d="M10 2.6l1.55 4.5 4.5 1.55-4.5 1.55-1.55 4.5-1.55-4.5-4.5-1.55 4.5-1.55L10 2.6z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}
