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
    <div className="h-full flex flex-col relative backdrop-blur-lg">

      {/* HEADER */}
      <div className="flex items-center gap-3 py-4 px-4 border-b border-stone-500">

        <img
          src={selectedUser.profilePic || assets.avatar_icon}
          className="w-8 rounded-full"
        />

        <p className="flex-1 text-lg text-white flex items-center gap-2">
          {selectedUser.fullName}

          {onlineUsers.includes(selectedUser._id) && (
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
          )}
        </p>

        <img
          onClick={() => setSelectedUser(null)}
          src={assets.arrow_icon}
          className="cursor-pointer w-6"
        />

      </div>


      {/* MESSAGES */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto p-4 pb-24">

        {messages.map((msg, index) => {

          const isOwnMessage = msg.senderId === authUser._id;

          return (
            <div
              key={index}
              className={`flex items-end gap-2 ${
                isOwnMessage ? "justify-end" : "justify-start"
              }`}
            >

              {!isOwnMessage && (
                <img
                  src={selectedUser.profilePic || assets.avatar_icon}
                  className="w-7 h-7 rounded-full"
                />
              )}

              {msg.image ? (
                <img
                  src={msg.image}
                  className="max-w-[230px] rounded-lg border border-gray-700"
                />
              ) : (
                <p
                  className={`p-2 max-w-[220px] text-sm rounded-lg text-white
                  ${
                    isOwnMessage
                      ? "bg-violet-500/30 rounded-br-none"
                      : "bg-[#2b264a] rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </p>
              )}

              <p className="text-xs text-gray-400">
                {formateMessageTime(msg.createdAt)}
              </p>

            </div>
          );
        })}

        <div ref={scrollEnd}></div>

      </div>


      {/* INPUT */}
      <form
        onSubmit={handleSendMessage}
        className="absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3 bg-[#1f1b2e]"
      >

        <div className="flex-1 flex items-center bg-gray-100/10 px-3 rounded-full">

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            type="text"
            placeholder="Send a message..."
            className="flex-1 text-sm p-3 bg-transparent outline-none text-white"
          />

          <input
            type="file"
            id="image"
            accept="image/*"
            hidden
            onChange={handleSendImage}
          />

          <label htmlFor="image">
            <img src={assets.gallery_icon} className="w-5 mr-2 cursor-pointer" />
          </label>

        </div>

        <button type="submit">
          <img src={assets.send_button} className="w-7 cursor-pointer" />
        </button>

      </form>

    </div>
  );
};

export default memo(ChatContainer);