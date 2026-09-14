// Shared tab list for every Performance Management sub-page — kept in one
// place so the tab row stays identical no matter which sub-route is active.
export const PERFORMANCE_TABS = [
  { label: 'Goals', to: '/dashboard/performance', end: true },
  { label: 'Reviews', to: '/dashboard/performance/reviews' },
]
