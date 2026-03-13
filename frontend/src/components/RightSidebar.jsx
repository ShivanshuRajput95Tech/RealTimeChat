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

  if (!selectedUser) return null;

  return (
    <div
      className={`h-full w-full bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 overflow-y-auto text-white p-6 relative
        ${selectedUser ? "max-md:hidden" : ""}`}
    >
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

      <button
        onClick={() => logout()}
        className="mt-8 w-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 py-2 text-sm font-semibold shadow-lg shadow-indigo-500/30 hover:opacity-90 transition"
      >
        Sign Out
      </button>
    </div>
  );
};

export default RightSidebar;
