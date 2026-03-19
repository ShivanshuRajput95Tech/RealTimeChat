import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useChat, useTheme } from '../../context';
import assets from '../assets/assets';
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

  useEffect(() => {
    if (showDashboard) return undefined;

    const timeout = setTimeout(() => {
      searchUsers(query);
    }, query.trim() ? 250 : 0);

    return () => clearTimeout(timeout);
  }, [query, searchUsers, showDashboard]);

  return (
    <aside className={`min-h-0 h-full border-r p-4 md:p-5 ${selectedUser ? 'hidden md:flex' : 'flex'} flex-col ${isDark ? 'border-white/10 bg-slate-950/30' : 'border-slate-200/70 bg-white/30'}`}>
      <div className={`frost-panel rounded-[34px] border p-5 ${isDark ? 'border-white/10 bg-slate-900/62' : 'border-white/80 bg-white/78'}`}>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <p className={`text-[11px] uppercase tracking-[0.24em] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Messaging</p>
            <h1 className={`mt-2 text-[28px] font-semibold ${isDark ? 'text-white' : 'text-slate-950'}`}>Chats</h1>
            <p className={`mt-2 max-w-[220px] text-xs leading-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Keep track of conversations, presence, and unread updates in one place.</p>
          </div>

          <div className='flex gap-2'>
            <button
              type='button'
              onClick={toggleTheme}
              className={`rounded-2xl p-2.5 text-sm transition ${isDark ? 'bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25' : 'bg-white text-cyan-700 shadow-sm hover:bg-cyan-50'}`}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            <button
              type='button'
              onClick={() => navigate('/profile')}
              className={`rounded-2xl p-2.5 text-sm transition ${isDark ? 'bg-violet-500/15 text-violet-300 hover:bg-violet-500/25' : 'bg-white text-violet-700 shadow-sm hover:bg-violet-50'}`}
              title='Profile'
            >
              👤
            </button>
          </div>
        </div>

        <div className={`mt-5 rounded-[30px] border p-4 ${isDark ? 'border-white/10 bg-slate-950/55' : 'border-slate-200 bg-slate-50/80'}`}>
          <div className='flex items-center gap-3'>
            <div className='relative'>
              <img
                src={authUser?.profilePic || assets.avatar_icon}
                alt='Current user'
                className={`h-14 w-14 rounded-[22px] object-cover ${isDark ? 'border border-white/10' : 'border border-white shadow-md'}`}
              />
              <span className='orb-dot absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-400' />
            </div>
            <div className='min-w-0'>
              <p className={`truncate text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{authUser?.fullName}</p>
              <p className={`truncate text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{authUser?.email}</p>
            </div>
          </div>
        </div>

        <div className='mt-4 grid grid-cols-3 gap-2.5'>
          {[
            { label: 'All', value: users.length },
            { label: 'Online', value: onlineCount },
            { label: 'Unread', value: totalUnseen },
          ].map((item) => (
            <div key={item.label} className={`rounded-[24px] border px-3 py-3 ${isDark ? 'border-white/8 bg-white/5' : 'border-slate-200 bg-slate-50/90'}`}>
              <p className={`text-[10px] uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.label}</p>
              <p className={`mt-2 text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className='mt-4 flex gap-2.5'>
        <button
          type='button'
          onClick={() => setShowDashboard(!showDashboard)}
          className={`flex-1 rounded-[22px] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] transition ${
            showDashboard
              ? 'bg-gradient-to-r from-violet-500 to-cyan-500 text-white shadow-lg'
              : isDark
                ? 'bg-slate-900/70 text-slate-300 hover:bg-slate-800'
                : 'bg-white text-slate-700 shadow hover:bg-slate-50'
          }`}
        >
          {showDashboard ? 'Close overview' : 'Overview'}
        </button>
        <button
          type='button'
          onClick={handleLogout}
          className='flex-1 rounded-[22px] bg-rose-500/90 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-rose-600'
        >
          Sign out
        </button>
      </div>

      {showDashboard ? (
        <div className='mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain'>
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
          <div className={`mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[30px] border ${isDark ? 'border-white/8 bg-slate-900/55' : 'border-slate-200 bg-white/88'}`}>
            <div className={`shrink-0 border-b px-4 py-4 ${isDark ? 'border-white/8' : 'border-slate-200'}`}>
              <div className='flex items-center gap-3 rounded-[24px]'>
                <svg className={`h-4 w-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} fill='currentColor' viewBox='0 0 20 20'>
                  <path fillRule='evenodd' d='M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z' clipRule='evenodd'/>
                </svg>
                <input
                  type='search'
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder='Search people, email, or bio...'
                  className={`w-full bg-transparent text-sm outline-none ${isDark ? 'text-white placeholder-slate-400' : 'text-slate-900 placeholder-slate-500'}`}
                />
                {query && (
                  <button
                    type='button'
                    onClick={() => setQuery('')}
                    className={`rounded-full px-2 py-1 text-[11px] font-medium ${isDark ? 'bg-white/8 text-slate-300' : 'bg-slate-100 text-slate-600'}`}
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className='mt-4 flex items-center justify-between'>
                <div>
                  <p className={`text-[11px] uppercase tracking-[0.22em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Recent chats</p>
                  <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Sorted by active chat, unread messages, and online status.
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${isDark ? 'bg-white/8 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                  {isSearchingUsers ? 'Searching…' : `${organizedUsers.length} shown`}
                </span>
              </div>
            </div>

            <section className='min-h-0 flex-1 space-y-2 overflow-y-auto p-3 overscroll-contain'>
              {(isUsersLoading || isSearchingUsers) && (
                <div className='space-y-2'>
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className={`h-20 animate-pulse rounded-2xl ${isDark ? 'bg-slate-800/70' : 'bg-slate-200/70'}`} />
                  ))}
                </div>
              )}

              {!isUsersLoading && !isSearchingUsers && organizedUsers.length === 0 && (
                <div className={`rounded-[26px] border px-4 py-8 text-center text-sm ${isDark ? 'border-white/8 bg-slate-900/60 text-slate-400' : 'border-slate-200 bg-white text-slate-500'}`}>
                  {query ? 'No people matched your search yet. Try a name, email, or bio keyword.' : 'No users available yet.'}
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
            </section>
          </div>

          <div className={`mt-4 rounded-[24px] border px-4 py-3 text-xs leading-5 ${isDark ? 'border-white/8 bg-white/5 text-slate-400' : 'border-slate-200 bg-white/70 text-slate-500'}`}>
            Real-time messaging with clean organisation, search, and status visibility.
          </div>
        </>
      )}
    </aside>
  );
};

export default Sidebar;
