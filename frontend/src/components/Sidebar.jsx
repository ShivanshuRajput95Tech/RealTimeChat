<<<<<<< HEAD
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
=======
import React, { useContext, useEffect, useState } from "react";
import assets from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";

const Sidebar = () => {

  const {
    getUsers,
    users,
    selectedUser,
    setSelectedUser,
    unseenMessages,
    setUnseenMessages
  } = useContext(ChatContext);

  const { logout, onlineUsers } = useContext(AuthContext);

  const [input, setInput] = useState("");

  const navigate = useNavigate();

  const filteredUsers = input
    ? users.filter((user) =>
        user.fullName.toLowerCase().includes(input.toLowerCase())
      )
>>>>>>> d0590308b28233ab2211eb13903613211721ba1c
    : users;

  useEffect(() => {
    getUsers();
  }, [onlineUsers, getUsers]);

  return (
    <div
<<<<<<< HEAD
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
=======
      className={`bg-[#8185B2]/10 h-full p-5 rounded-r-xl overflow-y-scroll text-white ${
        selectedUser ? "max-md:hidden" : ""
      }`}
    >

      {/* Logo + Menu */}
      <div className="pb-5">

        <div className="flex justify-between items-center">
          <img src={assets.logo} className="max-w-40" />

          <div className="relative py-2 group">
            <img src={assets.menu_icon} className="max-w-5 cursor-pointer" />

            <div className="absolute top-full right-0 z-20 w-32 p-5 rounded-md bg-[#282142] border border-gray-600 text-gray-100 hidden group-hover:block">

              <p
                onClick={() => navigate("/profile")}
                className="cursor-pointer text-sm"
              >
                Edit Profile
              </p>

              <hr className="my-2 border-t border-gray-500" />

              <p onClick={logout} className="cursor-pointer text-sm">
                Logout
              </p>

            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-[#282142] rounded-full flex items-center gap-2 py-3 px-4 mt-5">
          <img src={assets.search_icon} className="w-3" />

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            type="text"
            placeholder="Search User..."
            className="bg-transparent border-none outline-none text-white text-xs placeholder-[#cfc8c8] flex-1"
>>>>>>> d0590308b28233ab2211eb13903613211721ba1c
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

<<<<<<< HEAD
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
=======
        {filteredUsers.map((user) => (

          <div
            key={user._id}
            onClick={() => {
              setSelectedUser(user);
              setUnseenMessages((prev) => ({
                ...prev,
                [user._id]: 0
              }));
            }}
            className={`relative flex items-center gap-3 p-2 pl-4 rounded cursor-pointer hover:bg-[#8185B2]/20 max-sm:text-sm
            ${selectedUser?._id === user._id ? "bg-[#282142]/50" : ""}`}
          >

            <img
              src={user.profilePic || assets.avatar_icon}
              className="w-[35px] aspect-square rounded-full"
            />

            <div className="flex flex-col leading-5">

              <span className="text-sm font-medium">
                {user.fullName}
              </span>

              {onlineUsers.includes(user._id) ? (
                <span className="text-green-400 text-xs">
                  Online
                </span>
              ) : (
                <span className="text-neutral-400 text-xs">
                  Offline
                </span>
              )}

            </div>

            {unseenMessages[user._id] > 0 && (
              <span className="absolute top-3 right-3 text-xs h-5 w-5 flex justify-center items-center rounded-full bg-violet-500/50">
                {unseenMessages[user._id]}
>>>>>>> d0590308b28233ab2211eb13903613211721ba1c
              </span>
            )}
          </button>
        ))}
      </div>
<<<<<<< HEAD
    </div>
  );
};

export default memo(Sidebar);
=======

    </div>
  );
};

export default Sidebar;
>>>>>>> d0590308b28233ab2211eb13903613211721ba1c
