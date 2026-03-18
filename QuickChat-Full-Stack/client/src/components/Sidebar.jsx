import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useChat, useTheme } from '../../context';
import UserCard from './ui/UserCard';

const Sidebar = () => {
  const {
    users,
    selectedUser,
    setSelectedUser,
    unseenMessages,
    setUnseenMessages,
    isUsersLoading,
  } = useChat();

  const { authUser, logout, onlineUsers } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [query, setQuery] = useState('');
  const [showDashboard, setShowDashboard] = useState(false);
  const navigate = useNavigate();

  const filteredUsers = useMemo(() => {
    if (!query) return users;
    const value = query.toLowerCase().trim();
    return users.filter((user) => user.fullName.toLowerCase().includes(value));
  }, [query, users]);

  const totalUnseen = useMemo(() => {
    return Object.values(unseenMessages).reduce((a, b) => a + (b || 0), 0);
  }, [unseenMessages]);

  const onlineCount = useMemo(() => onlineUsers.length, [onlineUsers]);

  const onSelectUser = (user) => {
    setSelectedUser(user);
    setShowDashboard(false);
    setUnseenMessages((prev) => ({ ...prev, [user._id]: 0 }));
  };

  const handleLogout = () => {
    setShowDashboard(false);
    logout();
  };

  return (
    <aside className={`h-full border-r p-4 md:p-5 ${selectedUser ? 'hidden md:flex' : 'flex'} flex-col ${isDark ? 'border-white/10 bg-gradient-to-b from-slate-900/60 via-slate-900/35 to-slate-950/35' : 'border-slate-200 bg-gradient-to-b from-white via-slate-50 to-slate-100/80'}`}>
      <div className={`rounded-[30px] border p-4 shadow-xl backdrop-blur-xl ${isDark ? 'border-white/10 bg-slate-900/60' : 'border-white bg-white/90'}`}>
        <div className='flex items-start justify-between gap-3'>
          <div>
            <p className={`text-[11px] uppercase tracking-[0.22em] ${isDark ? 'text-cyan-300' : 'text-cyan-600'}`}>Professional messaging</p>
            <h1 className={`mt-2 text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Chatify</h1>
            <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Enterprise-ready UI with the same trusted logic.</p>
          </div>

          <div className='flex gap-1'>
            <button
              type='button'
              onClick={toggleTheme}
              className={`rounded-xl p-2 text-sm transition ${isDark ? 'bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25' : 'bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/25'}`}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            <button
              type='button'
              onClick={() => navigate('/profile')}
              className={`rounded-xl p-2 text-sm transition ${isDark ? 'bg-violet-500/15 text-violet-300 hover:bg-violet-500/25' : 'bg-violet-500/15 text-violet-700 hover:bg-violet-500/25'}`}
              title='Profile'
            >
              👤
            </button>
          </div>
        </div>

        <div className='mt-4 grid grid-cols-3 gap-2'>
          {[
            { label: 'Friends', value: users.length },
            { label: 'Online', value: onlineCount },
            { label: 'Unread', value: totalUnseen },
          ].map((item) => (
            <div key={item.label} className={`rounded-2xl border px-3 py-2 ${isDark ? 'border-white/8 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
              <p className={`text-[10px] uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.label}</p>
              <p className={`mt-1 text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className='mt-4 flex gap-2'>
        <button
          type='button'
          onClick={() => setShowDashboard(!showDashboard)}
          className={`flex-1 rounded-2xl px-3 py-2 text-xs font-semibold transition ${
            showDashboard
              ? 'bg-gradient-to-r from-violet-500 to-cyan-500 text-white shadow-lg'
              : isDark
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-white text-slate-700 shadow hover:bg-slate-50'
          }`}
        >
          {showDashboard ? 'Close overview' : 'Overview'}
        </button>
        <button
          type='button'
          onClick={handleLogout}
          className='flex-1 rounded-2xl bg-rose-500/85 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-600'
        >
          Sign out
        </button>
      </div>

      {showDashboard ? (
        <div className='mt-4 flex-1 space-y-3 overflow-y-auto'>
          <div className={`rounded-[26px] border p-4 ${isDark ? 'border-white/8 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
            <p className={`text-[11px] uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Account</p>
            <p className={`mt-2 text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{authUser?.fullName}</p>
            <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{authUser?.email}</p>
          </div>

          <div className={`rounded-[26px] border p-4 ${isDark ? 'border-white/8 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
            <p className={`text-[11px] uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Status</p>
            <div className='mt-3 space-y-2'>
              {[
                `${onlineCount} contact${onlineCount === 1 ? '' : 's'} online now`,
                `${totalUnseen} unread message${totalUnseen === 1 ? '' : 's'} waiting`,
                authUser?.bio ? 'Profile bio added' : 'Add a bio for a richer profile',
              ].map((item) => (
                <div key={item} className={`rounded-2xl px-3 py-2 text-sm ${isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className={`mt-4 flex items-center gap-2 rounded-[24px] border px-4 py-3 ${isDark ? 'border-white/8 bg-slate-900/55' : 'border-slate-200 bg-white'}`}>
            <svg className={`h-4 w-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} fill='currentColor' viewBox='0 0 20 20'>
              <path fillRule='evenodd' d='M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z' clipRule='evenodd'/>
            </svg>
            <input
              type='search'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Search contacts...'
              className={`w-full bg-transparent text-sm outline-none ${isDark ? 'text-white placeholder-slate-400' : 'text-slate-900 placeholder-slate-500'}`}
            />
          </div>

          <div className='mt-3 flex items-center justify-between px-1'>
            <p className={`text-[11px] uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Conversations</p>
            <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{filteredUsers.length} shown</span>
          </div>

          <section className='mt-3 flex-1 space-y-2 overflow-y-auto'>
            {isUsersLoading && (
              <div className='space-y-2'>
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className={`h-20 animate-pulse rounded-2xl ${isDark ? 'bg-slate-800/70' : 'bg-slate-200/70'}`} />
                ))}
              </div>
            )}

            {!isUsersLoading && filteredUsers.length === 0 && (
              <div className={`rounded-[26px] border px-4 py-8 text-center text-sm ${isDark ? 'border-white/8 bg-slate-900/60 text-slate-400' : 'border-slate-200 bg-white text-slate-500'}`}>
                {query ? 'No contacts matched your search.' : 'No users available yet.'}
              </div>
            )}

            {!isUsersLoading && filteredUsers.map((user) => {
              const online = onlineUsers.includes(user._id);
              const unseen = unseenMessages[user._id] || 0;

              return (
                <UserCard
                  key={user._id}
                  user={user}
                  online={online}
                  unseen={unseen}
                  selected={selectedUser?._id === user._id}
                  onSelect={onSelectUser}
                />
              );
            })}
          </section>
        </>
      )}
    </aside>
  );
};

export default Sidebar;
