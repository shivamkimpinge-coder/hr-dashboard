import { useCallback, useState } from 'react'
import { api } from '../utils/api'

/**
 * Central hook for calling the backend API from React components.
 * Tracks loading/error state per invocation and returns the resolved
 * data so callers can `await` it directly.
 */
export default function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const run = useCallback(async (apiCall) => {
    setLoading(true)
    setError('')
    try {
      return await apiCall()
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback((payload) => run(() => api.auth.register(payload)), [run])
  const login = useCallback((payload) => run(() => api.auth.login(payload)), [run])
  const forgotPassword = useCallback((payload) => run(() => api.auth.forgotPassword(payload)), [run])
  const resetPassword = useCallback((token, payload) => run(() => api.auth.resetPassword(token, payload)), [run])
  const getCurrentUser = useCallback(() => run(() => api.auth.me()), [run])

  const listEmployees = useCallback((params) => run(() => api.employees.list(params)), [run])
  const getEmployeeStats = useCallback(() => run(() => api.employees.stats()), [run])
  const getEmployee = useCallback((id) => run(() => api.employees.get(id)), [run])
  const createEmployee = useCallback((payload) => run(() => api.employees.create(payload)), [run])
  const updateEmployee = useCallback((id, payload) => run(() => api.employees.update(id, payload)), [run])
  const deleteEmployee = useCallback((id) => run(() => api.employees.remove(id)), [run])

  const getProfile = useCallback(() => run(() => api.profile.get()), [run])
  const updateProfile = useCallback((payload) => run(() => api.profile.update(payload)), [run])
  const uploadProfileImage = useCallback((file) => run(() => api.profile.uploadImage(file)), [run])
  const changePassword = useCallback((payload) => run(() => api.profile.changePassword(payload)), [run])

  return {
    loading,
    error,
    setError,

    // Auth
    register,
    login,
    forgotPassword,
    resetPassword,
    getCurrentUser,

    // Employees
    listEmployees,
    getEmployeeStats,
    getEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee,

    // Profile
    getProfile,
    updateProfile,
    uploadProfileImage,
    changePassword,
  }
}
