<<<<<<< HEAD
import React from "react";
import Sidebar from "../components/Sidebar";
import ChatContainer from "../components/ChatContainer";
import RightSidebar from "../components/RightSidebar";

const HomePage = () => {

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
      <div className="min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shadow-sm">
              <span className="text-xl font-bold tracking-wider">RC</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold">RealTimeChat</h1>
              <p className="text-xs text-white/60">Fast, secure messaging with friends</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-white/60">
            <span className="px-3 py-1 rounded-full bg-white/10">Tip:</span>
            <span>Click a contact to start chatting</span>
          </div>
        </header>
=======
import React, { useContext } from "react";
import Sidebar from "../components/Sidebar";
import ChatContainer from "../components/ChatContainer";
import RightSidebar from "../components/RightSidebar";
import { ChatContext } from "../context/ChatContext";

const HomePage = () => {

  const { selectedUser } = useContext(ChatContext);

  return (

    <div className="border w-full h-screen sm:px-[15%] sm:py-[5%]">

      <div
        className={`backdrop-blur-xl border-2 border-gray-600 rounded-2xl
        overflow-hidden h-full grid relative
        ${
          selectedUser
            ? "grid-cols-1 md:grid-cols-[30%_40%_30%]"
            : "grid-cols-1 md:grid-cols-2"
        }`}
      >

        <Sidebar />

        <ChatContainer />

        {selectedUser && <RightSidebar />}
>>>>>>> d0590308b28233ab2211eb13903613211721ba1c

        <main className="flex-1 px-4 sm:px-8 py-6">
          <div className="h-full rounded-[32px] border border-white/10 bg-white/5 shadow-xl overflow-hidden grid gap-4 grid-cols-1 md:grid-cols-[320px_1fr_320px]">
            <Sidebar />
            <ChatContainer />
            <RightSidebar />
          </div>
        </main>
      </div>
    </div>
<<<<<<< HEAD
  );
};

=======

  );

};

>>>>>>> d0590308b28233ab2211eb13903613211721ba1c
export default HomePage;