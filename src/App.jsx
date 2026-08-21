
import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'
import Dashboard from './components/Dashboard/dashboard'
import ForgetPass from './components/Auth/forgotpass'
import Login from './components/Auth/login'
import Signup from './components/Auth/signup'
import ResetPass from './components/Auth/resetpass'
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

  return (
    <Routes>
      <Route path="/" element={<Login onLoginSuccess={handleAuthSuccess} onForgotPassword={() => navigate('/forgot-password')} />} />
      <Route
        path="/dashboard/*"
        element={
          isLoggedIn ? (
            <Dashboard currentUser={currentUser} onLogout={handleLogout} onProfileUpdate={handleProfileUpdate} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route path="/forgot-password" element={<ForgetPass onBack={() => navigate('/')} />} />
      <Route path="/reset-password" element={<ResetPass onBack={() => navigate('/')} />} />

      <Route path="/signup" element={<Signup onSignupSuccess={handleSignupSuccess} />} />
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
          duration: 5000,
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
