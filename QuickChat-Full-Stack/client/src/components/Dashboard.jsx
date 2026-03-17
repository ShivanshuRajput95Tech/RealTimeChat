import React, { useContext, useMemo } from 'react'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'
import { ThemeContext } from '../../context/ThemeContext'

const Dashboard = () => {
  const { users, messages, unseenMessages } = useContext(ChatContext)
  const { authUser, onlineUsers } = useContext(AuthContext)
  const { isDark } = useContext(ThemeContext)

  // Calculate statistics
  const stats = useMemo(() => {
    const totalMessages = messages.length
    const totalUnseen = Object.values(unseenMessages).reduce((a, b) => a + (b || 0), 0)
    const onlineCount = onlineUsers.length
    const totalUsers = users.length

    return {
      totalMessages,
      totalUnseen,
      onlineCount,
      totalUsers,
    }
  }, [messages, unseenMessages, onlineUsers, users])

  const StatCard = ({ icon, label, value, color }) => (
    <div className={`${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} border rounded-xl p-4 backdrop-blur-sm`}>
      <div className='flex items-center justify-between'>
        <div>
          <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {label}
          </p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>
            {value}
          </p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
          color === 'text-green-400' ? 'bg-green-500/20' :
          color === 'text-blue-400' ? 'bg-blue-500/20' :
          color === 'text-purple-400' ? 'bg-purple-500/20' :
          'bg-orange-500/20'
        }`}>
          {icon}
        </div>
      </div>
    </div>
  )

  return (
    <div className={`p-4 space-y-4`}>
      {/* Welcome Header */}
      <div className={`${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} border rounded-xl p-6 backdrop-blur-sm`}>
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Welcome back, {authUser?.fullName?.split(' ')[0]}! 👋
        </h2>
        <p className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Here's your messaging activity overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
        <StatCard
          icon='📞'
          label='Active Chats'
          value={stats.totalUsers}
          color='text-purple-400'
        />
        <StatCard
          icon='💬'
          label='Total Messages'
          value={stats.totalMessages}
          color='text-blue-400'
        />
        <StatCard
          icon='🔔'
          label='Unread Messages'
          value={stats.totalUnseen}
          color='text-orange-400'
        />
        <StatCard
          icon='🟢'
          label='Online Friends'
          value={stats.onlineCount}
          color='text-green-400'
        />
      </div>

      {/* Activity Summary */}
      <div className={`${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} border rounded-xl p-6 backdrop-blur-sm`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Quick Tips
        </h3>
        <ul className={`space-y-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          <li className='flex items-start gap-2'>
            <span className='text-green-500 mt-0.5'>✓</span>
            <span>Your profile is {authUser?.bio ? 'complete' : 'incomplete'}. Add a bio to help friends know you better.</span>
          </li>
          <li className='flex items-start gap-2'>
            <span className='text-blue-500 mt-0.5'>→</span>
            <span>You have {stats.totalUnseen} unread message{stats.totalUnseen !== 1 ? 's' : ''}.</span>
          </li>
          <li className='flex items-start gap-2'>
            <span className='text-purple-500 mt-0.5'>⚡</span>
            <span>{stats.onlineCount} of your friends are online right now.</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default Dashboard
