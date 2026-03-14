import React, { useRef, useEffect, useState, useContext, memo } from "react";
import assets from "../assets/assets";
import { formateMessageTime } from "../lib/utils";
import toast from "react-hot-toast";
import { ChatContext } from "../context/ChatContext";
import { AuthContext } from "../context/AuthContext";

const ChatContainer = () => {

  const { messages, selectedUser, setSelectedUser, sendMessage, getMessages } =
    useContext(ChatContext);

  const { authUser, onlineUsers } = useContext(AuthContext);

  const scrollEnd = useRef(null);
  const [input, setInput] = useState("");

  // Auto scroll
  useEffect(() => {
    scrollEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load messages when user changes
  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
    }
  }, [selectedUser, getMessages]);

  // Send text message
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!input.trim()) return;

    await sendMessage({ text: input.trim() });
    setInput("");
  };

  // Send image
  const handleSendImage = async (e) => {
    const file = e.target.files[0];

    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select a valid image");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onloadend = async () => {
      await sendMessage({ image: reader.result });
      e.target.value = "";
    };
  };

  if (!selectedUser) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-gray-400 bg-white/10 h-full">
        <img src={assets.logo_icon} alt="" className="max-w-16" />
        <p className="text-lg font-medium text-white">Welcome to Chat</p>
        <p className="text-sm">Select a conversation to start messaging</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative bg-white/5 backdrop-blur-[16px]">

      {/* HEADER */}
      <div className="flex items-center justify-between gap-3 p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img
            src={selectedUser.profilePic || assets.avatar_icon}
            className="w-11 h-11 rounded-2xl border border-white/20"
          />

          <div>
            <p className="text-base font-semibold text-white">
              {selectedUser.fullName}
            </p>
            <p className="text-xs text-white/60">
              {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSelectedUser(null)}
          className="hidden md:flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 hover:bg-white/15 transition"
        >
          <img src={assets.arrow_icon} className="w-4" />
          <span className="text-xs text-white/80">Back</span>
        </button>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto px-5 py-6">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center text-white/60">
            <img src={assets.help_icon} alt="No messages" className="w-20 opacity-80" />
            <p className="text-sm">No messages yet. Select a contact to start chatting.</p>
          </div>
        )}

        {messages.map((msg, index) => {
          const isOwnMessage = msg.senderId === authUser._id;

          return (
            <div
              key={index}
              className={`flex gap-3 items-end ${
                isOwnMessage ? "justify-end" : "justify-start"
              }`}
            >
              {!isOwnMessage && (
                <img
                  src={selectedUser.profilePic || assets.avatar_icon}
                  className="w-8 h-8 rounded-full border border-white/20"
                />
              )}

              <div className="max-w-[78%]">
                <div
                  className={`relative rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm
                    ${
                      isOwnMessage
                        ? "bg-gradient-to-br from-violet-500/30 to-indigo-500/20 text-white"
                        : "bg-white/10 text-white"
                    }`}
                >
                  {msg.image ? (
                    <img
                      src={msg.image}
                      alt="uploaded"
                      className="rounded-xl border border-white/10 max-w-full object-cover"
                    />
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  )}

                  <span className="absolute bottom-1 right-3 text-[10px] text-white/60">
                    {formateMessageTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        <div ref={scrollEnd}></div>
      </div>

      {/* INPUT */}
      <form
        onSubmit={handleSendMessage}
        className="absolute bottom-0 left-0 right-0 flex items-center gap-3 px-4 py-4 bg-gradient-to-t from-slate-950/90 via-slate-950/70 to-transparent"
      >
        <div className="flex-1 flex items-center gap-3 rounded-full bg-white/10 px-4 py-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            type="text"
            placeholder="Type a message..."
            className="flex-1 text-sm bg-transparent outline-none text-white placeholder-white/50"
          />

          <input
            type="file"
            id="image"
            accept="image/*"
            hidden
            onChange={handleSendImage}
          />

          <label htmlFor="image" className="cursor-pointer">
            <img src={assets.gallery_icon} className="w-5 text-white/70 hover:text-white" />
          </label>
        </div>

        <button
          type="submit"
          className="h-11 w-11 rounded-full bg-violet-500 hover:bg-violet-400 transition shadow-lg flex items-center justify-center"
        >
          <img src={assets.send_button} className="w-5" />
        </button>
      </form>
    </div>
  );
};

export default memo(ChatContainer);