import React from 'react';
import { useChat, useTheme } from '../../context';
import ChatContainer from '../components/ChatContainer';
import RightSidebar from '../components/RightSidebar';
import Sidebar from '../components/Sidebar';
import WorkspaceRail from '../components/WorkspaceRail';

const HomePage = () => {
  const { selectedUser } = useChat();
  const { isDark } = useTheme();

  return (
    <main className='app-shell min-h-screen p-3 sm:p-4'>
      <div className={`frost-panel surface-border relative mx-auto flex h-[calc(100vh-1.5rem)] max-w-[1750px] overflow-hidden rounded-[40px] sm:h-[calc(100vh-2rem)] ${isDark ? 'bg-slate-950/62 text-white' : 'bg-white/82 text-slate-900'}`}>
        <div className='pointer-events-none absolute inset-0 opacity-90'>
          <div className={`absolute left-[-8%] top-[-10%] h-56 w-56 rounded-full blur-3xl ${isDark ? 'bg-sky-400/12' : 'bg-sky-300/18'}`} />
          <div className={`absolute right-[-4%] top-[8%] h-64 w-64 rounded-full blur-3xl ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-300/18'}`} />
          <div className={`absolute bottom-[-12%] left-[40%] h-60 w-60 rounded-full blur-3xl ${isDark ? 'bg-teal-400/10' : 'bg-teal-200/22'}`} />
        </div>

        <div className='relative z-10 flex min-h-0 flex-1 overflow-hidden'>
          <WorkspaceRail />
          <div className={`grid min-h-0 flex-1 overflow-hidden ${selectedUser ? 'grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)_320px]' : 'grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)]'}`}>
            <Sidebar />
            <ChatContainer />
            <RightSidebar />
          </div>
        </div>
      </div>
    </main>
  );
};

export default HomePage;
