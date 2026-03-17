import React, { useContext } from 'react'
import Sidebar from '../components/Sidebar'
import ChatContainer from '../components/ChatContainer'
import RightSidebar from '../components/RightSidebar'
import { ChatContext } from '../../context/ChatContext'
import { ThemeContext } from '../../context/ThemeContext'

const HomePage = () => {
  const { selectedUser } = useContext(ChatContext)
  const { isDark } = useContext(ThemeContext)

  return (
    <main className={`min-h-screen ${isDark ? 'bg-[radial-gradient(circle_at_10%_30%,rgba(56,189,248,0.15),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.14),transparent_45%),#0b1225]' : 'bg-gradient-to-br from-slate-50 to-slate-100'} p-4 sm:p-8`}>
      <div className={`mx-auto w-full max-w-[1400px] h-[calc(100vh-2rem)] rounded-3xl overflow-hidden ${isDark ? 'border-white/10' : 'border-slate-300'} border shadow-2xl backdrop-blur-lg`}>
        <div className={`grid h-full ${selectedUser ? 'grid-cols-1 md:grid-cols-[1fr_1.8fr_1fr]' : 'grid-cols-1 md:grid-cols-[1fr_1.6fr]'}`}>
          <Sidebar />
          <ChatContainer />
          <RightSidebar />
        </div>
      </div>
    </main>
  )
}

export default HomePage
