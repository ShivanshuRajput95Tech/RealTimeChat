import React, { useContext } from 'react';
import Sidebar from '../components/Sidebar';
import ChatContainer from '../components/ChatContainer';
import RightSidebar from '../components/RightSidebar';
import { ChatContext } from '../../context/ChatContext';
import { ThemeContext } from '../../context/ThemeContext';

const HomePage = () => {
  const { selectedUser } = useContext(ChatContext);
  const { isDark } = useContext(ThemeContext);

  return (
    <main className={`min-h-screen p-3 sm:p-5 ${isDark ? 'bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.15),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.16),transparent_38%),linear-gradient(160deg,#020617,#0f172a_42%,#111827)]' : 'bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.35),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(196,181,253,0.45),transparent_38%),linear-gradient(180deg,#f8fafc,#eef2ff)]'}`}>
      <div className={`mx-auto flex h-[calc(100vh-1.5rem)] max-w-[1600px] flex-col overflow-hidden rounded-[34px] border shadow-[0_30px_90px_rgba(15,23,42,0.22)] backdrop-blur-xl sm:h-[calc(100vh-2.5rem)] ${isDark ? 'border-white/10 bg-slate-950/45' : 'border-white bg-white/70'}`}>
        <div className={`hidden items-center justify-between border-b px-6 py-4 lg:flex ${isDark ? 'border-white/10 bg-slate-900/45 text-white' : 'border-slate-200 bg-white/60 text-slate-900'}`}>
          <div>
            <p className={`text-[11px] uppercase tracking-[0.22em] ${isDark ? 'text-cyan-300' : 'text-cyan-600'}`}>Latest UI refresh</p>
            <h2 className='mt-1 text-lg font-semibold'>Refined design, same synchronized chat flow</h2>
          </div>
          <div className='flex items-center gap-3'>
            <div className={`rounded-full px-3 py-1 text-xs font-medium ${isDark ? 'bg-white/6 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
              {selectedUser ? `Chatting with ${selectedUser.fullName}` : 'Select a conversation'}
            </div>
          </div>
        </div>

        <div className={`grid min-h-0 flex-1 ${selectedUser ? 'grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)_340px]' : 'grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]'}`}>
          <Sidebar />
          <ChatContainer />
          <RightSidebar />
        </div>
      </div>
    </main>
  );
};

export default HomePage;
