const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const AUTH_TOKEN_KEY = 'Token'

export const getToken = () => localStorage.getItem(AUTH_TOKEN_KEY)

export const setToken = (token) => {
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export const clearToken = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

const buildQuery = (params = {}) => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, value)
  })
  return query.toString()
}

const SESSION_ENDED_KEY = 'hrSessionEndedMessage'

// A 403 that names an account status came from the auth layer rejecting the
// account itself, not from an ordinary permission check, so the stored token is
// now worthless and the session has to end.
const handleDeadSession = (status, data) => {
  const accountRejected = status === 403 && Boolean(data?.status)
  if (status !== 401 && !accountRejected) return
  if (!getToken()) return

  clearToken()
  localStorage.removeItem('hrCurrentUser')
  try {
    localStorage.setItem(
      SESSION_ENDED_KEY,
      data?.message || 'Your session has ended. Please sign in again.'
    )
  } catch {
    // storage is best-effort here; the redirect still signs the user out
  }
  if (window.location.pathname !== '/') window.location.replace('/')
}

export const takeSessionEndedMessage = () => {
  try {
    const message = localStorage.getItem(SESSION_ENDED_KEY)
    if (message) localStorage.removeItem(SESSION_ENDED_KEY)
    return message
  } catch {
    return null
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('Unable to reach the server. Please make sure the backend is running.')
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    handleDeadSession(response.status, data)
    const error = new Error(data.message || 'Something went wrong. Please try again.')
    error.status = response.status
    throw error
  }

  return data
}

async function requestWithFile(path, formData) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PUT',
      headers,
      body: formData,
    })
  } catch {
    throw new Error('Unable to reach the server. Please make sure the backend is running.')
  }

  const data = await response.json().catch(() => ({}))
  console.log('requestWithFile response:', response)

  if (!response.ok) {
    handleDeadSession(response.status, data)
    const error = new Error(data.message || 'Something went wrong. Please try again.')
    error.status = response.status
    throw error
  }

  return data
}

export const getProfileImageUrl = (filename) =>
  filename ? `${API_BASE_URL.replace(/\/api\/?$/, '')}/uploads/${filename}` : null

export const authApi = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  forgotPassword: (payload) => request('/auth/forgot', { method: 'POST', body: payload }),
  resetPassword: (token, payload) => request(`/auth/reset/${token}`, { method: 'POST', body: payload }),
  me: () => request('/auth/me'),
}

export const employeeApi = {
  list: (params = {}) => {
    const query = buildQuery(params)
    return request(`/employees${query ? `?${query}` : ''}`)
  },
  directory: () => request('/employees/directory'),
  stats: () => request('/employees/stats'),
  get: (id) => request(`/employees/${id}`),
  create: (payload) => request('/employees', { method: 'POST', body: payload }),
  update: (id, payload) => request(`/employees/${id}`, { method: 'PUT', body: payload }),
  remove: (id) => request(`/employees/${id}`, { method: 'DELETE' }),
}

export const approvalApi = {
  pending: () => request('/approvals/pending'),
  approve: (id, payload = {}) => request(`/approvals/${id}/approve`, { method: 'PATCH', body: payload }),
  reject: (id, payload = {}) => request(`/approvals/${id}/reject`, { method: 'PATCH', body: payload }),
}

export const profileApi = {
  get: () => request('/profile'),
  update: (payload) => request('/profile', { method: 'PUT', body: payload }),
  changePassword: (payload) => request('/profile/password', { method: 'PUT', body: payload }),
  uploadImage: (file) => {
    const formData = new FormData()
    formData.append('profileImage', file)
    return requestWithFile('/profile/image', formData)
  },
}
export const payrollApi = {
  list: (params = {}) => {
    const query = buildQuery(params)
    return request(`/payroll${query ? `?${query}` : ''}`)
  },
  my: () => request('/payroll/my'),
  getStructure: (employeeId) => request(`/payroll/structure/${employeeId}`),
  saveStructure: (employeeId, payload) =>
    request(`/payroll/structure/${employeeId}`, { method: 'PUT', body: payload }),
  generate: (payload) => request('/payroll/generate', { method: 'POST', body: payload }),
  getPayslip: (id) => request(`/payroll/${id}`),
}

export const leaveApi = {
  apply: (payload) => request('/leaves', { method: 'POST', body: payload }),
  list: (params = {}) => {
    const query = buildQuery(params)
    return request(`/leaves${query ? `?${query}` : ''}`)
  },
  my: () => request('/leaves/my'),
  get: (id) => request(`/leaves/${id}`),
  approve: (id) => request(`/leaves/${id}/approve`, { method: 'PATCH' }),
  reject: (id) => request(`/leaves/${id}/reject`, { method: 'PATCH' }),
  cancel: (id) => request(`/leaves/${id}/cancel`, { method: 'PATCH' }),
}

export const attendanceApi = {
  checkIn: () => request('/attendance/check-in', { method: 'POST' }),
  checkOut: () => request('/attendance/check-out', { method: 'POST' }),
  my: (params = {}) => {
    const query = buildQuery(params)
    return request(`/attendance/my${query ? `?${query}` : ''}`)
  },
  list: (params = {}) => {
    const query = buildQuery(params)
    return request(`/attendance${query ? `?${query}` : ''}`)
  },
  mark: (payload) => request('/attendance/mark', { method: 'POST', body: payload }),
}

export const taskApi = {
  list: (params = {}) => {
    const query = buildQuery(params)
    return request(`/tasks${query ? `?${query}` : ''}`)
  },
  my: () => request('/tasks/my'),
  create: (payload) => request('/tasks', { method: 'POST', body: payload }),
  update: (id, payload) => request(`/tasks/${id}`, { method: 'PUT', body: payload }),
  remove: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
  addComment: (id, payload) => request(`/tasks/${id}/comments`, { method: 'POST', body: payload }),
}

export const goalApi = {
  list: (params = {}) => {
    const query = buildQuery(params)
    return request(`/goals${query ? `?${query}` : ''}`)
  },
  my: () => request('/goals/my'),
  create: (payload) => request('/goals', { method: 'POST', body: payload }),
  update: (id, payload) => request(`/goals/${id}`, { method: 'PUT', body: payload }),
  remove: (id) => request(`/goals/${id}`, { method: 'DELETE' }),
}

export const performanceReviewApi = {
  list: (params = {}) => {
    const query = buildQuery(params)
    return request(`/performance-reviews${query ? `?${query}` : ''}`)
  },
  my: () => request('/performance-reviews/my'),
  create: (payload) => request('/performance-reviews', { method: 'POST', body: payload }),
  update: (id, payload) => request(`/performance-reviews/${id}`, { method: 'PUT', body: payload }),
  acknowledge: (id) => request(`/performance-reviews/${id}/acknowledge`, { method: 'PATCH' }),
  remove: (id) => request(`/performance-reviews/${id}`, { method: 'DELETE' }),
}

export const notificationApi = {
  list: (params = {}) => {
    const query = buildQuery(params)
    return request(`/notifications${query ? `?${query}` : ''}`)
  },
  markRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => request('/notifications/read-all', { method: 'PATCH' }),
  send: (payload) => request('/notifications', { method: 'POST', body: payload }),
  remove: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),
}

export const api = {
  auth: authApi,
  employees: employeeApi,
  profile: profileApi,
  payroll: payrollApi,
  leaves: leaveApi,
  attendance: attendanceApi,
  tasks: taskApi,
  goals: goalApi,
  performanceReviews: performanceReviewApi,
  notifications: notificationApi,
  approvals: approvalApi,
}
