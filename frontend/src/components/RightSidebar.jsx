<<<<<<< HEAD
import React, { useContext, useMemo } from 'react'
import assets from '../assets/assets'
import { ChatContext } from '../context/ChatContext'
import { AuthContext } from '../context/AuthContext'

const RightSidebar = () => {
  const { selectedUser, message } = useContext(ChatContext);
  const { logout, onlineUsers } = useContext(AuthContext);
  const msgImage = useMemo(
    () => message.filter((msg) => msg.image).map((msg) => msg.image),
    [message]
  );
=======
import React, { useContext, useEffect, useState } from "react";
import assets from "../assets/assets";
import { ChatContext } from "../context/ChatContext";
import { AuthContext } from "../context/AuthContext";

const RightSidebar = () => {

  const { selectedUser, messages } = useContext(ChatContext);
  const { logout, onlineUsers } = useContext(AuthContext);

  const [msgImage, setMsgImage] = useState([]);

  // extract images from messages
  useEffect(() => {

    const images = messages
      .filter(msg => msg.image)
      .map(msg => msg.image);

    setMsgImage(images);

  }, [messages]);
>>>>>>> d0590308b28233ab2211eb13903613211721ba1c

  if (!selectedUser) return null;

  return (

    <div
      className={`h-full w-full bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 overflow-y-auto text-white p-6 relative
        ${selectedUser ? "max-md:hidden" : ""}`}
    >
<<<<<<< HEAD
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <img
            src={selectedUser?.profilePic || assets.avatar_icon}
            alt={selectedUser?.fullName}
            className="w-24 h-24 rounded-3xl border border-white/20 shadow-lg"
          />
          <span
            className={`absolute bottom-1 right-1 h-4 w-4 rounded-full border border-slate-950
              ${onlineUsers.includes(selectedUser._id) ? "bg-emerald-400" : "bg-slate-600"}`}
          />
=======

      {/* Profile */}
      <div className="pt-16 flex flex-col items-center gap-2 text-xs font-light mx-auto">

        <img
          src={selectedUser.profilePic || assets.avatar_icon}
          className="w-20 aspect-square rounded-full"
        />

        <h1 className="px-10 text-xl font-medium mx-auto flex items-center gap-2">

          {onlineUsers.includes(selectedUser._id) && (
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
          )}

          {selectedUser.fullName}

        </h1>

        <p className="px-10 mx-auto text-center">
          {selectedUser.bio}
        </p>

      </div>

      <hr className="border-[#ffffff50] my-4" />

      {/* Media */}
      <div className="px-5 text-xs">

        <p className="font-medium">Media</p>

        <div className="mt-2 max-h-[200px] overflow-y-auto grid grid-cols-2 gap-4 opacity-80">

          {msgImage.map((url) => (

            <div
              key={url}
              onClick={() => window.open(url)}
              className="cursor-pointer rounded"
            >

              <img
                src={url}
                className="aspect-square object-cover rounded-md"
              />

            </div>

          ))}

>>>>>>> d0590308b28233ab2211eb13903613211721ba1c
        </div>

        <div className="text-center">
          <h2 className="text-lg font-semibold">{selectedUser?.fullName}</h2>
          <p className="text-xs text-white/60 max-w-[210px]">{selectedUser?.bio || "No bio set yet."}</p>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-white/80">Shared Media</h3>
        {msgImage.length === 0 ? (
          <p className="mt-3 text-xs text-white/50">No shared media yet.</p>
        ) : (
          <div className="mt-4 grid grid-cols-3 gap-3">
            {msgImage.slice(-9).map((url, index) => (
              <button
                key={index}
                onClick={() => window.open(url)}
                className="h-20 w-20 rounded-xl overflow-hidden group"
              >
                <img
                  src={url}
                  alt="Shared"
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-110"
                />
              </button>
            ))}
          </div>
        )}
      </div>

<<<<<<< HEAD
      <button
        onClick={() => logout()}
        className="mt-8 w-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 py-2 text-sm font-semibold shadow-lg shadow-indigo-500/30 hover:opacity-90 transition"
=======
      {/* Logout */}
      <button
        onClick={logout}
        className="absolute bottom-5 left-1/2 -translate-x-1/2
        bg-gradient-to-r from-purple-500 to-violet-500
        text-white text-sm font-light px-20 py-2 rounded-full cursor-pointer"
>>>>>>> d0590308b28233ab2211eb13903613211721ba1c
      >
        Sign Out
      </button>
    </div>
  );
};

<<<<<<< HEAD
export default RightSidebar;
=======
export default RightSidebar;
>>>>>>> d0590308b28233ab2211eb13903613211721ba1c
