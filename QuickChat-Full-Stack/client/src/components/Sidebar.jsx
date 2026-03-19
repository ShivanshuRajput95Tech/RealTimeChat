import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useChat, useTheme } from '../../context';
import assets from '../assets/assets';
import Dashboard from './Dashboard';
import UserCard from './ui/UserCard';

const navItems = [
  { id: 'chats', label: 'Chats', icon: '💬' },
  { id: 'contacts', label: 'Contacts', icon: '👤' },
  { id: 'notifications', label: 'Alerts', icon: '🔔' },
  { id: 'favorites', label: 'Saved', icon: '⭐' },
];

const quickTabs = ['Chat', 'Call', 'Contact'];
const conversationModes = ['Direct', 'Group'];

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
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [activeRail, setActiveRail] = useState('chats');
  const [activeQuickTab, setActiveQuickTab] = useState('Chat');
  const [conversationMode, setConversationMode] = useState('Direct');

  const totalUnseen = useMemo(() => Object.values(unseenMessages).reduce((a, b) => a + (b || 0), 0), [unseenMessages]);

  const statusUsers = useMemo(() => users.slice(0, 5), [users]);

  const filteredUsers = useMemo(() => {
    let list = users;

    if (query.trim()) {
      const value = query.toLowerCase().trim();
      list = list.filter((user) => [user.fullName, user.email, user.bio].filter(Boolean).some((field) => field.toLowerCase().includes(value)));
    }

    if (activeQuickTab === 'Call') {
      return [];
    }

    if (activeQuickTab === 'Contact') {
      return [...list].sort((a, b) => a.fullName.localeCompare(b.fullName));
    }

    if (conversationMode === 'Group') {
      return [];
    }

    return list;
  }, [activeQuickTab, conversationMode, query, users]);

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

  const onSelectUser = (user) => {
    setSelectedUser(user);
    setUnseenMessages((prev) => ({ ...prev, [user._id]: 0 }));
  };

  useEffect(() => {
    if (activeRail !== 'chats') return undefined;

    const timeout = setTimeout(() => {
      searchUsers(query);
    }, query.trim() ? 250 : 0);

    return () => clearTimeout(timeout);
  }, [activeRail, query, searchUsers]);

  const renderEmptyState = () => {
    if (activeQuickTab === 'Call') return 'Call history is not available yet in this workspace.';
    if (activeQuickTab === 'Contact') return 'No contacts matched your current search.';
    if (conversationMode === 'Group') return 'Group conversations are not configured in this demo yet.';
    return query ? 'No people matched your search yet. Try a name, email, or bio keyword.' : 'No users available yet.';
  };

  return (
    <aside className={`min-h-0 h-full border-r ${selectedUser ? 'hidden md:flex' : 'flex'} ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200/70 bg-white/40'}`}>
      <div className={`hidden h-full w-[92px] shrink-0 flex-col items-center justify-between py-5 lg:flex ${isDark ? 'bg-[#05b38b] text-white' : 'bg-[#07b28a] text-white'}`}>
        <div className='flex w-full flex-col items-center gap-5'>
          <div className='flex h-16 w-16 items-center justify-center rounded-[28px] bg-white/20 shadow-lg'>
            <img src={assets.logo_icon} alt='QuickChat logo' className='h-9 w-9' />
          </div>

          <div className='flex flex-col gap-4'>
            {navItems.map((item) => (
              <button
                key={item.id}
                type='button'
                onClick={() => setActiveRail(item.id === 'chats' ? 'chats' : 'overview')}
                className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl transition ${activeRail === (item.id === 'chats' ? 'chats' : 'overview') ? 'bg-white text-[#07b28a] shadow-lg' : 'bg-white/10 text-white hover:bg-white/20'}`}
                title={item.label}
              >
                <span aria-hidden='true'>{item.icon}</span>
              </button>
            ))}
          </div>
        </div>

        <div className='flex flex-col gap-4'>
          <button
            type='button'
            onClick={toggleTheme}
            className='flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl text-white transition hover:bg-white/20'
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          <button
            type='button'
            onClick={logout}
            className='flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl text-white transition hover:bg-white/20'
            title='Sign out'
          >
            ↪
          </button>
        </div>
      </div>

      <div className={`flex min-w-0 flex-1 flex-col ${isDark ? 'bg-slate-950/55' : 'bg-white/85'}`}>
        <div className={`halo-divider px-5 py-5 ${isDark ? 'bg-slate-900/80' : 'bg-white/92'}`}>
          <div className='flex items-center justify-between gap-4'>
            <div className='flex min-w-0 items-center gap-3'>
              <img
                src={authUser?.profilePic || assets.avatar_icon}
                alt='Current user'
                className='h-16 w-16 rounded-full object-cover shadow-lg'
              />
              <div className='min-w-0'>
                <h2 className={`truncate text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{authUser?.fullName}</h2>
                <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{totalUnseen > 0 ? 'Busy' : 'Available'}</p>
              </div>
            </div>
            <div className='flex gap-2'>
              <button
                type='button'
                onClick={() => navigate('/profile')}
                className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl text-xl ${isDark ? 'bg-emerald-500/12 text-emerald-200' : 'bg-emerald-50 text-emerald-700'}`}
                title='Profile'
              >
                ⋮
              </button>
            </div>
          </div>
        </div>

        {activeRail === 'overview' ? (
          <div className='min-h-0 flex-1 overflow-y-auto px-4 py-4'>
            <Dashboard />
          </div>
        ) : (
          <>
            <div className='space-y-5 px-5 py-5'>
              <section>
                <div className='mb-4 flex items-center justify-between'>
                  <h3 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Status</h3>
                  <button type='button' className='text-base font-medium text-[#07b28a]'>
                    View all
                  </button>
                </div>
                <div className='flex gap-4 overflow-x-auto pb-2'>
                  {statusUsers.map((user) => {
                    const online = onlineUsers.includes(user._id);
                    return (
                      <button key={user._id} type='button' onClick={() => onSelectUser(user)} className='min-w-[74px] text-center'>
                        <div className='mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full border-[3px] border-[#07b28a] p-1'>
                          <img src={user.profilePic || assets.avatar_icon} alt={user.fullName} className='h-full w-full rounded-full object-cover' />
                        </div>
                        <p className={`mt-2 truncate text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{online ? user.fullName.split(' ')[0] : 'My status'}</p>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <div className='mb-4 flex items-center justify-between'>
                  <h3 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Message ({users.length})</h3>
                  <button
                    type='button'
                    className={`flex h-12 w-12 items-center justify-center rounded-full text-xl ${isDark ? 'bg-white/8 text-slate-200' : 'bg-slate-100 text-slate-600'}`}
                    title='Search'
                  >
                    ⌕
                  </button>
                </div>

                <div className='grid grid-cols-3 gap-3'>
                  {quickTabs.map((item) => (
                    <button
                      key={item}
                      type='button'
                      onClick={() => setActiveQuickTab(item)}
                      className={`rounded-full px-4 py-3 text-base font-semibold ${activeQuickTab === item ? 'bg-[#07b28a] text-white shadow-lg' : isDark ? 'bg-white/8 text-slate-300' : 'bg-slate-100 text-slate-700'}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <div className='mt-3 grid grid-cols-2 gap-3'>
                  {conversationModes.map((item) => (
                    <button
                      key={item}
                      type='button'
                      onClick={() => setConversationMode(item)}
                      className={`rounded-2xl px-4 py-3 text-xl font-semibold ${conversationMode === item ? 'bg-[#07b28a] text-white shadow-lg' : isDark ? 'bg-white/8 text-slate-300' : 'bg-slate-100 text-slate-700'}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <div className={`mt-4 flex items-center gap-3 rounded-[24px] px-4 py-3 ${isDark ? 'bg-white/6' : 'bg-slate-100'}`}>
                  <span className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>⌕</span>
                  <input
                    type='search'
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder='Search messages, contacts, or bio...'
                    className={`w-full bg-transparent text-sm outline-none ${isDark ? 'text-white placeholder-slate-400' : 'text-slate-900 placeholder-slate-500'}`}
                  />
                </div>
              </section>
            </div>

            <div className='min-h-0 flex-1 overflow-y-auto border-t border-slate-200/15'>
              {(isUsersLoading || isSearchingUsers) && activeQuickTab === 'Chat' && conversationMode === 'Direct' ? (
                <div className='space-y-3 p-5'>
                  {[1, 2, 3].map((item) => (
                    <div key={item} className={`h-24 animate-pulse rounded-[28px] ${isDark ? 'bg-white/6' : 'bg-slate-100'}`} />
                  ))}
                </div>
              ) : organizedUsers.length === 0 ? (
                <div className={`m-5 rounded-[28px] px-5 py-10 text-center text-sm ${isDark ? 'bg-white/6 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                  {renderEmptyState()}
                </div>
              ) : (
                <div className='space-y-1 p-3'>
                  {organizedUsers.map((user) => (
                    <UserCard
                      key={user._id}
                      user={user}
                      online={onlineUsers.includes(user._id)}
                      unseen={unseenMessages[user._id] || 0}
                      selected={selectedUser?._id === user._id}
                      onSelect={onSelectUser}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
