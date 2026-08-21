const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const AUTH_TOKEN_KEY = 'hrAuthToken'

export const getToken = () => localStorage.getItem(AUTH_TOKEN_KEY)

export const setToken = (token) => {
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export const clearToken = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY)
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

  if (!response.ok) {
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
    const query = new URLSearchParams(params).toString()
    return request(`/employees${query ? `?${query}` : ''}`)
  },
  stats: () => request('/employees/stats'),
  get: (id) => request(`/employees/${id}`),
  create: (payload) => request('/employees', { method: 'POST', body: payload }),
  update: (id, payload) => request(`/employees/${id}`, { method: 'PUT', body: payload }),
  remove: (id) => request(`/employees/${id}`, { method: 'DELETE' }),
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

export const api = {
  auth: authApi,
  employees: employeeApi,
  profile: profileApi,
}
