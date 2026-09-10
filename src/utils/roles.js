// Admin and HR both get "manager" (day-to-day HR-operations) access across
// the app — everything except assigning roles and deleting employee
// records, which stay Admin-only. Mirrors backend/utils/roles.js.
export const MANAGER_ROLES = ['Admin', 'HR']

export const isManagerRole = (user) => MANAGER_ROLES.includes(user?.role)

export const isAdminRole = (user) => user?.role === 'Admin'
