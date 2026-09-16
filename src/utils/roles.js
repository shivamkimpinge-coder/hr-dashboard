export const MANAGER_ROLES = ['Admin', 'HR']

export const isManagerRole = (user) => MANAGER_ROLES.includes(user?.role)

export const isAdminRole = (user) => user?.role === 'Admin'
