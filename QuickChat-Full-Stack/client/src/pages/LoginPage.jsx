import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import assets from '../assets/assets';
import { useAuth, useTheme } from '../../context';

const featurePoints = [
  {
    title: 'Responsive workspace',
    description: 'A clean three-panel layout on desktop with focused chat navigation on mobile.',
  },
  {
    title: 'Real-time collaboration',
    description: 'Presence, unread counters, and live delivery feedback keep conversations current.',
  },
  {
    title: 'AI assistance',
    description: 'Summaries, reply suggestions, and tone checks are available when you need them.',
  },
];

const stats = [
  { label: 'Avg. reply time', value: '< 2 min' },
  { label: 'Workspace uptime', value: '99.9%' },
  { label: 'Messages synced', value: 'Real-time' },
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
  const { isDark, toggleTheme } = useTheme();

  const isSignup = currState === 'Sign up';

  const stepLabel = useMemo(() => {
    if (!isSignup) return 'Sign in';
    return isDataSubmitted ? 'Profile details' : 'Account setup';
  }, [isDataSubmitted, isSignup]);

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

    if (isSignup && fullName.trim().length < 2) {
      toast.error('Full name must be at least 2 characters');
      return;
    }

    if (isSignup && !isDataSubmitted) {
      setIsDataSubmitted(true);
      return;
    }

    setLoading(true);
    try {
      await login(isSignup ? 'signup' : 'login', { fullName, email, password, bio });
    } catch {
      // Toast already handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='app-shell min-h-screen px-4 py-6 sm:px-6 sm:py-8'>
      <div className='mx-auto max-w-7xl'>
        <div className='mb-5 flex items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 shadow-lg dark:bg-slate-900/70'>
              <img src={assets.logo_icon} alt='QuickChat logo' className='h-7 w-7' />
            </div>
            <div>
              <p className='section-kicker'>QuickChat</p>
              <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Modern team messaging without the clutter.</p>
            </div>
          </div>

          <button
            type='button'
            onClick={toggleTheme}
            className={`surface-border inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium ${isDark ? 'bg-slate-950/65 text-slate-100' : 'bg-white/80 text-slate-700'}`}
          >
            <span>{isDark ? '☀️' : '🌙'}</span>
            <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
          </button>
        </div>

        <div className='grid min-h-[calc(100vh-7rem)] gap-6 lg:grid-cols-[1.1fr_0.9fr]'>
          <section className={`frost-panel surface-border overflow-hidden rounded-[36px] ${isDark ? 'bg-slate-950/65 text-white' : 'bg-white/82 text-slate-900'}`}>
            <div className='grid h-full gap-0 lg:grid-cols-[minmax(0,1fr)_300px]'>
              <div className='px-6 py-8 sm:px-8 sm:py-10 lg:px-10'>
                <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${isDark ? 'bg-emerald-500/10 text-emerald-200' : 'bg-emerald-50 text-emerald-700'}`}>
                  Calm, premium, responsive
                </div>
                <h1 className='mt-6 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl'>
                  The messaging workspace that tells you exactly what matters.
                </h1>
                <p className={`mt-5 max-w-2xl text-base leading-7 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  QuickChat keeps conversations organised with a clean chat list, focused message canvas, smart assistance, and profile settings that feel consistent across every screen.
                </p>

                <div className='mt-8 grid gap-4 md:grid-cols-3'>
                  {stats.map((item) => (
                    <div key={item.label} className={`surface-border rounded-[24px] px-4 py-4 ${isDark ? 'bg-white/5' : 'bg-slate-50/80'}`}>
                      <p className={`text-[11px] uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.label}</p>
                      <p className='mt-3 text-xl font-semibold'>{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className='mt-8 grid gap-4'>
                  {featurePoints.map((item, index) => (
                    <div key={item.title} className={`surface-border flex gap-4 rounded-[24px] px-4 py-4 ${isDark ? 'bg-white/5' : 'bg-slate-50/80'}`}>
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold ${isDark ? 'bg-emerald-500/15 text-emerald-200' : 'bg-emerald-50 text-emerald-700'}`}>
                        0{index + 1}
                      </div>
                      <div>
                        <h2 className='text-base font-semibold'>{item.title}</h2>
                        <p className={`mt-1 text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <aside className={`surface-muted flex flex-col justify-between border-t px-6 py-8 lg:border-l lg:border-t-0 ${isDark ? 'border-white/8' : 'border-slate-200'}`}>
                <div>
                  <p className='section-kicker'>Preview</p>
                  <h2 className='mt-3 text-2xl font-semibold'>A clean, practical chat flow</h2>
                  <p className={`mt-2 text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Less visual noise, clearer status cues, and better hierarchy across list, thread, and details.
                  </p>
                </div>

                <div className={`surface-border mt-6 rounded-[28px] p-4 ${isDark ? 'bg-slate-950/60' : 'bg-white/88'}`}>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-semibold'>Product sync</p>
                      <p className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Online • 12 unread updates cleared</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${isDark ? 'bg-emerald-500/10 text-emerald-200' : 'bg-emerald-50 text-emerald-700'}`}>
                      Live
                    </span>
                  </div>

                  <div className='mt-4 space-y-3'>
                    <div className={`max-w-[85%] rounded-[20px] px-4 py-3 text-sm ${isDark ? 'bg-white/6 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
                      Can we move the launch review to 3:30 PM and share the final deck there?
                    </div>
                    <div className='ml-auto max-w-[85%] rounded-[20px] bg-gradient-to-r from-emerald-500 to-sky-500 px-4 py-3 text-sm text-white shadow-lg'>
                      Works for me. I&apos;ll update the notes and send the revised agenda in this thread.
                    </div>
                  </div>
                </div>

                <div className='mt-6 rounded-[28px] bg-gradient-to-br from-emerald-500 to-sky-500 p-[1px]'>
                  <div className={`rounded-[27px] px-4 py-4 ${isDark ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'}`}>
                    <p className='text-sm font-semibold'>Designed for teams that want clarity</p>
                    <p className={`mt-2 text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      A unified visual system across auth, chat, and profile settings makes the product feel intentional instead of stitched together.
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </section>

          <form onSubmit={onSubmitHandler} className={`frost-panel surface-border rounded-[36px] px-6 py-8 sm:px-8 ${isDark ? 'bg-slate-950/70 text-white' : 'bg-white/88 text-slate-900'}`}>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <p className='section-kicker'>{stepLabel}</p>
                <h2 className='mt-3 text-3xl font-semibold'>
                  {isSignup ? 'Create your account' : 'Welcome back'}
                </h2>
                <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isSignup ? 'Set up your account in two simple steps.' : 'Sign in to continue where you left off.'}
                </p>
              </div>
              <img src={assets.logo_big} alt='QuickChat mark' className='hidden h-14 w-14 object-contain sm:block' />
            </div>

            {isSignup && (
              <div className='mt-6 flex gap-2'>
                {['Credentials', 'Profile'].map((item, index) => {
                  const active = (!isDataSubmitted && index === 0) || (isDataSubmitted && index === 1);
                  return (
                    <div
                      key={item}
                      className={`flex-1 rounded-2xl px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] ${active ? (isDark ? 'bg-emerald-500/12 text-emerald-200' : 'bg-emerald-50 text-emerald-700') : (isDark ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-500')}`}
                    >
                      {item}
                    </div>
                  );
                })}
              </div>
            )}

            <div className='mt-6 space-y-4'>
              {isSignup && !isDataSubmitted && (
                <div>
                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Full name</label>
                  <input
                    onChange={(e) => setFullName(e.target.value)}
                    value={fullName}
                    type='text'
                    className={`surface-border w-full rounded-2xl px-4 py-3 text-sm outline-none ${isDark ? 'bg-slate-900/80 text-white placeholder-slate-500' : 'bg-slate-50 text-slate-900 placeholder-slate-400'}`}
                    placeholder='Jane Doe'
                    required
                  />
                </div>
              )}

              {!isDataSubmitted && (
                <>
                  <div>
                    <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Email address</label>
                    <input
                      onChange={(e) => setEmail(e.target.value)}
                      value={email}
                      type='email'
                      placeholder='name@company.com'
                      required
                      className={`surface-border w-full rounded-2xl px-4 py-3 text-sm outline-none ${isDark ? 'bg-slate-900/80 text-white placeholder-slate-500' : 'bg-slate-50 text-slate-900 placeholder-slate-400'}`}
                    />
                  </div>
                  <div>
                    <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Password</label>
                    <input
                      onChange={(e) => setPassword(e.target.value)}
                      value={password}
                      type='password'
                      placeholder='Minimum 6 characters'
                      required
                      className={`surface-border w-full rounded-2xl px-4 py-3 text-sm outline-none ${isDark ? 'bg-slate-900/80 text-white placeholder-slate-500' : 'bg-slate-50 text-slate-900 placeholder-slate-400'}`}
                    />
                  </div>
                </>
              )}

              {isSignup && isDataSubmitted && (
                <div>
                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Short bio</label>
                  <textarea
                    onChange={(e) => setBio(e.target.value)}
                    value={bio}
                    rows={5}
                    className={`surface-border w-full resize-none rounded-2xl px-4 py-3 text-sm outline-none ${isDark ? 'bg-slate-900/80 text-white placeholder-slate-500' : 'bg-slate-50 text-slate-900 placeholder-slate-400'}`}
                    placeholder='Share your role, team, or what people should know when they start a chat with you.'
                    required
                  />
                </div>
              )}
            </div>

            <button
              type='submit'
              disabled={loading}
              className='mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-emerald-400 hover:to-sky-400 disabled:cursor-not-allowed disabled:opacity-50'
            >
              {loading ? (
                <span className='flex items-center gap-2'>
                  <svg className='h-4 w-4 animate-spin' fill='none' viewBox='0 0 24 24'>
                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                  </svg>
                  Processing...
                </span>
              ) : isSignup ? (isDataSubmitted ? 'Create account' : 'Continue') : 'Sign in'}
            </button>

            {isDataSubmitted && isSignup && (
              <button
                type='button'
                onClick={() => setIsDataSubmitted(false)}
                className={`mt-3 inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold ${isDark ? 'bg-white/5 text-slate-200 hover:bg-white/10' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                Back to credentials
              </button>
            )}

            <div className={`mt-5 rounded-2xl px-4 py-4 text-sm ${isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
              {isSignup
                ? 'Your name, avatar, and bio can be updated later from profile settings.'
                : 'Use the same email and password you registered with to continue securely.'}
            </div>

            <div className='mt-6 border-t border-slate-200/20 pt-5'>
              {isSignup ? (
                <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Already have an account?{' '}
                  <button
                    type='button'
                    onClick={() => {
                      setCurrState('Login');
                      setIsDataSubmitted(false);
                    }}
                    className='font-semibold text-sky-500 hover:text-sky-400'
                  >
                    Sign in
                  </button>
                </p>
              ) : (
                <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Don&apos;t have an account?{' '}
                  <button
                    type='button'
                    onClick={() => {
                      setCurrState('Sign up');
                      setIsDataSubmitted(false);
                    }}
                    className='font-semibold text-sky-500 hover:text-sky-400'
                  >
                    Create one
                  </button>
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
