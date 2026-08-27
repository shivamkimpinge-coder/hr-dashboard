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

  const listPayroll = useCallback((params) => run(() => api.payroll.list(params)), [run])
  const getMyPayroll = useCallback(() => run(() => api.payroll.my()), [run])
  const getSalaryStructure = useCallback((employeeId) => run(() => api.payroll.getStructure(employeeId)), [run])
  const saveSalaryStructure = useCallback(
    (employeeId, payload) => run(() => api.payroll.saveStructure(employeeId, payload)),
    [run]
  )
  const generateSalary = useCallback((payload) => run(() => api.payroll.generate(payload)), [run])
  const getPayslip = useCallback((id) => run(() => api.payroll.getPayslip(id)), [run])

  const applyLeave = useCallback((payload) => run(() => api.leaves.apply(payload)), [run])
  const listLeaves = useCallback((params) => run(() => api.leaves.list(params)), [run])
  const getMyLeaves = useCallback(() => run(() => api.leaves.my()), [run])
  const getLeaveById = useCallback((id) => run(() => api.leaves.get(id)), [run])
  const approveLeave = useCallback((id) => run(() => api.leaves.approve(id)), [run])
  const rejectLeave = useCallback((id) => run(() => api.leaves.reject(id)), [run])
  const cancelLeave = useCallback((id) => run(() => api.leaves.cancel(id)), [run])

  const checkInAttendance = useCallback(() => run(() => api.attendance.checkIn()), [run])
  const checkOutAttendance = useCallback(() => run(() => api.attendance.checkOut()), [run])
  const getMyAttendance = useCallback((params) => run(() => api.attendance.my(params)), [run])
  const listAttendance = useCallback((params) => run(() => api.attendance.list(params)), [run])
  const markAttendance = useCallback((payload) => run(() => api.attendance.mark(payload)), [run])

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

    // Payroll
    listPayroll,
    getMyPayroll,
    getSalaryStructure,
    saveSalaryStructure,
    generateSalary,
    getPayslip,

    // Leave
    applyLeave,
    listLeaves,
    getMyLeaves,
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
  }
}
