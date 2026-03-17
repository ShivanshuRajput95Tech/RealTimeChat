import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ChatContext } from '../../context/ChatContext';
import { ThemeContext } from '../../context/ThemeContext';
import UserCard from './ui/UserCard';

const Sidebar = () => {
  const {
    getUsers,
    users,
    selectedUser,
    setSelectedUser,
    unseenMessages,
    setUnseenMessages,
  } = useContext(ChatContext);

  const { authUser, logout, onlineUsers } = useContext(AuthContext);
  const { isDark, toggleTheme } = useContext(ThemeContext);

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

  useEffect(() => {
    getUsers();
  }, [onlineUsers]);

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
    <aside className={`h-full p-4 md:p-5 border-r flex flex-col ${isDark ? 'border-white/10 bg-gradient-to-b from-slate-900/50 to-slate-900/30' : 'border-slate-200 bg-gradient-to-b from-slate-50 to-white'}`}>
      {/* Header */}
      <div className='flex items-center justify-between mb-4'>
        <div>
          <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Chatify</h1>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Real-time Chat</p>
        </div>

        <div className='flex gap-1'>
          <button
            type='button'
            onClick={toggleTheme}
            className={`p-2 rounded-lg text-sm transition ${isDark ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300' : 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-700'}`}
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          <button
            type='button'
            onClick={() => navigate('/profile')}
            className={`p-2 rounded-lg text-sm transition ${isDark ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300' : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-700'}`}
            title='Profile'
          >
            👤
          </button>
        </div>
      </div>

      {/* Dashboard & Logout section */}
      <div className='flex gap-2 mb-4'>
        <button
          type='button'
          onClick={() => setShowDashboard(!showDashboard)}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition ${
            showDashboard
              ? isDark ? 'bg-violet-600/60 text-white' : 'bg-violet-500/60 text-white'
              : isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
          }`}
        >
          📊 Dashboard
        </button>
        <button
          type='button'
          onClick={handleLogout}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition ${isDark ? 'bg-rose-500/60 hover:bg-rose-500/80 text-white' : 'bg-rose-500/60 hover:bg-rose-500/80 text-white'}`}
        >
          Logout
        </button>
      </div>

      {/* Dashboard View */}
      {showDashboard ? (
        <div className={`flex-1 overflow-y-auto space-y-3 ${isDark ? 'scrollbar-thumb-slate-600 scrollbar-track-slate-800' : 'scrollbar-thumb-slate-300 scrollbar-track-slate-100'}`}>
          <div className={`${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} border rounded-lg p-3`}>
            <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Account</p>
            <p className={`text-sm font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{authUser?.fullName}</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{authUser?.email}</p>
          </div>

          <div className={`${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} border rounded-lg p-3`}>
            <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Activity</p>
            <div className='grid grid-cols-2 gap-2 mt-2'>
              <div className={`${isDark ? 'bg-slate-700/50' : 'bg-slate-100'} p-2 rounded text-center`}>
                <p className={`text-lg font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{users.length}</p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Friends</p>
              </div>
              <div className={`${isDark ? 'bg-slate-700/50' : 'bg-slate-100'} p-2 rounded text-center`}>
                <p className={`text-lg font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{onlineUsers.length}</p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Online</p>
              </div>
              <div className={`${isDark ? 'bg-slate-700/50' : 'bg-slate-100'} p-2 rounded text-center`}>
                <p className={`text-lg font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{totalUnseen}</p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Unread</p>
              </div>
              <div className={`${isDark ? 'bg-slate-700/50' : 'bg-slate-100'} p-2 rounded text-center`}>
                <p className={`text-lg font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{new Date(authUser?.createdAt).getDate()}</p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Member</p>
              </div>
            </div>
          </div>

          <div className={`${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} border rounded-lg p-3`}>
            <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Quick Stats</p>
            <ul className={`text-xs mt-2 space-y-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <li>✓ Profile complete</li>
              <li>🟢 Status: Active</li>
              <li>⚡ All systems normal</li>
            </ul>
          </div>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className={`relative mb-4 rounded-full flex items-center gap-2 px-4 py-2 border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-300'}`}>
            <svg className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} fill='currentColor' viewBox='0 0 20 20'>
              <path fillRule='evenodd' d='M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z' clipRule='evenodd'/>
            </svg>
            <input
              type='search'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Search users...'
              className={`w-full text-sm outline-none ${isDark ? 'bg-slate-800/50 text-white placeholder-slate-400' : 'bg-white text-slate-900 placeholder-slate-500'}`}
            />
          </div>

          {/* Users List */}
          <section className={`flex-1 overflow-y-auto space-y-2 scrollbar-thin ${isDark ? 'scrollbar-thumb-slate-600 scrollbar-track-slate-800' : 'scrollbar-thumb-slate-300 scrollbar-track-slate-100'}`}>
            {filteredUsers.length === 0 && (
              <div className={`text-center text-sm py-10 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {query ? 'No users found.' : 'No users available.'}
              </div>
            )}

            {filteredUsers.map((user) => {
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

          <div className={`mt-4 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            💬 Click a contact to chat
          </div>
        </>
      )}
    </aside>
  );
};

export default Sidebar;
