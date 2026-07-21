import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'

function AppContent() {
  const [token, setToken] = useState(() => localStorage.getItem('flowfunds_token'))
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('flowfunds_user')
    return storedUser ? JSON.parse(storedUser) : null
  })

  const isAuthenticated = useMemo(() => Boolean(token), [token])

  useEffect(() => {
    if (token) {
      localStorage.setItem('flowfunds_token', token)
    } else {
      localStorage.removeItem('flowfunds_token')
    }
  }, [token])

  useEffect(() => {
    if (user) {
      localStorage.setItem('flowfunds_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('flowfunds_user')
    }
  }, [user])

  const handleAuthSuccess = (nextToken, nextUser) => {
    setToken(nextToken)
    setUser(nextUser)
  }

  const handleLogout = () => {
    setToken(null)
    setUser(null)
  }

  return (
    <Routes>
      <Route path="/login" element={<AuthPage initialMode="login" onAuthSuccess={handleAuthSuccess} />} />
      <Route path="/signup" element={<AuthPage initialMode="signup" onAuthSuccess={handleAuthSuccess} />} />
      <Route path="/auth" element={<Navigate to="/login" replace />} />
      <Route element={<Layout onLogout={handleLogout} user={user} />}>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <DashboardPage user={user} />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
