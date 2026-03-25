import React, { useContext, Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import AppLoader from './components/AppLoader'
import { Toaster } from "react-hot-toast"
import { AuthContext } from './context/AuthContext'
import { TOAST_OPTIONS } from './constants'

const HomePage = lazy(() => import('./pages/HomePage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const ChatAppsComparison = lazy(() => import('./pages/ChatAppsComparison'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))

const App = () => {
  const { authUser, isLoading } = useContext(AuthContext)

  // Show loader while checking auth
  if (isLoading) {
    return <AppLoader />
  }

  return (
    <ErrorBoundary>
      <Toaster position="top-right" toastOptions={TOAST_OPTIONS} />
      <Suspense fallback={<AppLoader />}>
        <Routes>
          <Route path='/' element={authUser ? <HomePage /> : <Navigate to="/login" replace />} />
          <Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to="/" replace />} />
          <Route path='/profile' element={authUser ? <ProfilePage /> : <Navigate to="/login" replace />} />
          <Route path='/compare' element={<ChatAppsComparison />} />
          <Route path='/admin' element={authUser ? <AdminDashboard /> : <Navigate to="/login" replace />} />
          <Route path='*' element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

export default App