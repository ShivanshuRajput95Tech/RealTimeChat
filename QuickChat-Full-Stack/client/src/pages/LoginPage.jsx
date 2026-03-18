import React, { useState } from 'react';
import assets from '../assets/assets';
import { useAuth } from '../../context/auth-context';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [currState, setCurrState] = useState('Sign up');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error('Please enter a valid email');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (currState === 'Sign up' && fullName.trim().length < 2) {
      toast.error('Full name must be at least 2 characters');
      return;
    }

    if (currState === 'Sign up' && !isDataSubmitted) {
      setIsDataSubmitted(true);
      return;
    }

    setLoading(true);
    try {
      await login(currState === 'Sign up' ? 'signup' : 'login', { fullName, email, password, bio });
    } catch {
      // Toast already handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-950 via-purple-900/20 to-slate-950 flex items-center justify-center p-4'>
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob'/>
        <div className='absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000'/>
        <div className='absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000'/>
      </div>

      <div className='w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center relative'>
        <div className='hidden md:flex flex-col items-center justify-center'>
          <div className='relative'>
            <div className='absolute inset-0 bg-gradient-to-r from-violet-600 to-pink-600 rounded-full filter blur-2xl opacity-50'/>
            <img src={assets.logo_big} alt='Logo' className='relative w-64 h-64 object-contain'/>
          </div>
          <h1 className='text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400 mt-4'>Chatify</h1>
          <p className='text-gray-300 mt-2 text-center'>Connect instantly with your friends</p>
        </div>

        <form onSubmit={onSubmitHandler} className='backdrop-blur-xl bg-white/10 border border-white/20 p-8 rounded-2xl shadow-2xl'>
          <div className='md:hidden flex flex-col items-center mb-8'>
            <img src={assets.logo_big} alt='Logo' className='w-32 h-32 object-contain'/>
            <h1 className='text-3xl font-bold text-white mt-2'>Chatify</h1>
          </div>

          <h2 className='text-2xl font-bold text-white mb-6'>
            {currState === 'Sign up' ? 'Create Account' : 'Welcome Back'}
          </h2>

          {currState === 'Sign up' && !isDataSubmitted && (
            <div className='space-y-4 mb-4'>
              <input
                onChange={(e) => setFullName(e.target.value)}
                value={fullName}
                type='text'
                className='w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition'
                placeholder='Full Name'
                required
              />
            </div>
          )}

          {!isDataSubmitted && (
            <div className='space-y-4 mb-4'>
              <input
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                type='email'
                placeholder='Email Address'
                required
                className='w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition'
              />
              <input
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                type='password'
                placeholder='Password (min. 6 characters)'
                required
                className='w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition'
              />
            </div>
          )}

          {currState === 'Sign up' && isDataSubmitted && (
            <div className='mb-4'>
              <textarea
                onChange={(e) => setBio(e.target.value)}
                value={bio}
                rows={4}
                className='w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition resize-none'
                placeholder='Tell us about yourself...'
                required
              />
            </div>
          )}

          <button
            type='submit'
            disabled={loading}
            className='w-full py-3 mt-6 bg-gradient-to-r from-violet-600 to-pink-600 text-white font-semibold rounded-lg hover:from-violet-700 hover:to-pink-700 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg'
          >
            {loading ? (
              <span className='flex items-center justify-center gap-2'>
                <svg className='animate-spin w-4 h-4' fill='none' viewBox='0 0 24 24'>
                  <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'/>
                  <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'/>
                </svg>
                Processing...
              </span>
            ) : (
              currState === 'Sign up' ? (isDataSubmitted ? 'Create Account' : 'Continue') : 'Login Now'
            )}
          </button>

          {isDataSubmitted && currState === 'Sign up' && (
            <button
              type='button'
              onClick={() => setIsDataSubmitted(false)}
              className='w-full py-2 mt-3 bg-white/5 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/10 transition'
            >
              ← Back
            </button>
          )}

          <div className='flex items-center gap-2 text-xs text-gray-400 mt-4 mb-4'>
            <input type='checkbox' id='terms' defaultChecked />
            <label htmlFor='terms'>I agree to the terms of use & privacy policy</label>
          </div>

          <div className='border-t border-white/10 pt-4'>
            {currState === 'Sign up' ? (
              <p className='text-sm text-gray-300'>
                Already have an account?{' '}
                <span
                  onClick={() => {
                    setCurrState('Login');
                    setIsDataSubmitted(false);
                  }}
                  className='font-semibold text-violet-400 cursor-pointer hover:text-violet-300 transition'
                >
                  Login here
                </span>
              </p>
            ) : (
              <p className='text-sm text-gray-300'>
                Don&apos;t have an account?{' '}
                <span
                  onClick={() => {
                    setCurrState('Sign up');
                    setIsDataSubmitted(false);
                  }}
                  className='font-semibold text-violet-400 cursor-pointer hover:text-violet-300 transition'
                >
                  Sign up
                </span>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
