import React, { useState, useContext, Suspense } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'

const AdminDashboard = () => {
  const { authUser } = useContext(AuthContext)
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('read')

  // Simple admin check - require email containing 'admin'
  if (!authUser || !authUser.email?.includes('admin')) {
    return <Navigate to="/" replace />
  }

  const tabs = [
    { id: 'read', label: 'Read', icon: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z' },
    { id: 'review', label: 'Review', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z' },
    { id: 'analysis', label: 'Analysis', icon: 'M18 20V10M12 20V4M6 20v-6' },
    { id: 'update', label: 'Update', icon: 'M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8' },
    { id: 'manage', label: 'Manage', icon: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z' },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'read':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Read Logs & Messages</h3>
            <p className="text-zinc-400">View system logs, message history, and activity reports.</p>
            <div className="bg-surface-700/30 rounded-xl p-4 border border-white/[0.04]">
              <p className="text-zinc-500 text-sm">Log viewer coming soon...</p>
            </div>
          </div>
        )
      case 'review':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Review Reported Content</h3>
            <p className="text-zinc-400">Moderate reported messages, users, and content.</p>
            <div className="bg-surface-700/30 rounded-xl p-4 border border-white/[0.04]">
              <p className="text-zinc-500 text-sm">Review queue is empty.</p>
            </div>
          </div>
        )
      case 'analysis':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Analytics Dashboard</h3>
            <p className="text-zinc-400">View platform analytics, usage statistics, and insights.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-surface-700/30 rounded-xl p-4 border border-white/[0.04]">
                <p className="text-zinc-500 text-sm">Messages per day chart placeholder</p>
              </div>
              <div className="bg-surface-700/30 rounded-xl p-4 border border-white/[0.04]">
                <p className="text-zinc-500 text-sm">Active users chart placeholder</p>
              </div>
            </div>
          </div>
        )
      case 'update':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Update System Settings</h3>
            <p className="text-zinc-400">Configure platform settings, features, and integrations.</p>
            <div className="bg-surface-700/30 rounded-xl p-4 border border-white/[0.04]">
              <p className="text-zinc-500 text-sm">Settings panel coming soon...</p>
            </div>
          </div>
        )
      case 'manage':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Manage Users & Permissions</h3>
            <p className="text-zinc-400">Add, remove, or modify user roles and permissions.</p>
            <div className="bg-surface-700/30 rounded-xl p-4 border border-white/[0.04]">
              <p className="text-zinc-500 text-sm">User management interface coming soon...</p>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen w-full overflow-y-auto relative" style={{ background: '#050510' }}>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>}>
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

              <div className="p-4 md:p-6">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      </Suspense>
    </div>
  )
}

export default AdminDashboard