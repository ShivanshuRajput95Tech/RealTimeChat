import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useChat, useTheme } from '../../context';
import assets from '../assets/assets';
import Dashboard from './Dashboard';
import UserCard from './ui/UserCard';

const Sidebar = () => {
  const {
    users,
    selectedUser,
    setSelectedUser,
    searchUsers,
    unseenMessages,
    setUnseenMessages,
    isSearchingUsers,
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
    return users.filter((user) => {
      return [user.fullName, user.email, user.bio]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(value));
    });
  }, [query, users]);

  const organizedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const aSelected = selectedUser?._id === a._id ? 1 : 0;
      const bSelected = selectedUser?._id === b._id ? 1 : 0;
      if (aSelected !== bSelected) return bSelected - aSelected;

      const aUnseen = unseenMessages[a._id] || 0;
      const bUnseen = unseenMessages[b._id] || 0;
      if (aUnseen !== bUnseen) return bUnseen - aUnseen;

      const aOnline = onlineUsers.includes(a._id) ? 1 : 0;
      const bOnline = onlineUsers.includes(b._id) ? 1 : 0;
      if (aOnline !== bOnline) return bOnline - aOnline;

      return a.fullName.localeCompare(b.fullName);
    });
  }, [filteredUsers, onlineUsers, selectedUser?._id, unseenMessages]);

  const totalUnseen = useMemo(() => Object.values(unseenMessages).reduce((a, b) => a + (b || 0), 0), [unseenMessages]);
  const onlineCount = useMemo(() => onlineUsers.length, [onlineUsers]);
  const statusUsers = useMemo(() => users.slice(0, 5), [users]);

  const onSelectUser = (user) => {
    setSelectedUser(user);
    setShowDashboard(false);
    setUnseenMessages((prev) => ({ ...prev, [user._id]: 0 }));
  };

  const handleLogout = () => {
    setShowDashboard(false);
    logout();
  };

  useEffect(() => {
    if (showDashboard) return undefined;

    const timeout = setTimeout(() => {
      searchUsers(query);
    }, query.trim() ? 250 : 0);

    return () => clearTimeout(timeout);
  }, [query, searchUsers, showDashboard]);

  return (
    <aside className={`min-h-0 h-full border-r p-3 sm:p-4 ${selectedUser ? 'hidden lg:flex' : 'flex'} flex-col ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200/80 bg-slate-50/35'}`}>
      <div className={`frost-panel rounded-[32px] border ${isDark ? 'border-white/10 bg-slate-900/70' : 'border-white/80 bg-white/88'}`}>
        <div className='flex items-center justify-between gap-3 px-5 py-5'>
          <div className='flex items-center gap-3'>
            <img
              src={authUser?.profilePic || assets.avatar_icon}
              alt='Current user'
              className={`h-16 w-16 rounded-[26px] object-cover ${isDark ? 'border border-white/10' : 'border border-slate-200'}`}
            />
            <div className='min-w-0'>
              <h1 className={`truncate text-[1.8rem] font-semibold ${isDark ? 'text-white' : 'text-slate-950'}`}>{authUser?.fullName}</h1>
              <p className={`truncate text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{authUser?.bio || 'Available for chat'}</p>
            </div>
          </div>

          <button
            type='button'
            onClick={() => setShowDashboard((prev) => !prev)}
            className={`flex h-14 w-14 items-center justify-center rounded-[22px] ${isDark ? 'bg-emerald-500/10 text-emerald-200' : 'bg-emerald-50 text-emerald-700'}`}
            title={showDashboard ? 'Close overview' : 'Open overview'}
          >
            <svg className='h-6 w-6' fill='none' stroke='currentColor' strokeWidth='1.8' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' d='M12 5v14m7-7H5' />
            </svg>
          </button>
        </div>

        <div className={`border-t px-5 py-5 ${isDark ? 'border-white/8' : 'border-slate-200'}`}>
          <div className='flex items-center justify-between'>
            <h2 className='text-2xl font-semibold'>Status</h2>
            <button type='button' className='text-sm font-medium text-emerald-500'>View all</button>
          </div>

          <div className='mt-4 flex gap-4 overflow-x-auto pb-1'>
            {statusUsers.map((user) => {
              const online = onlineUsers.includes(user._id);
              return (
                <button key={user._id} type='button' onClick={() => onSelectUser(user)} className='shrink-0 text-center'>
                  <div className={`relative mx-auto h-[72px] w-[72px] rounded-full border-2 p-0.5 ${online ? 'border-emerald-500' : isDark ? 'border-slate-700' : 'border-slate-300'}`}>
                    <img src={user.profilePic || assets.avatar_icon} alt={user.fullName} className='h-full w-full rounded-full object-cover' />
                    <span className={`absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 ${isDark ? 'border-slate-900' : 'border-white'} ${online ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                  </div>
                  <p className={`mt-2 w-20 truncate text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{user.fullName.split(' ')[0]}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className={`border-t px-5 py-5 ${isDark ? 'border-white/8' : 'border-slate-200'}`}>
          <div className='flex items-center justify-between'>
            <h2 className='text-2xl font-semibold'>Message ({organizedUsers.length})</h2>
            <button
              type='button'
              onClick={toggleTheme}
              className={`flex h-12 w-12 items-center justify-center rounded-full ${isDark ? 'bg-white/8 text-white' : 'bg-slate-100 text-slate-700'}`}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>

          <div className='mt-4 flex gap-2'>
            {['Chat', 'Call', 'Contact'].map((item, index) => (
              <button
                key={item}
                type='button'
                className={`rounded-full px-4 py-2.5 text-sm font-semibold ${index === 0 ? 'bg-emerald-500 text-white shadow-lg' : isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-700'}`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className='mt-3 grid grid-cols-2 gap-3'>
            {[
              { label: 'Direct', active: true },
              { label: 'Group', active: false },
            ].map((item) => (
              <button
                key={item.label}
                type='button'
                className={`rounded-[18px] px-4 py-3 text-sm font-semibold ${item.active ? 'bg-emerald-500 text-white shadow-lg' : isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-700'}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className={`mt-4 flex items-center gap-3 rounded-[22px] px-4 py-3 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
            <svg className={`h-4 w-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} fill='currentColor' viewBox='0 0 20 20'>
              <path fillRule='evenodd' d='M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z' clipRule='evenodd' />
            </svg>
            <input
              type='search'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Search chats, email, or bio...'
              className={`w-full bg-transparent text-sm outline-none ${isDark ? 'text-white placeholder-slate-400' : 'text-slate-900 placeholder-slate-500'}`}
            />
          </div>
        </div>
      </div>

      {showDashboard ? (
        <div className='mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain'>
          <Dashboard />
        </div>
      ) : (
        <>
          <section className={`mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[30px] border ${isDark ? 'border-white/8 bg-slate-900/62' : 'border-slate-200 bg-white/90'}`}>
            <div className={`flex items-center justify-between px-4 py-4 ${isDark ? 'border-b border-white/8' : 'border-b border-slate-200'}`}>
              <div>
                <p className={`text-[11px] uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Direct chats</p>
                <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Sorted by unread messages, active chat, and presence.</p>
              </div>
              <div className='flex items-center gap-2'>
                <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${isDark ? 'bg-white/8 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{onlineCount} online</span>
                <button
                  type='button'
                  onClick={() => navigate('/profile')}
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${isDark ? 'bg-sky-500/15 text-sky-200' : 'bg-sky-50 text-sky-700'}`}
                  title='Profile settings'
                >
                  👤
                </button>
              </div>
            </div>

            <div className='min-h-0 flex-1 overflow-y-auto p-3'>
              {(isUsersLoading || isSearchingUsers) && (
                <div className='space-y-2'>
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className={`h-20 animate-pulse rounded-2xl ${isDark ? 'bg-slate-800/70' : 'bg-slate-200/70'}`} />
                  ))}
                </div>
              )}

              {!isUsersLoading && !isSearchingUsers && organizedUsers.length === 0 && (
                <div className={`rounded-[26px] border px-4 py-8 text-center text-sm ${isDark ? 'border-white/8 bg-slate-900/60 text-slate-400' : 'border-slate-200 bg-white text-slate-500'}`}>
                  {query ? 'No chats matched your search yet. Try a name, email, or bio keyword.' : 'No users available yet.'}
                </div>
              )}

              {!isUsersLoading && !isSearchingUsers && organizedUsers.map((user) => {
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
            </div>
          </section>

          <div className='mt-4 grid grid-cols-3 gap-2'>
            {[
              { label: 'All', value: users.length },
              { label: 'Online', value: onlineCount },
              { label: 'Unread', value: totalUnseen },
            ].map((item) => (
              <div key={item.label} className={`rounded-[22px] border px-3 py-3 text-center ${isDark ? 'border-white/8 bg-white/5' : 'border-slate-200 bg-white/80'}`}>
                <p className={`text-[10px] uppercase tracking-[0.16em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.label}</p>
                <p className='mt-2 text-lg font-semibold'>{item.value}</p>
              </div>
            ))}
          </div>

          <div className='mt-4 flex gap-2'>
            <button
              type='button'
              onClick={handleLogout}
              className='flex-1 rounded-[20px] bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-600'
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </aside>
  );
};

export default Sidebar;
