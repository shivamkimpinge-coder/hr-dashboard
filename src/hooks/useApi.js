import { useCallback, useState } from 'react'

// ============================================================
// CONFIGURATION
// ============================================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const AUTH_TOKEN_KEY = 'Token'
const CURRENT_USER_KEY = 'hrCurrentUser'
const SESSION_ENDED_KEY = 'hrSessionEndedMessage'
const IMPERSONATOR_SESSION_KEY = 'hrImpersonatorSession'

// ============================================================
// SESSION / TOKEN FUNCTIONS
// ============================================================

// Get JWT token from localStorage
export const getToken = () => {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

// Save JWT token
export const setToken = (token) => {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
  }
}

// Remove JWT token
export const clearToken = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

// Remove complete login session
export const clearSession = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(CURRENT_USER_KEY)
  // A stale impersonation stash must never survive a normal logout — left
  // behind, it would hand the SuperAdmin's session to whoever next logs
  // into this browser (or just reopens the dashboard) and clicks "Return to
  // Super Admin".
  localStorage.removeItem(IMPERSONATOR_SESSION_KEY)
}

// Save user + token after successful login
export const saveSession = (user, token) => {
  setToken(token)

  localStorage.setItem(
    CURRENT_USER_KEY,
    JSON.stringify(user)
  )
}

// Save only user information
export const saveStoredUser = (user) => {
  localStorage.setItem(
    CURRENT_USER_KEY,
    JSON.stringify(user)
  )
}

// Get currently stored user
export const getStoredUser = () => {
  // User without token is not considered logged in
  if (!getToken()) {
    localStorage.removeItem(CURRENT_USER_KEY)
    return null
  }

  try {
    return JSON.parse(
      localStorage.getItem(CURRENT_USER_KEY) || 'null'
    )
  } catch {
    localStorage.removeItem(CURRENT_USER_KEY)
    return null
  }
}

// ============================================================
// SESSION EXPIRED / DEACTIVATED ACCOUNT
// ============================================================

const handleDeadSession = (status, data) => {
  // 401 = unauthorised
  // 403 + status = account was rejected/deactivated/etc.
  const accountRejected =
    status === 403 && Boolean(data?.status)

  if (status !== 401 && !accountRejected) {
    return
  }

  if (!getToken()) {
    return
  }

  clearSession()

  try {
    localStorage.setItem(
      SESSION_ENDED_KEY,
      data?.message ||
        'Your session has ended. Please sign in again.'
    )
  } catch {
    // Storage failure should not stop logout
  }

  // Send user to login page
  if (window.location.pathname !== '/') {
    window.location.replace('/')
  }
}

// Get session-ended message
export const takeSessionEndedMessage = () => {
  try {
    const message =
      localStorage.getItem(SESSION_ENDED_KEY)

    if (message) {
      localStorage.removeItem(SESSION_ENDED_KEY)
    }

    return message
  } catch {
    return null
  }
}

// ============================================================
// QUERY BUILDER
// ============================================================

const buildQuery = (params = {}) => {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      query.set(key, value)
    }
  })

  return query.toString()
}

// ============================================================
// MAIN REQUEST FUNCTION
// ============================================================

async function request(
  path,
  {
    method = 'GET',
    body,
  } = {}
) {
  const headers = {
    'Content-Type': 'application/json',
  }

  // Add JWT token if user is logged in
  const token = getToken()

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response

  try {
    response = await fetch(
      `${API_BASE_URL}${path}`,
      {
        method,
        headers,
        body:
          body !== undefined
            ? JSON.stringify(body)
            : undefined,
      }
    )
  } catch {
    throw new Error(
      'Unable to reach the server. Please make sure the backend is running.'
    )
  }

  // Convert response to JSON
  const data = await response
    .json()
    .catch(() => ({}))

  // Handle errors
  if (!response.ok) {
    handleDeadSession(
      response.status,
      data
    )

    const error = new Error(
      data.message ||
        'Something went wrong. Please try again.'
    )

    error.status = response.status

    throw error
  }

  return data
}

// ============================================================
// FILE UPLOAD REQUEST
// ============================================================

async function requestWithFile(
  path,
  formData
) {
  const headers = {}

  const token = getToken()

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response

  try {
    response = await fetch(
      `${API_BASE_URL}${path}`,
      {
        method: 'PUT',
        headers,
        body: formData,
      }
    )
  } catch {
    throw new Error(
      'Unable to reach the server. Please make sure the backend is running.'
    )
  }

  const data = await response
    .json()
    .catch(() => ({}))

  if (!response.ok) {
    handleDeadSession(
      response.status,
      data
    )

    const error = new Error(
      data.message ||
        'Something went wrong. Please try again.'
    )

    error.status = response.status

    throw error
  }

  return data
}

// ============================================================
// PROFILE IMAGE URL
// ============================================================

export const getProfileImageUrl = (
  filename
) => {
  if (!filename) {
    return null
  }

  return `${API_BASE_URL.replace(
    /\/api\/?$/,
    ''
  )}/uploads/${filename}`
}

// ============================================================
// CUSTOM HOOK
// ============================================================

export default function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ----------------------------------------------------------
  // COMMON API RUNNER
  // ----------------------------------------------------------

  const run = useCallback(
    async (apiCall) => {
      setLoading(true)
      setError('')

      try {
        return await apiCall()
      } catch (err) {
        setError(
          err.message ||
            'Something went wrong. Please try again.'
        )

        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // ==========================================================
  // AUTH
  // ==========================================================

  const register = useCallback(
    (payload) =>
      run(() =>
        request('/auth/register', {
          method: 'POST',
          body: payload,
        })
      ),
    [run]
  )

  const login = useCallback(
    (payload) =>
      run(() =>
        request('/auth/login', {
          method: 'POST',
          body: payload,
        })
      ),
    [run]
  )

  const forgotPassword = useCallback(
    (payload) =>
      run(() =>
        request('/auth/forgot', {
          method: 'POST',
          body: payload,
        })
      ),
    [run]
  )

  const resetPassword = useCallback(
    (token, payload) =>
      run(() =>
        request(`/auth/reset/${token}`, {
          method: 'POST',
          body: payload,
        })
      ),
    [run]
  )

  const getCurrentUser = useCallback(
    () =>
      run(() =>
        request('/auth/me')
      ),
    [run]
  )

  // ==========================================================
  // EMPLOYEES
  // ==========================================================

  const listEmployees = useCallback(
    (params = {}) => {
      const query = buildQuery(params)

      return run(() =>
        request(
          `/employees${
            query ? `?${query}` : ''
          }`
        )
      )
    },
    [run]
  )

  const getEmployeeDirectory =
    useCallback(
      () =>
        run(() =>
          request(
            '/employees/directory'
          )
        ),
      [run]
    )

  const getEmployeeStats = useCallback(
    () =>
      run(() =>
        request('/employees/stats')
      ),
    [run]
  )

  const getEmployee = useCallback(
    (id) =>
      run(() =>
        request(`/employees/${id}`)
      ),
    [run]
  )

  const createEmployee = useCallback(
    (payload) =>
      run(() =>
        request('/employees', {
          method: 'POST',
          body: payload,
        })
      ),
    [run]
  )

  const updateEmployee = useCallback(
    (id, payload) =>
      run(() =>
        request(`/employees/${id}`, {
          method: 'PUT',
          body: payload,
        })
      ),
    [run]
  )

  const deleteEmployee = useCallback(
    (id) =>
      run(() =>
        request(`/employees/${id}`, {
          method: 'DELETE',
        })
      ),
    [run]
  )

  // ==========================================================
  // APPROVALS
  // ==========================================================

  const listPendingApprovals =
    useCallback(
      () =>
        run(() =>
          request(
            '/approvals/pending'
          )
        ),
      [run]
    )

  const approveSignup = useCallback(
    (id, payload = {}) =>
      run(() =>
        request(
          `/approvals/${id}/approve`,
          {
            method: 'PATCH',
            body: payload,
          }
        )
      ),
    [run]
  )

  const rejectSignup = useCallback(
    (id, payload = {}) =>
      run(() =>
        request(
          `/approvals/${id}/reject`,
          {
            method: 'PATCH',
            body: payload,
          }
        )
      ),
    [run]
  )

  // ==========================================================
  // COMPANY
  // ==========================================================

  const getMyCompany = useCallback(
    () =>
      run(() =>
        request('/company/me')
      ),
    [run]
  )

  // ==========================================================
  // SUPER ADMIN
  // ==========================================================

  const getPlatformStats = useCallback(
    () =>
      run(() =>
        request('/superadmin/stats')
      ),
    [run]
  )

  const listCompanies = useCallback(
    () =>
      run(() =>
        request('/superadmin/companies')
      ),
    [run]
  )

  const createCompany = useCallback(
    (payload) =>
      run(() =>
        request('/superadmin/companies', {
          method: 'POST',
          body: payload,
        })
      ),
    [run]
  )


const getCompanyDetail = useCallback(
  (companyId) =>
    run(() =>
      request(
        `/superadmin/companies/${companyId}/getCompanyDetail`
      )
    ),
  [run]
)


  // const getCompanyDetail = useCallback(
  //   (companyId) =>
  //     run(() =>
       
  //       request(`/superadmin/companies/${companyId}`)
  //     ),
  //   [run]
  // )
//////////
// const getCompanyDetail = useCallback(
//   (companyId) =>
//     run(() => {
//       console.log('[API] getCompanyDetail')

//       return request(`/superadmin/companies/${companyId}`)
//     }),
//   [run]
// )
  const updateCompany = useCallback(
    (companyId, payload) =>
      run(() =>
        request(`/superadmin/companies/${companyId}`, {
          method: 'PATCH',
          body: payload,
        })
      ),
    [run]
  )

  const deleteCompany = useCallback(
    (companyId, confirmName) =>
      run(() =>
        request(`/superadmin/companies/${companyId}`, {
          method: 'DELETE',
          body: { confirmName },
        })
      ),
    [run]
  )

  const assignAdmin = useCallback(
    (companyId, payload) =>
      run(() =>
        request(`/superadmin/companies/${companyId}/admins`, {
          method: 'POST',
          body: payload,
        })
      ),
    [run]
  )

  const impersonateAdmin = useCallback(
    (userId, reason) =>
      run(() =>
        request(`/superadmin/users/${userId}/impersonate`, {
          method: 'POST',
          body: { reason },
        })
      ),
    [run]
  )

  const endImpersonation = useCallback(
    (logId) =>
      run(() =>
        request(`/superadmin/impersonation/${logId}/end`, {
          method: 'POST',
        })
      ),
    [run]
  )

  // ==========================================================
  // PROFILE
  // ==========================================================

  const getProfile = useCallback(
    () =>
      run(() =>
        request('/profile')
      ),
    [run]
  )

  const updateProfile = useCallback(
    (payload) =>
      run(() =>
        request('/profile', {
          method: 'PUT',
          body: payload,
        })
      ),
    [run]
  )

  const changePassword = useCallback(
    (payload) =>
      run(() =>
        request('/profile/password', {
          method: 'PUT',
          body: payload,
        })
      ),
    [run]
  )

  const uploadProfileImage =
    useCallback(
      (file) => {
        const formData = new FormData()

        formData.append(
          'profileImage',
          file
        )

        return run(() =>
          requestWithFile(
            '/profile/image',
            formData
          )
        )
      },
      [run]
    )

  // ==========================================================
  // PAYROLL
  // ==========================================================

  const listPayroll = useCallback(
    (params = {}) => {
      const query = buildQuery(params)

      return run(() =>
        request(
          `/payroll${
            query ? `?${query}` : ''
          }`
        )
      )
    },
    [run]
  )

  const getMyPayroll = useCallback(
    () =>
      run(() =>
        request('/payroll/my')
      ),
    [run]
  )

  const getSalaryStructure =
    useCallback(
      (employeeId) =>
        run(() =>
          request(
            `/payroll/structure/${employeeId}`
          )
        ),
      [run]
    )

  const saveSalaryStructure =
    useCallback(
      (employeeId, payload) =>
        run(() =>
          request(
            `/payroll/structure/${employeeId}`,
            {
              method: 'PUT',
              body: payload,
            }
          )
        ),
      [run]
    )

  const generateSalary = useCallback(
    (payload) =>
      run(() =>
        request('/payroll/generate', {
          method: 'POST',
          body: payload,
        })
      ),
    [run]
  )

  const getPayslip = useCallback(
    (id) =>
      run(() =>
        request(`/payroll/${id}`)
      ),
    [run]
  )

  // ==========================================================
  // LEAVES
  // ==========================================================

  const applyLeave = useCallback(
    (payload) =>
      run(() =>
        request('/leaves', {
          method: 'POST',
          body: payload,
        })
      ),
    [run]
  )

  const listLeaves = useCallback(
    (params = {}) => {
      const query = buildQuery(params)

      return run(() =>
        request(
          `/leaves${
            query ? `?${query}` : ''
          }`
        )
      )
    },
    [run]
  )

  const getMyLeaves = useCallback(
    () =>
      run(() =>
        request('/leaves/my')
      ),
    [run]
  )

  const getMyLeaveBalance = useCallback(
    () =>
      run(() =>
        request('/leaves/my/balance')
      ),
    [run]
  )

  const getAllLeaveBalances = useCallback(
    () =>
      run(() =>
        request('/leaves/balance')
      ),
    [run]
  )

  const getEmployeeLeaveBalance = useCallback(
    (employeeId) =>
      run(() =>
        request(`/leaves/balance/${employeeId}`)
      ),
    [run]
  )

  const getLeaveById = useCallback(
    (id) =>
      run(() =>
        request(`/leaves/${id}`)
      ),
    [run]
  )

  const approveLeave = useCallback(
    (id) =>
      run(() =>
        request(
          `/leaves/${id}/approve`,
          {
            method: 'PATCH',
          }
        )
      ),
    [run]
  )

  const rejectLeave = useCallback(
    (id) =>
      run(() =>
        request(
          `/leaves/${id}/reject`,
          {
            method: 'PATCH',
          }
        )
      ),
    [run]
  )

  const cancelLeave = useCallback(
    (id) =>
      run(() =>
        request(
          `/leaves/${id}/cancel`,
          {
            method: 'PATCH',
          }
        )
      ),
    [run]
  )

  // ==========================================================
  // ATTENDANCE
  // ==========================================================

  const checkInAttendance =
    useCallback(
      () =>
        run(() =>
          request(
            '/attendance/check-in',
            {
              method: 'POST',
            }
          )
        ),
      [run]
    )

  const checkOutAttendance =
    useCallback(
      () =>
        run(() =>
          request(
            '/attendance/check-out',
            {
              method: 'POST',
            }
          )
        ),
      [run]
    )

  const getMyAttendance =
    useCallback(
      (params = {}) => {
        const query = buildQuery(params)

        return run(() =>
          request(
            `/attendance/my${
              query ? `?${query}` : ''
            }`
          )
        )
      },
      [run]
    )

  const listAttendance =
    useCallback(
      (params = {}) => {
        const query = buildQuery(params)

        return run(() =>
          request(
            `/attendance${
              query ? `?${query}` : ''
            }`
          )
        )
      },
      [run]
    )

  const markAttendance =
    useCallback(
      (payload) =>
        run(() =>
          request('/attendance/mark', {
            method: 'POST',
            body: payload,
          })
        ),
      [run]
    )

  // ==========================================================
  // ATTENDANCE CORRECTIONS
  // ==========================================================

  const requestAttendanceCorrection = useCallback(
    (payload) =>
      run(() =>
        request('/attendance-corrections', {
          method: 'POST',
          body: payload,
        })
      ),
    [run]
  )

  const listAttendanceCorrections = useCallback(
    (params = {}) => {
      const query = buildQuery(params)
      return run(() => request(`/attendance-corrections${query ? `?${query}` : ''}`))
    },
    [run]
  )

  const getMyAttendanceCorrections = useCallback(
    () => run(() => request('/attendance-corrections/my')),
    [run]
  )

  const approveAttendanceCorrection = useCallback(
    (id) => run(() => request(`/attendance-corrections/${id}/approve`, { method: 'PATCH' })),
    [run]
  )

  const rejectAttendanceCorrection = useCallback(
    (id) => run(() => request(`/attendance-corrections/${id}/reject`, { method: 'PATCH' })),
    [run]
  )

  const cancelAttendanceCorrection = useCallback(
    (id) => run(() => request(`/attendance-corrections/${id}/cancel`, { method: 'PATCH' })),
    [run]
  )

  // ==========================================================
  // TASKS
  // ==========================================================

  const listTasks = useCallback(
    (params = {}) => {
      const query = buildQuery(params)

      return run(() =>
        request(
          `/tasks${
            query ? `?${query}` : ''
          }`
        )
      )
    },
    [run]
  )

  const getMyTasks = useCallback(
    () =>
      run(() =>
        request('/tasks/my')
      ),
    [run]
  )

  const createTask = useCallback(
    (payload) =>
      run(() =>
        request('/tasks', {
          method: 'POST',
          body: payload,
        })
      ),
    [run]
  )

  const updateTask = useCallback(
    (id, payload) =>
      run(() =>
        request(`/tasks/${id}`, {
          method: 'PUT',
          body: payload,
        })
      ),
    [run]
  )

  const deleteTask = useCallback(
    (id) =>
      run(() =>
        request(`/tasks/${id}`, {
          method: 'DELETE',
        })
      ),
    [run]
  )

  const addTaskComment = useCallback(
    (id, payload) =>
      run(() =>
        request(
          `/tasks/${id}/comments`,
          {
            method: 'POST',
            body: payload,
          }
        )
      ),
    [run]
  )

  // ==========================================================
  // GOALS
  // ==========================================================

  const listGoals = useCallback(
    (params = {}) => {
      const query = buildQuery(params)

      return run(() =>
        request(
          `/goals${
            query ? `?${query}` : ''
          }`
        )
      )
    },
    [run]
  )

  const getMyGoals = useCallback(
    () =>
      run(() =>
        request('/goals/my')
      ),
    [run]
  )

  const createGoal = useCallback(
    (payload) =>
      run(() =>
        request('/goals', {
          method: 'POST',
          body: payload,
        })
      ),
    [run]
  )

  const updateGoal = useCallback(
    (id, payload) =>
      run(() =>
        request(`/goals/${id}`, {
          method: 'PUT',
          body: payload,
        })
      ),
    [run]
  )

  const deleteGoal = useCallback(
    (id) =>
      run(() =>
        request(`/goals/${id}`, {
          method: 'DELETE',
        })
      ),
    [run]
  )

  // ==========================================================
  // PERFORMANCE REVIEWS
  // ==========================================================

  const listReviews = useCallback(
    (params = {}) => {
      const query = buildQuery(params)

      return run(() =>
        request(
          `/performance-reviews${
            query ? `?${query}` : ''
          }`
        )
      )
    },
    [run]
  )

  const getMyReviews = useCallback(
    () =>
      run(() =>
        request(
          '/performance-reviews/my'
        )
      ),
    [run]
  )

  const createReview = useCallback(
    (payload) =>
      run(() =>
        request(
          '/performance-reviews',
          {
            method: 'POST',
            body: payload,
          }
        )
      ),
    [run]
  )

  const updateReview = useCallback(
    (id, payload) =>
      run(() =>
        request(
          `/performance-reviews/${id}`,
          {
            method: 'PUT',
            body: payload,
          }
        )
      ),
    [run]
  )

  const acknowledgeReview =
    useCallback(
      (id) =>
        run(() =>
          request(
            `/performance-reviews/${id}/acknowledge`,
            {
              method: 'PATCH',
            }
          )
        ),
      [run]
    )

  const deleteReview = useCallback(
    (id) =>
      run(() =>
        request(
          `/performance-reviews/${id}`,
          {
            method: 'DELETE',
          }
        )
      ),
    [run]
  )

  // ==========================================================
  // NOTIFICATIONS
  // ==========================================================

  const listNotifications =
    useCallback(
      (params = {}) => {
        const query = buildQuery(params)

        return run(() =>
          request(
            `/notifications${
              query ? `?${query}` : ''
            }`
          )
        )
      },
      [run]
    )

  const markNotificationRead =
    useCallback(
      (id) =>
        run(() =>
          request(
            `/notifications/${id}/read`,
            {
              method: 'PATCH',
            }
          )
        ),
      [run]
    )

  const markAllNotificationsRead =
    useCallback(
      () =>
        run(() =>
          request(
            '/notifications/read-all',
            {
              method: 'PATCH',
            }
          )
        ),
      [run]
    )

  const sendNotification =
    useCallback(
      (payload) =>
        run(() =>
          request('/notifications', {
            method: 'POST',
            body: payload,
          })
        ),
      [run]
    )

  const deleteNotification =
    useCallback(
      (id) =>
        run(() =>
          request(
            `/notifications/${id}`,
            {
              method: 'DELETE',
            }
          )
        ),
      [run]
    )

  // ==========================================================
  // RETURN ALL FUNCTIONS
  // ==========================================================

  return {
    // State
    loading,
    error,
    setError,

    // Auth
    register,
    login,
    forgotPassword,
    resetPassword,
    getCurrentUser,

    // Approvals
    listPendingApprovals,
    approveSignup,
    rejectSignup,

    // Employees
    listEmployees,
    getEmployeeDirectory,
    getEmployeeStats,
    getEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee,

    // Company
    getMyCompany,

    // Super Admin
    getPlatformStats,
    listCompanies,
    createCompany,
    getCompanyDetail,
    updateCompany,
    deleteCompany,
    assignAdmin,
    impersonateAdmin,
    endImpersonation,

    // Profile
    getProfile,
    updateProfile,
    uploadProfileImage,
    changePassword,

    // Payroll
    listPayroll,
    getMyPayroll,
    getSalaryStructure,
    saveSalaryStructure,
    generateSalary,
    getPayslip,

    // Leaves
    applyLeave,
    listLeaves,
    getMyLeaves,
    getMyLeaveBalance,
    getAllLeaveBalances,
    getEmployeeLeaveBalance,
    getLeaveById,
    approveLeave,
    rejectLeave,
    cancelLeave,

    // Attendance
    checkInAttendance,
    checkOutAttendance,
    getMyAttendance,
    listAttendance,
    markAttendance,
    requestAttendanceCorrection,
    listAttendanceCorrections,
    getMyAttendanceCorrections,
    approveAttendanceCorrection,
    rejectAttendanceCorrection,
    cancelAttendanceCorrection,

    // Tasks
    listTasks,
    getMyTasks,
    createTask,
    updateTask,
    deleteTask,
    addTaskComment,

    // Goals
    listGoals,
    getMyGoals,
    createGoal,
    updateGoal,
    deleteGoal,

    // Performance
    listReviews,
    getMyReviews,
    createReview,
    updateReview,
    acknowledgeReview,
    deleteReview,

    // Notifications
    listNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    sendNotification,
    deleteNotification,
  }
}