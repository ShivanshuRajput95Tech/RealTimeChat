import React, { useContext, useEffect, useMemo, useState } from 'react'
import assets from '../assets/assets'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'
import { ThemeContext } from '../../context/ThemeContext'

const RightSidebar = () => {
  const { selectedUser, messages } = useContext(ChatContext)
  const { authUser, onlineUsers } = useContext(AuthContext)
  const { isDark } = useContext(ThemeContext)

  const msgImages = useMemo(() => messages.filter((msg) => msg.image).map((msg) => msg.image), [messages])
  
  const totalMessages = useMemo(() => messages.length, [messages])
  const myMessageCount = useMemo(() => messages.filter(msg => msg.senderId === authUser._id).length, [messages, authUser])

  if (!selectedUser) return null

  const isOnline = onlineUsers.includes(selectedUser._id)
  const joinDate = new Date(selectedUser.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <aside className={`h-full overflow-y-auto flex flex-col ${isDark ? 'bg-gradient-to-b from-slate-900/40 to-slate-950/40 text-white border-white/10' : 'bg-gradient-to-b from-slate-50 to-white text-slate-900 border-slate-300'} p-4 border-l max-md:hidden scrollbar-thin ${isDark ? 'scrollbar-thumb-slate-600 scrollbar-track-slate-800' : 'scrollbar-thumb-slate-300 scrollbar-track-slate-100'}`}>
      
      {/* Profile Section */}
      <div className={`${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} border rounded-xl p-4 mb-4`}>
        <div className='flex flex-col items-center gap-3'>
          <div className='relative group'>
            <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gradient-to-r from-cyan-400 to-blue-400'} rounded-full blur-lg opacity-50 group-hover:opacity-75 transition`}/>
            <img
              src={selectedUser.profilePic || assets.avatar_icon}
              alt='profile'
              className='relative w-24 h-24 rounded-full border-4 border-white/20 object-cover shadow-lg'
            />
            <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-2 border-white ring-1 ring-white/30 ${isOnline ? (isDark ? 'bg-emerald-500' : 'bg-emerald-400') : (isDark ? 'bg-slate-500' : 'bg-slate-400')}`}/>
          </div>
          
          <div className='text-center'>
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedUser.fullName}</h3>
            <span className={`text-xs px-3 py-1 rounded-full inline-block mt-2 font-semibold ${
              isOnline 
                ? isDark ? 'bg-emerald-500/30 text-emerald-200' : 'bg-emerald-100 text-emerald-700'
                : isDark ? 'bg-slate-700/40 text-slate-300' : 'bg-slate-200 text-slate-600'
            }`}>
              {isOnline ? '🟢 Online' : '⚫ Offline'}
            </span>
          </div>
          
          {selectedUser.bio && (
            <p className={`text-sm text-center italic ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>"{selectedUser.bio}"</p>
          )}
        </div>
      </div>

      {/* Stats Section */}
      <div className={`${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} border rounded-xl p-4 mb-4`}>
        <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Conversation Stats
        </h4>
        <div className='grid grid-cols-2 gap-2'>
          <div className={`${isDark ? 'bg-slate-700/50' : 'bg-slate-100'} rounded-lg p-2 text-center`}>
            <p className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{totalMessages}</p>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Total Messages</p>
          </div>
          <div className={`${isDark ? 'bg-slate-700/50' : 'bg-slate-100'} rounded-lg p-2 text-center`}>
            <p className={`text-2xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{myMessageCount}</p>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Your Messages</p>
          </div>
        </div>
      </div>

      {/* Shared Media Section */}
      <div className={`${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} border rounded-xl p-4 mb-4`}>
        <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Shared Media ({msgImages.length})
        </h4>
        {msgImages.length === 0 ? (
          <div className={`text-center py-4 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            <p className='text-sm'>📸 No shared photos yet</p>
          </div>
        ) : (
          <div className='grid grid-cols-2 gap-2 max-h-32 overflow-y-auto'>
            {msgImages.slice(0, 6).map((image, index) => (
              <button
                key={`${image}-${index}`}
                onClick={() => window.open(image, '_blank')}
                className={`h-20 overflow-hidden rounded-lg border transition-transform hover:scale-105 cursor-pointer ${isDark ? 'border-white/10 hover:border-white/30' : 'border-slate-300 hover:border-slate-400'}`}
                title='Click to view full image'
              >
                <img src={image} alt='shared' className='h-full w-full object-cover' />
              </button>
            ))}
          </div>
        )}
        {msgImages.length > 6 && (
          <p className={`text-xs text-center mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            +{msgImages.length - 6} more
          </p>
        )}
      </div>

      {/* Info Section */}
      <div className={`${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} border rounded-xl p-4 mb-auto`}>
        <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Profile Info
        </h4>
        <div className='space-y-2 text-xs'>
          <div className='flex justify-between items-center'>
            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Member since</span>
            <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{joinDate}</span>
          </div>
          <div className='flex justify-between items-center'>
            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Status</span>
            <span className={`font-semibold ${isOnline ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-slate-400' : 'text-slate-600')}`}>
              {isOnline ? 'Active Now' : 'Offline'}
            </span>
          </div>
          <div className='flex justify-between items-center'>
            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Email</span>
            <span className={`font-semibold text-xs truncate ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
              {selectedUser.email}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default RightSidebar
