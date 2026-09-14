import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'

import DashboardLayout, { DashboardHome, EmployeeListPage } from './components/Dashboard/dashboard'
import Profile from './components/Dashboard/profile'
import Settings from './components/Dashboard/settings'
import EmployeeDetails from './components/Empolyee/employeeDetails'
import SalaryHistory from './components/Payroll/salaryHistory'
import SalaryStructure from './components/Payroll/salaryStructure'
import GenerateSalary from './components/Payroll/generateSalary'
import LeaveList from './components/Leave/leaveList'
import ApplyLeave from './components/Leave/applyLeave'
import CheckInOut from './components/Attendance/checkInOut'
import TeamAttendanceOverview from './components/Attendance/teamOverview'
import MarkAttendance from './components/Attendance/markAttendance'
import AttendanceReports from './components/Attendance/attendanceReports'
import TaskBoard from './components/Tasks/taskBoard'
import Goals from './components/Performance/goals'
import PerformanceReview from './components/Performance/performanceReview'
import Notifications from './components/Notifications'

import ForgetPass from './components/Auth/forgotpass'
import Login from './components/Auth/login'
import Signup from './components/Auth/signup'
import ResetPass from './components/Auth/resetpass'

import RequireManager from './utils/RequireManager'
import { isManagerRole } from './utils/roles'
import { clearToken, getToken, setToken } from './utils/api'

const CURRENT_USER_KEY = 'hrCurrentUser'

function AppRoutes() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(getToken()))
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || 'null')
    } catch {
      return null
    }
  })
  const navigate = useNavigate()

  const handleAuthSuccess = (user, token) => {
    setToken(token)
    setCurrentUser(user)
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
    setIsLoggedIn(true)
    navigate('/dashboard')
  }

  const handleProfileUpdate = (updatedUser) => {
    setCurrentUser((prev) => {
      const merged = { ...prev, ...updatedUser, id: updatedUser._id || updatedUser.id || prev?.id }
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(merged))
      return merged
    })
  }

  const handleSignupSuccess = () => {
    navigate('/', { replace: true, state: { signupSuccess: true } })
  }

  const handleLogout = () => {
    clearToken()
    localStorage.removeItem(CURRENT_USER_KEY)
    setCurrentUser(null)
    setIsLoggedIn(false)
    navigate('/')
    toast.success('Signed out successfully.')
  }

  const isManager = isManagerRole(currentUser)

  return (
    <Routes>
      {/* ---------- Public ---------- */}
      <Route path="/" element={<Login onLoginSuccess={handleAuthSuccess} onForgotPassword={() => navigate('/forgot-password')} />} />
      <Route path="/signup" element={<Signup onSignupSuccess={handleSignupSuccess} />} />
      <Route path="/forgot-password" element={<ForgetPass onBack={() => navigate('/')} />} />
      <Route path="/reset-password" element={<ResetPass onBack={() => navigate('/')} />} />

      {/* ---------- Dashboard (layout route: shell renders once, pages swap in) ---------- */}
      <Route
        path="/dashboard"
        element={
          isLoggedIn ? (
            <DashboardLayout currentUser={currentUser} onLogout={handleLogout} onProfileUpdate={handleProfileUpdate} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      >
        <Route index element={<DashboardHome />} />

        {/* Employees */}
        <Route
          path="employees"
          element={
            <RequireManager currentUser={currentUser}>
              <EmployeeListPage />
            </RequireManager>
          }
        />
        <Route path="employees/:employeeId/*" element={<EmployeeDetails />} />

        {/* Attendance */}
        <Route path="attendance" element={isManager ? <TeamAttendanceOverview /> : <CheckInOut currentUser={currentUser} />} />
        <Route
          path="attendance/mark"
          element={
            <RequireManager currentUser={currentUser}>
              <MarkAttendance />
            </RequireManager>
          }
        />
        <Route path="attendance/reports" element={<AttendanceReports currentUser={currentUser} />} />

        {/* Leave */}
        <Route path="leave" element={<LeaveList currentUser={currentUser} />} />
        <Route path="leave/apply" element={<ApplyLeave currentUser={currentUser} />} />

        {/* Payroll */}
        <Route path="payroll" element={<SalaryHistory currentUser={currentUser} />} />
        <Route
          path="payroll/structure"
          element={
            <RequireManager currentUser={currentUser}>
              <SalaryStructure />
            </RequireManager>
          }
        />
        <Route
          path="payroll/generate"
          element={
            <RequireManager currentUser={currentUser}>
              <GenerateSalary />
            </RequireManager>
          }
        />

        {/* Performance */}
        <Route path="performance" element={<Goals currentUser={currentUser} />} />
        <Route path="performance/reviews" element={<PerformanceReview currentUser={currentUser} />} />

        {/* Everything else */}
        <Route path="tasks" element={<TaskBoard currentUser={currentUser} />} />
        <Route path="notifications" element={<Notifications currentUser={currentUser} />} />
        <Route
          path="profile"
          element={<Profile currentUser={currentUser} onProfileUpdate={handleProfileUpdate} onLogout={handleLogout} />}
        />
        <Route path="settings" element={<Settings currentUser={currentUser} />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        gutter={10}
        toastOptions={{
          duration: 2000,
          className: 'app-toast',
          success: {
            className: 'app-toast app-toast-success',
            iconTheme: { primary: '#4ade80', secondary: '#0a1221' },
          },
          error: {
            className: 'app-toast app-toast-error',
            iconTheme: { primary: '#f87171', secondary: '#0a1221' },
          },
        }}
      />
      <AppRoutes />
    </BrowserRouter>
  )
}
