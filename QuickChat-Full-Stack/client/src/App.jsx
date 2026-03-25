import React, { useContext, Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import AppLoader from './components/AppLoader'
import { Toaster } from "react-hot-toast"
import { AuthContext } from '../context/AuthContext'

const HomePage = lazy(() => import('./pages/HomePage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const ChatAppsComparison = lazy(() => import('./pages/ChatAppsComparison'))

const App = () => {
  const { authUser } = useContext(AuthContext)
  return (
    <ErrorBoundary>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1a1a25',
            color: '#e2e8f0',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#1a1a25' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#1a1a25' } },
        }}
      />
      <Suspense fallback={<AppLoader />}>
        <Routes>
          <Route path='/' element={authUser ? <HomePage /> : <Navigate to="/login" />} />
          <Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
          <Route path='/profile' element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
          <Route path='/compare' element={<ChatAppsComparison />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

export default App
