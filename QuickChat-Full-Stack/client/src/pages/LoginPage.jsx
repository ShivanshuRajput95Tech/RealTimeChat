import React, { useState } from 'react';
import assets from '../assets/assets';
import { useAuth } from '../../context';
import toast from 'react-hot-toast';

const featurePoints = [
  'Real-time messaging with live presence updates',
  'Secure JWT-based access and protected sessions',
  'Responsive workspace designed for desktop and mobile',
];

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

  const isSignup = currState === 'Sign up';

  return (
    <div className='app-shell min-h-screen px-4 py-8'>
      <div className='mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]'>
        <section className='frost-panel hidden rounded-[36px] border border-white/10 bg-slate-900/60 p-10 text-white lg:block'>
          <div className='max-w-lg'>
            <div className='inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200'>
              Signature communication
            </div>
            <h1 className='font-display mt-6 text-5xl font-semibold leading-tight'>
              Messaging with atmosphere, focus, and a little bit of magic.
            </h1>
            <p className='mt-5 text-base leading-7 text-slate-300'>
              Chatify blends live conversation, subtle depth, and AI-assisted momentum into a workspace that feels memorable from the first interaction.
            </p>

            <div className='mt-8 grid gap-3'>
              {featurePoints.map((item) => (
                <div key={item} className='flex items-start gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-4'>
                  <span className='mt-1 h-2.5 w-2.5 rounded-full bg-cyan-300' />
                  <p className='text-sm leading-6 text-slate-200'>{item}</p>
                </div>
              ))}
            </div>

            <div className='mt-10 rounded-[28px] border border-white/8 bg-gradient-to-br from-slate-900 to-slate-800/80 p-6'>
              <img src={assets.logo_big} alt='Chatify logo' className='h-20 w-20 object-contain' />
              <p className='mt-4 text-sm uppercase tracking-[0.22em] text-slate-400'>Realtime • Secure • Reliable</p>
            </div>
          </div>
        </section>

        <form onSubmit={onSubmitHandler} className='frost-panel rounded-[36px] border border-white/10 bg-slate-900/72 p-6 sm:p-8'>
          <div className='mb-8 flex items-center justify-between gap-4'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300'>Chatify</p>
              <h2 className='font-display mt-2 text-3xl font-semibold text-white'>
                {isSignup ? 'Create your workspace account' : 'Sign in to your workspace'}
              </h2>
              <p className='mt-2 text-sm text-slate-400'>
                {isSignup ? 'Set up your profile and start collaborating in real time.' : 'Continue securely with your existing credentials.'}
              </p>
            </div>
            <img src={assets.logo_icon} alt='Chatify icon' className='hidden h-12 w-12 sm:block' />
          </div>

          {isSignup && !isDataSubmitted && (
            <div className='mb-4'>
              <label className='mb-2 block text-sm font-medium text-slate-200'>Full name</label>
              <input
                onChange={(e) => setFullName(e.target.value)}
                value={fullName}
                type='text'
                className='w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/40'
                placeholder='Jane Doe'
                required
              />
            </div>
          )}

          {!isDataSubmitted && (
            <div className='space-y-4'>
              <div>
                <label className='mb-2 block text-sm font-medium text-slate-200'>Email address</label>
                <input
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                  type='email'
                  placeholder='name@company.com'
                  required
                  className='w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/40'
                />
              </div>
              <div>
                <label className='mb-2 block text-sm font-medium text-slate-200'>Password</label>
                <input
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                  type='password'
                  placeholder='Minimum 6 characters'
                  required
                  className='w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/40'
                />
              </div>
            </div>
          )}

          {isSignup && isDataSubmitted && (
            <div className='mt-2'>
              <label className='mb-2 block text-sm font-medium text-slate-200'>Short bio</label>
              <textarea
                onChange={(e) => setBio(e.target.value)}
                value={bio}
                rows={4}
                className='w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 resize-none'
                placeholder='Share a quick intro for your teammates...'
                required
              />
            </div>
          )}

          <button
            type='submit'
            disabled={loading}
            className='mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-cyan-400 hover:to-violet-400 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {loading ? (
              <span className='flex items-center gap-2'>
                <svg className='h-4 w-4 animate-spin' fill='none' viewBox='0 0 24 24'>
                  <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                  <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                </svg>
                Processing...
              </span>
            ) : isSignup ? (isDataSubmitted ? 'Create account' : 'Continue setup') : 'Sign in'}
          </button>

          {isDataSubmitted && isSignup && (
            <button
              type='button'
              onClick={() => setIsDataSubmitted(false)}
              className='mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10'
            >
              Back to credentials
            </button>
          )}

          <div className='mt-5 flex items-center gap-2 text-xs text-slate-400'>
            <input type='checkbox' id='terms' defaultChecked className='rounded border-white/20 bg-slate-900' />
            <label htmlFor='terms'>I agree to the platform terms and privacy policy.</label>
          </div>

          <div className='mt-6 border-t border-white/10 pt-5'>
            {isSignup ? (
              <p className='text-sm text-slate-300'>
                Already have an account?{' '}
                <span
                  onClick={() => {
                    setCurrState('Login');
                    setIsDataSubmitted(false);
                  }}
                  className='cursor-pointer font-semibold text-cyan-300 transition hover:text-cyan-200'
                >
                  Sign in
                </span>
              </p>
            ) : (
              <p className='text-sm text-slate-300'>
                Don&apos;t have an account?{' '}
                <span
                  onClick={() => {
                    setCurrState('Sign up');
                    setIsDataSubmitted(false);
                  }}
                  className='cursor-pointer font-semibold text-cyan-300 transition hover:text-cyan-200'
                >
                  Create one
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
