import React from 'react';
import { useChat, useTheme } from '../../context';
import ChatContainer from '../components/ChatContainer';
import RightSidebar from '../components/RightSidebar';
import Sidebar from '../components/Sidebar';

const HomePage = () => {
  const { selectedUser } = useChat();
  const { isDark } = useTheme();

  return (
    <main className='app-shell min-h-screen p-3 sm:p-5'>
      <div className={`frost-panel surface-border relative mx-auto flex h-[calc(100vh-1.5rem)] max-w-[1660px] flex-col overflow-hidden rounded-[40px] sm:h-[calc(100vh-2.5rem)] ${isDark ? 'bg-slate-950/54 text-white' : 'bg-white/76 text-slate-900'}`}>
        <div className='pointer-events-none absolute inset-0 opacity-90'>
          <div className={`absolute left-[-8%] top-[-10%] h-56 w-56 rounded-full blur-3xl ${isDark ? 'bg-sky-400/12' : 'bg-sky-300/20'}`} />
          <div className={`absolute right-[-6%] top-[10%] h-64 w-64 rounded-full blur-3xl ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-300/18'}`} />
          <div className={`absolute bottom-[-12%] left-[40%] h-60 w-60 rounded-full blur-3xl ${isDark ? 'bg-teal-400/10' : 'bg-teal-200/22'}`} />
        </div>

        <div className={`halo-divider px-5 py-4 sm:px-7 sm:py-5 ${isDark ? 'bg-slate-950/38 text-white' : 'bg-white/42 text-slate-900'}`}>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
            <div>
              <p className='section-kicker'>Secure messaging workspace</p>
              <h2 className='mt-2 text-xl font-semibold sm:text-2xl'>Focused conversations, cleaner navigation, and faster decisions.</h2>
              <p className={`mt-2 max-w-2xl text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Everything in the workspace is organised around one goal: helping you find the right conversation quickly and act without friction.
              </p>
            </div>

            <div className='grid gap-2 sm:grid-cols-3 lg:min-w-[460px]'>
              {[
                { label: 'Workspace', value: selectedUser ? 'Active thread' : 'Inbox view' },
                { label: 'Current focus', value: selectedUser ? selectedUser.fullName : 'Select a chat' },
                { label: 'Connection', value: 'Online' },
              ].map((item) => (
                <div key={item.label} className={`surface-border rounded-[22px] px-4 py-3 ${isDark ? 'bg-white/5' : 'bg-white/68'}`}>
                  <p className={`text-[11px] uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.label}</p>
                  <p className='mt-2 text-sm font-semibold'>{item.value}</p>
                </div>
              ))}
            </div>
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
