import React from 'react';
import { useChat, useTheme } from '../../context';
import ChatContainer from '../components/ChatContainer';
import RightSidebar from '../components/RightSidebar';
import Sidebar from '../components/Sidebar';

const HomePage = () => {
  const { selectedUser } = useChat();
  const { isDark } = useTheme();

  return (
    <main className='app-shell min-h-screen p-3 sm:p-4'>
      <div className={`frost-panel surface-border relative mx-auto flex h-[calc(100vh-1.5rem)] max-w-[1820px] overflow-hidden rounded-[36px] sm:h-[calc(100vh-2rem)] ${isDark ? 'bg-slate-950/52 text-white' : 'bg-white/80 text-slate-900'}`}>
        <div className='pointer-events-none absolute inset-0 opacity-80'>
          <div className={`absolute left-[-8%] top-[-8%] h-56 w-56 rounded-full blur-3xl ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-200/24'}`} />
          <div className={`absolute right-[12%] top-[4%] h-64 w-64 rounded-full blur-3xl ${isDark ? 'bg-sky-400/10' : 'bg-sky-200/22'}`} />
          <div className={`absolute bottom-[-12%] left-[45%] h-72 w-72 rounded-full blur-3xl ${isDark ? 'bg-teal-400/10' : 'bg-teal-100/30'}`} />
        </div>

        <div className={`relative z-10 grid min-h-0 flex-1 overflow-hidden ${selectedUser ? 'grid-cols-1 lg:grid-cols-[430px_minmax(0,1fr)_92px]' : 'grid-cols-1 lg:grid-cols-[430px_minmax(0,1fr)_92px]'}`}>
          <Sidebar />
          <ChatContainer />
          <RightSidebar />
        </div>
      </div>
    </main>
  );
};

export default HomePage;
