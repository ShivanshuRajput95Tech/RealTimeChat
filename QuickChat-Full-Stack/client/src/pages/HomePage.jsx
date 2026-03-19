import React from 'react';
import Sidebar from '../components/Sidebar';
import ChatContainer from '../components/ChatContainer';
import RightSidebar from '../components/RightSidebar';
import { useChat, useTheme } from '../../context';

const HomePage = () => {
  const { selectedUser } = useChat();
  const { isDark } = useTheme();

  return (
    <main className='app-shell min-h-screen p-3 sm:p-5'>
      <div className={`frost-panel relative mx-auto flex h-[calc(100vh-1.5rem)] max-w-[1640px] flex-col overflow-hidden rounded-[40px] border sm:h-[calc(100vh-2.5rem)] ${isDark ? 'border-white/10 bg-slate-950/50' : 'border-white/70 bg-white/72'}`}>
        <div className='pointer-events-none absolute inset-0 opacity-90'>
          <div className={`absolute left-[-8%] top-[-10%] h-56 w-56 rounded-full blur-3xl ${isDark ? 'bg-cyan-400/12' : 'bg-cyan-300/20'}`} />
          <div className={`absolute right-[-6%] top-[10%] h-64 w-64 rounded-full blur-3xl ${isDark ? 'bg-violet-500/14' : 'bg-violet-300/24'}`} />
          <div className={`absolute bottom-[-12%] left-[40%] h-60 w-60 rounded-full blur-3xl ${isDark ? 'bg-emerald-400/10' : 'bg-emerald-200/25'}`} />
        </div>

        <div className={`halo-divider hidden items-center justify-between px-7 py-5 lg:flex ${isDark ? 'bg-slate-950/35 text-white' : 'bg-white/40 text-slate-900'}`}>
          <div>
            <p className={`text-[11px] uppercase tracking-[0.24em] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Secure messaging workspace</p>
            <h2 className='mt-2 text-xl font-semibold'>Professional real-time conversations, organised for focus.</h2>
          </div>
          <div className='flex items-center gap-3'>
            <div className={`rounded-full border px-4 py-2 text-xs font-medium ${isDark ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white/70 text-slate-600'}`}>
              {selectedUser ? `Chatting with ${selectedUser.fullName}` : 'Select a chat to get started'}
            </div>
            <div className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${isDark ? 'bg-emerald-400/10 text-emerald-200' : 'bg-emerald-50 text-emerald-700'}`}>Online</div>
          </div>
        </div>

        <div className={`relative z-10 grid min-h-0 flex-1 overflow-hidden ${selectedUser ? 'grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)_360px]' : 'grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)]'}`}>
          <Sidebar />
          <ChatContainer />
          <RightSidebar />
        </div>
      </div>
    </main>
  );
};

export default HomePage;
