import React, { useContext, useEffect, useState, memo } from 'react'
import assets from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { ChatContext } from '../context/ChatContext'

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, unseenMessage, setUnseenMessage } = useContext(ChatContext);
  const { logout, onlineUsers } = useContext(AuthContext);
  const [input, setInput] = useState("");
  const navigate = useNavigate();

  const filteredUsers = input
    ? users.filter((user) => user.fullName.toLowerCase().includes(input.toLowerCase()))
    : users;

  useEffect(() => {
    getUsers();
  }, [onlineUsers, getUsers]);

  return (
    <div
      className={`h-full p-6 overflow-y-auto text-white bg-gradient-to-b from-indigo-950 via-slate-950 to-slate-900 shadow-inner transition-all duration-300
        ${selectedUser ? "max-md:hidden" : ""}`}
    >
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center shadow">
            <span className="text-lg font-semibold tracking-widest">RC</span>
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wide">Chats</h2>
            <p className="text-xs text-white/60">Tap a contact to start</p>
          </div>
        </div>

        <div className="relative group">
          <img
            src={assets.menu_icon}
            alt="Menu"
            className="w-6 h-6 cursor-pointer"
          />

          <div className="absolute right-0 top-full mt-2 w-44 rounded-xl bg-slate-900/90 border border-white/10 text-sm text-white shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity">
            <button
              onClick={() => navigate("/profile")}
              className="w-full text-left px-4 py-3 hover:bg-white/10"
            >
              Edit profile
            </button>
            <button
              onClick={() => logout()}
              className="w-full text-left px-4 py-3 hover:bg-white/10"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-4 flex items-center">
          <img src={assets.search_icon} alt="Search" className="w-4 h-4 text-white/60" />
        </div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          type="text"
          placeholder="Search users..."
          className="w-full rounded-full bg-white/10 py-3 pl-12 pr-4 text-sm text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <div className="space-y-3 pb-10">
        {filteredUsers.map((user) => (
          <button
            key={user._id}
            onClick={() => {
              setSelectedUser(user);
              setUnseenMessage((prev) => ({ ...prev, [user._id]: 0 }));
            }}
            className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors hover:bg-white/10
              ${selectedUser?._id === user._id ? "bg-white/10" : ""}`}
          >
            <div className="relative">
              <img
                src={user.profilePic || assets.avatar_icon}
                alt={user.fullName}
                className="w-11 h-11 rounded-full border border-white/20"
              />
              <span
                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border border-slate-900
                  ${onlineUsers.includes(user._id) ? "bg-emerald-400" : "bg-slate-600"}`}
              />
            </div>

            <div className="flex-1 text-left">
              <p className="text-sm font-medium truncate">{user.fullName}</p>
              <p className="text-xs text-white/60 truncate">
                {onlineUsers.includes(user._id) ? "Online" : "Offline"}
              </p>
            </div>

            {unseenMessage[user._id] > 0 && (
              <span className="min-w-[24px] h-6 rounded-full bg-violet-500/80 flex items-center justify-center text-xs font-semibold">
                {unseenMessage[user._id]}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default memo(Sidebar);
