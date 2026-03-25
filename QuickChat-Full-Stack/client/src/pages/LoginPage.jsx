import React, { useContext, useState, useEffect, useRef, Suspense, lazy, useCallback, useMemo } from 'react'
import { AuthContext } from '../../context/AuthContext'

const FloatingParticles = () => {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let particles = []
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)
    const colors = ['#6366f1', '#a855f7', '#06b6d4', '#818cf8', '#c084fc', '#22d3ee']
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.5,
        dx: (Math.random() - 0.5) * 0.3,
        dy: (Math.random() - 0.5) * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.4 + 0.1,
        pulse: Math.random() * Math.PI * 2,
      })
    }
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p, i) => {
        p.x += p.dx; p.y += p.dy; p.pulse += 0.015
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1
        const a = p.alpha * (0.5 + 0.5 * Math.sin(p.pulse))
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = a
        ctx.fill()
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y)
          if (dist < 100) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = p.color
            ctx.globalAlpha = (1 - dist / 100) * 0.06
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      })
      ctx.globalAlpha = 1
      animId = requestAnimationFrame(animate)
    }
    animate()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }} />
}

const PasswordStrength = ({ password }) => {
  const checks = [
    { label: '8+ chars', met: password.length >= 8 },
    { label: 'Upper', met: /[A-Z]/.test(password) },
    { label: 'Number', met: /\d/.test(password) },
    { label: 'Special', met: /[^A-Za-z0-9]/.test(password) },
  ]
  const score = checks.filter(c => c.met).length
  const colors = ['#ef4444', '#f59e0b', '#22c55e', '#6366f1']
  const labels = ['Weak', 'Fair', 'Good', 'Strong']
  if (!password) return null
  return (
    <div className="mt-2 space-y-1.5 fade-in">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-surface-700 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(score / 4) * 100}%`, background: colors[score - 1] || '#ef4444' }} />
        </div>
        <span className="text-[10px] font-medium" style={{ color: colors[score - 1] || '#ef4444' }}>{labels[score - 1] || 'Short'}</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {checks.map((c, i) => (
          <span key={i} className={`text-[10px] flex items-center gap-1 ${c.met ? 'text-green-500' : 'text-zinc-600'}`}>
            {c.met ? '✓' : '○'} {c.label}
          </span>
        ))}
      </div>
    </div>
  )
}

const LoginPage = () => {
  const [currState, setCurrState] = useState('Sign up')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [bio, setBio] = useState('')
  const [isDataSubmitted, setIsDataSubmitted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })
  const [focused, setFocused] = useState(null)

  const { login } = useContext(AuthContext)

  const handleMouseMove = useCallback((e) => {
    setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight })
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [handleMouseMove])

  const onSubmitHandler = async (event) => {
    event.preventDefault()
    setIsLoading(true)
    if (currState === 'Sign up' && !isDataSubmitted) {
      setIsDataSubmitted(true)
      setIsLoading(false)
      return
    }
    await login(currState === 'Sign up' ? 'signup' : 'login', { fullName, email, password, bio })
    setIsLoading(false)
  }

  const holographicStyle = useMemo(() => ({
    background: `radial-gradient(800px circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(99,102,241,0.1), transparent 40%), radial-gradient(600px circle at ${(1 - mousePos.x) * 100}% ${(1 - mousePos.y) * 100}%, rgba(168,85,247,0.07), transparent 40%)`,
  }), [mousePos])

  const InputField = ({ icon, label, type, value, onChange, placeholder, required, isPassword }) => (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
        {icon} {label}
      </label>
      <div className={`relative rounded-xl transition-all duration-300 ${focused === label ? 'ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/5' : ''}`}>
        <input
          onFocus={() => setFocused(label)}
          onBlur={() => setFocused(null)}
          onChange={onChange}
          value={value}
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          placeholder={placeholder}
          required={required}
          className="w-full px-4 py-3.5 bg-gray-800/60 border border-white/[0.06] rounded-xl text-sm text-white placeholder-zinc-600 outline-none transition-all duration-300 hover:border-white/10 focus:border-indigo-400/40 focus:bg-gray-800/90"
        />
        {isPassword && (
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors cursor-pointer"
          >
            {showPassword ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            )}
          </button>
        )}
      </div>
      {isPassword && <PasswordStrength password={value} />}
    </div>
  )

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden" style={{ background: '#050510' }}>
      <FloatingParticles />
      <div className="absolute inset-0 pointer-events-none" style={holographicStyle} />

      {/* Left branding */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center relative z-10 p-12">
        <div className="max-w-lg space-y-8 fade-in">
          <div className="space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="drop-shadow-lg">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">
              Quick<span className="text-indigo-400">Chat</span>
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed">
              AI-native communication platform for teams. Connect, collaborate, and communicate with intelligent features.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: '💬', title: 'Real-time Messaging', desc: 'Instant messages' },
              { icon: '🤖', title: 'AI Copilot', desc: 'Smart assistance' },
              { icon: '👥', title: 'Workspaces', desc: 'Team collaboration' },
              { icon: '📞', title: 'Voice & Video', desc: 'Crystal clear calls' },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                <span className="text-xl">{feature.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{feature.title}</p>
                  <p className="text-xs text-zinc-500">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">QuickChat</h1>
          </div>

          <div className="bg-gray-900/80 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              {currState === 'Sign up' ? 'Create Account' : 'Welcome Back'}
            </h2>

            <form onSubmit={onSubmitHandler} className="space-y-5">
              {currState === 'Sign up' && !isDataSubmitted && (
                <>
                  <InputField 
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                    label="Full Name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your name"
                    required
                  />
                  <InputField 
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                  <InputField 
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    required
                    isPassword
                  />
                </>
              )}

              {currState === 'Sign up' && isDataSubmitted && (
                <>
                  <InputField 
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                    label="Full Name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your name"
                    required
                  />
                  <InputField 
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                  <InputField 
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    required
                    isPassword
                  />
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      Bio (optional)
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      placeholder="Tell us about yourself..."
                      className="w-full px-4 py-3 bg-gray-800/60 border border-white/[0.06] rounded-xl text-sm text-white placeholder-zinc-600 outline-none transition-all duration-300 hover:border-white/10 focus:border-indigo-400/40 resize-none"
                    />
                  </div>
                </>
              )}

              {currState === 'login' && (
                <>
                  <InputField 
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                  <InputField 
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    isPassword
                  />
                </>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl cursor-pointer hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                ) : (
                  <>
                    {currState === 'Sign up' ? 'Continue' : 'Sign In'}
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-zinc-400 text-sm">
                {currState === 'Sign up' ? 'Already have an account?' : "Don't have an account?"}
                <button 
                  onClick={() => { setCurrState(currState === 'Sign up' ? 'login' : 'Sign up'); setIsDataSubmitted(false) }}
                  className="ml-2 text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                >
                  {currState === 'Sign up' ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
