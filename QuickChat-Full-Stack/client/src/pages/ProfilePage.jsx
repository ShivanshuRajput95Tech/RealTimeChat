import React, { useContext, useState, Suspense, lazy } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const LiquidGlass3DBackground = lazy(() => import('../components/LiquidGlass3DBackground').catch(() => ({ default: () => null })))

const ProfilePage = () => {
  const { authUser, updateProfile, axios } = useContext(AuthContext)
  const [selectedImg, setSelectedImg] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const navigate = useNavigate()
  const [name, setName] = useState(authUser?.fullName || '')
  const [bio, setBio] = useState(authUser?.bio || '')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [notifications, setNotifications] = useState({
    messages: authUser?.settings?.notifications ?? true,
    calls: true,
    mentions: true,
    sounds: authUser?.settings?.soundEnabled ?? true,
    desktop: false,
  })
  const [privacy, setPrivacy] = useState({
    readReceipts: true,
    typingIndicator: true,
    lastSeen: 'everyone',
  })
  const [selectedTheme, setSelectedTheme] = useState(authUser?.settings?.theme || 'dark')

  const handleSaveSettings = async () => {
    try {
      await axios.put('/api/auth/settings', {
        notifications: notifications.messages,
        soundEnabled: notifications.sounds,
        theme: selectedTheme,
      })
      toast.success('Settings saved')
    } catch (error) {
      toast.error('Failed to save settings')
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedImg(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      let result;
      if (!selectedImg) {
        result = await updateProfile({ fullName: name, bio })
      } else {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(selectedImg)
        })
        result = await updateProfile({ profilePic: base64, fullName: name, bio })
      }
      
      if (result?.success) {
        toast.success('Profile updated successfully!')
        navigate('/')
      } else {
        toast.error(result?.message || 'Failed to update profile')
      }
    } catch (error) {
      toast.error('Failed to update profile')
    }
    setIsLoading(false)
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
    { id: 'notifications', label: 'Notifications', icon: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0' },
    { id: 'privacy', label: 'Privacy', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
    { id: 'appearance', label: 'Appearance', icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z' },
  ]

  return (
    <div className="min-h-screen w-full overflow-y-auto relative" style={{ background: '#050510' }}>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>}>
        <LiquidGlass3DBackground>
        <div className="min-h-screen w-full overflow-y-auto custom-scrollbar relative" style={{ background: 'transparent' }}>
          <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
            <div className="chat-gradient-orb chat-gradient-orb-1 opacity-[0.03]" />
            <div className="chat-gradient-orb chat-gradient-orb-2 opacity-[0.03]" />
          </div>
          
          <div className="w-full max-w-2xl lg:max-w-4xl relative z-10 mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-8">
            <button 
              onClick={() => navigate('/')} 
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white cursor-pointer mb-4 md:mb-6 transition-all duration-300 hover:gap-3 group"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:-translate-x-1 transition-transform">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              <span className="hidden sm:inline">Back to chat</span>
              <span className="sm:hidden">Back</span>
            </button>

            <div className="glass-card rounded-2xl md:rounded-3xl overflow-hidden">
              <div className="flex overflow-x-auto gap-1 p-1.5 bg-surface-800/50">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 md:py-3 px-3 md:px-4 rounded-xl text-xs md:text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                      activeTab === tab.id 
                        ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/20' 
                        : 'text-zinc-400 hover:text-white hover:bg-surface-700/50'
                    }`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                      <path d={tab.icon} />
                    </svg>
                    <span className="hidden xs:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="p-4 md:p-6 lg:p-8">
                {activeTab === 'profile' && (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-5 md:gap-6">
                    <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 p-4 md:p-6 bg-surface-700/30 rounded-2xl border border-white/5">
                      <label htmlFor="avatar" className="cursor-pointer group relative">
                        <input
                          onChange={handleImageChange}
                          type="file"
                          id="avatar"
                          accept=".png, .jpg, .jpeg"
                          hidden
                        />
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-surface-600 relative ring-4 ring-primary/20 shadow-xl group-hover:ring-primary/40 transition-all">
                          <img
                            src={previewUrl || authUser?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(authUser?.fullName || 'U')}&background=6366f1&color=fff&size=96`}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                              <circle cx="12" cy="13" r="4"/>
                            </svg>
                          </div>
                        </div>
                      </label>
                      <div className="flex-1 text-center sm:text-left">
                        <p className="text-base md:text-lg font-semibold text-white">{authUser?.fullName}</p>
                        <p className="text-xs md:text-sm text-zinc-500">{authUser?.email}</p>
                        <label htmlFor="avatar" className="text-xs md:text-sm text-primary hover:text-primary-light cursor-pointer mt-2 inline-block transition-colors font-medium">
                          Change profile photo
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                        Display Name
                      </label>
                      <input
                        onChange={(e) => setName(e.target.value)}
                        value={name}
                        type="text"
                        required
                        className="w-full px-3 md:px-4 py-3 bg-surface-700/60 border border-white/5 rounded-xl text-sm text-white outline-none input-glow transition-all placeholder-zinc-500 focus:border-primary/50"
                        placeholder="Enter your display name"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 20h9"/>
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                        </svg>
                        Bio
                      </label>
                      <textarea
                        onChange={(e) => setBio(e.target.value)}
                        value={bio}
                        rows={3}
                        placeholder="Tell us about yourself..."
                        className="w-full px-3 md:px-4 py-3 bg-surface-700/60 border border-white/5 rounded-xl text-sm text-white placeholder-zinc-500 outline-none input-glow transition-all resize-none focus:border-primary/50"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 md:py-4 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl cursor-pointer hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 mt-2 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                      ) : (
                        <>
                          Save Changes
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:translate-x-1 transition-transform">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </>
                      )}
                    </button>
                  </form>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-3 md:space-y-4">
                    <h3 className="text-base md:text-lg font-semibold text-white mb-4 md:mb-6">Notification Preferences</h3>
                    
                    {[
                      { key: 'messages', label: 'Message Notifications', desc: 'Get notified for new messages' },
                      { key: 'calls', label: 'Call Notifications', desc: 'Notify about incoming calls' },
                      { key: 'mentions', label: 'Mentions', desc: 'Notify when someone mentions you' },
                      { key: 'sounds', label: 'Notification Sounds', desc: 'Play sounds for notifications' },
                      { key: 'desktop', label: 'Desktop Notifications', desc: 'Show desktop notifications' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-3 md:p-4 bg-surface-700/30 rounded-xl border border-white/5">
                        <div className="flex-1 min-w-0 mr-4">
                          <p className="text-sm font-medium text-white truncate">{item.label}</p>
                          <p className="text-xs text-zinc-500 mt-0.5 hidden sm:block">{item.desc}</p>
                        </div>
                        <button
                          onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                          className={`w-11 h-6 md:w-12 md:h-7 rounded-full transition-all duration-300 cursor-pointer flex-shrink-0 ${
                            notifications[item.key] ? 'bg-primary' : 'bg-surface-600'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                            notifications[item.key] ? 'translate-x-5 md:translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    ))}
                    <button onClick={handleSaveSettings} className="w-full py-3 mt-4 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-sm cursor-pointer hover:shadow-xl hover:shadow-primary/30 transition-all">
                      Save Notification Preferences
                    </button>
                  </div>
                )}

                {activeTab === 'privacy' && (
                  <div className="space-y-3 md:space-y-4">
                    <h3 className="text-base md:text-lg font-semibold text-white mb-4 md:mb-6">Privacy Settings</h3>
                    
                    {[
                      { key: 'readReceipts', label: 'Read Receipts', desc: 'Let others know when you\'ve read their messages' },
                      { key: 'typingIndicator', label: 'Typing Indicator', desc: 'Show when you\'re typing' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-3 md:p-4 bg-surface-700/30 rounded-xl border border-white/5">
                        <div className="flex-1 min-w-0 mr-4">
                          <p className="text-sm font-medium text-white">{item.label}</p>
                          <p className="text-xs text-zinc-500 mt-0.5 hidden sm:block">{item.desc}</p>
                        </div>
                        <button
                          onClick={() => setPrivacy(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                          className={`w-11 h-6 md:w-12 md:h-7 rounded-full transition-all duration-300 cursor-pointer flex-shrink-0 ${
                            privacy[item.key] ? 'bg-primary' : 'bg-surface-600'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                            privacy[item.key] ? 'translate-x-5 md:translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    ))}

                    <div className="p-3 md:p-4 bg-surface-700/30 rounded-xl border border-white/5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">Last Seen</p>
                          <p className="text-xs text-zinc-500 mt-0.5">Control who can see your last seen time</p>
                        </div>
                        <select 
                          value={privacy.lastSeen}
                          onChange={(e) => setPrivacy(prev => ({ ...prev, lastSeen: e.target.value }))}
                          className="px-3 py-2 bg-surface-700 border border-white/10 rounded-lg text-sm text-white outline-none cursor-pointer"
                        >
                          <option value="everyone">Everyone</option>
                          <option value="contacts">My Contacts</option>
                          <option value="none">Nobody</option>
                        </select>
                      </div>
                    </div>
                    <button onClick={handleSaveSettings} className="w-full py-3 mt-4 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-sm cursor-pointer hover:shadow-xl hover:shadow-primary/30 transition-all">
                      Save Privacy Settings
                    </button>
                  </div>
                )}

                {activeTab === 'appearance' && (
                  <div className="space-y-3 md:space-y-4">
                    <h3 className="text-base md:text-lg font-semibold text-white mb-4 md:mb-6">Appearance Settings</h3>
                    
                    <div className="p-3 md:p-4 bg-surface-700/30 rounded-xl border border-white/5">
                      <p className="text-sm font-medium text-white mb-3 md:mb-4">Theme</p>
                      <div className="grid grid-cols-3 gap-2 md:gap-3">
                        {[
                          { id: 'dark', label: 'Dark', color: 'from-zinc-900 to-zinc-800' },
                          { id: 'light', label: 'Light', color: 'from-zinc-100 to-zinc-200' },
                          { id: 'system', label: 'System', color: 'from-surface-700 to-surface-600' },
                        ].map((theme) => (
                          <button key={theme.id} onClick={() => setSelectedTheme(theme.id)} className={`p-2 md:p-4 rounded-xl bg-gradient-to-br border-2 transition-all cursor-pointer group ${selectedTheme === theme.id ? 'border-primary' : 'border-transparent hover:border-primary/50'}`}>
                            <div className={`w-full h-8 md:h-12 rounded-lg bg-gradient-to-br ${theme.color} mb-1 md:mb-2 group-hover:scale-105 transition-transform`} />
                            <p className="text-xs text-zinc-400 group-hover:text-white">{theme.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 md:p-4 bg-surface-700/30 rounded-xl border border-white/5">
                      <p className="text-sm font-medium text-white mb-3 md:mb-4">Accent Color</p>
                      <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2">
                        {['#6366f1', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#ec4899'].map((color) => (
                          <button
                            key={color}
                            className={`w-8 h-8 md:w-10 md:h-10 rounded-xl transition-all duration-200 cursor-pointer hover:scale-110 flex-shrink-0 ${
                              color === '#6366f1' ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-800' : ''
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <button onClick={handleSaveSettings} className="w-full py-3 mt-4 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-sm cursor-pointer hover:shadow-xl hover:shadow-primary/30 transition-all">
                      Save Appearance
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 md:mt-6 p-4 md:p-6 glass-card rounded-2xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">Danger Zone</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Permanently delete your account and all data</p>
                </div>
                <button className="w-full sm:w-auto px-4 md:px-5 py-2.5 rounded-xl bg-danger/10 text-danger text-sm font-medium hover:bg-danger/20 transition-all border border-danger/20 cursor-pointer flex-shrink-0">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
        </LiquidGlass3DBackground>
      </Suspense>
    </div>
  )
}

export default ProfilePage
