import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '../context';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';

const App = () => {
  const { authUser, isCheckingAuth } = useAuth();

  if (isCheckingAuth) {
    return (
      <div className='app-shell flex min-h-screen items-center justify-center px-4 py-8'>
        <div className='frost-panel surface-border w-full max-w-md rounded-[32px] bg-white/80 px-6 py-8 text-center text-slate-900 dark:bg-slate-950/70 dark:text-white'>
          <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-500 text-white shadow-lg'>
            <span className='h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent' />
          </div>
          <p className='section-kicker mt-5'>Loading workspace</p>
          <h1 className='mt-3 text-2xl font-semibold'>Checking your session</h1>
          <p className='mt-2 text-sm text-slate-600 dark:text-slate-400'>
            We&apos;re reconnecting your account and preparing the chat workspace.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen'>
      <Toaster
        position='top-right'
        toastOptions={{
          style: {
            borderRadius: '16px',
            background: '#0f172a',
            color: '#e2e8f0',
            border: '1px solid rgba(148, 163, 184, 0.18)',
          },
        }}
      />
      <Routes>
        <Route path='/' element={authUser ? <HomePage /> : <Navigate to='/login' />} />
        <Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to='/' />} />
        <Route path='/profile' element={authUser ? <ProfilePage /> : <Navigate to='/login' />} />
      </Routes>
    </div>
  );
};

export default App;
