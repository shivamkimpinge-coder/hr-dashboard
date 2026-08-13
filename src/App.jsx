import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import Dashboard from './components/dashboard'
import ForgetPass from './components/Auth/forgotpass'
import Login from './components/Auth/login'
import Signup from './components/Auth/signup'
import ResetPass from './components/Auth/resetpass'

const AUTH_STORAGE_KEY = 'hrAuthSession'
const CURRENT_USER_KEY = 'hrCurrentUser'
const API_BASE_URL = 'http://localhost:4000/api'

function AppRoutes() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(localStorage.getItem(AUTH_STORAGE_KEY)))
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || 'null')
    } catch {
      return null
    }
  })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem(AUTH_STORAGE_KEY, 'true')
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }, [isLoggedIn])

  const handleLogin = async (email, password) => {
    if (!email || !password) {
      setError('Please enter both email and password.')
      return
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Invalid email or password.')
        return
      }

      setCurrentUser(data.user)
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user))
      setError('')
      setIsLoggedIn(true)
      navigate('/dashboard')
    } catch {
      setError('Unable to reach the server. Please try again.')
    }
  }

  const handleSignup = async (name, email, password) => {
    if (!name || !email || !password) {
      setError('Please complete all signup fields.')
      return false
    }

    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Registration failed.')
        return false
      }

      setCurrentUser(data.user)
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user))
      setError('')
      setIsLoggedIn(true)
      navigate('/dashboard')
      return true
    } catch {
      setError('Unable to reach the server. Please try again.')
      return false
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    navigate('/')
  }

  return (
    <Routes>
      <Route path="/" element={<Login onLogin={handleLogin} error={error} onForgotPassword={() => navigate('/forgot-password')} />} />
      <Route path="/dashboard/*" element={isLoggedIn ? <Dashboard currentUser={currentUser} onLogout={handleLogout} /> : <Navigate to="/" replace />} />
      <Route path="/forgot-password" element={<ForgetPass onBack={() => navigate('/')} />} />
      <Route path="/reset-password" element={<ResetPass onBack={() => navigate('/')} />} />

      <Route path="/signup" element={<Signup onSignup={handleSignup} error={error} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
