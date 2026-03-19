import React, { useEffect, useRef, useState } from 'react';
import assets from '../assets/assets';
import { useAuth, useChat, useTheme } from '../../context';
import MessageBubble from './ui/MessageBubble';
import TypingIndicator from './ui/TypingIndicator';
import AIAssistantPanel from './AIAssistantPanel';
import toast from 'react-hot-toast';

const ChatContainer = () => {
  const {
    messages,
    selectedUser,
    setSelectedUser,
    sendMessage,
    getMessages,
    isTyping,
    typingTimeout,
    setTypingTimeout,
    isMessagesLoading,
  } = useChat();
  const { authUser, onlineUsers, socket } = useAuth();
  const { isDark } = useTheme();

  const scrollEnd = useRef(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSuggestionPick = (suggestion) => {
    setInput(suggestion);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === '') return;

    setLoading(true);
    if (socket && selectedUser) {
      socket.emit('stopTyping', { userId: authUser._id, receiverId: selectedUser._id });
    }

    try {
      await sendMessage({ text: input.trim() });
      setInput('');
    } catch {
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);

    if (socket && selectedUser && value.trim()) {
      socket.emit('typing', { userId: authUser._id, receiverId: selectedUser._id });

      if (typingTimeout) clearTimeout(typingTimeout);

      const timeout = setTimeout(() => {
        socket.emit('stopTyping', { userId: authUser._id, receiverId: selectedUser._id });
      }, 3000);
      setTypingTimeout(timeout);
    } else if (!value.trim() && socket && selectedUser) {
      socket.emit('stopTyping', { userId: authUser._id, receiverId: selectedUser._id });
      if (typingTimeout) clearTimeout(typingTimeout);
    }
  };

  const handleSendImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please select an image (PNG/JPG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      setLoading(true);
      try {
        await sendMessage({ image: reader.result });
        if (socket && selectedUser) {
          socket.emit('stopTyping', { userId: authUser._id, receiverId: selectedUser._id });
        }
      } catch {
        toast.error('Failed to send image');
      } finally {
        setLoading(false);
        e.target.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!selectedUser) return;
    getMessages(selectedUser._id);
  }, [getMessages, selectedUser]);

  useEffect(() => {
    scrollEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [typingTimeout]);

  if (!selectedUser) {
    return (
      <main className={`relative flex h-full flex-col items-center justify-center overflow-hidden px-6 text-center ${isDark ? 'bg-slate-950/30' : 'bg-slate-100/80'}`}>
        <div className={`absolute inset-0 opacity-70 ${isDark ? 'bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(168,85,247,0.18),transparent_32%)]' : 'bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.28),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(196,181,253,0.35),transparent_32%)]'}`} />
        <div className={`frost-panel relative max-w-xl rounded-[36px] border px-8 py-10 ${isDark ? 'border-white/10 bg-slate-900/55 text-white' : 'border-white bg-white/82 text-slate-900'}`}>
          <div className='mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] bg-[linear-gradient(135deg,#7c3aed,#06b6d4)] text-4xl shadow-lg'>
            ✦
          </div>
          <h2 className='font-display text-3xl font-semibold'>Step into a calmer, more expressive chat flow.</h2>
          <p className={`mt-3 text-sm leading-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Select someone from the orbit to reveal a layered message canvas with live presence, media, and AI drafting support.
          </p>
          <div className='mt-6 grid gap-3 sm:grid-cols-3'>
            {['Presence aware', 'Media native', 'AI assisted'].map((item) => (
              <div
                key={item}
                className={`rounded-[22px] border px-3 py-3 text-xs font-medium ${isDark ? 'border-white/8 bg-white/5 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-700'}`}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  const isOnline = onlineUsers.includes(selectedUser._id);
  const peerIsTyping = isTyping[selectedUser._id];

  return (
    <section className={`relative flex min-h-0 h-full flex-col ${isDark ? 'bg-slate-950/30' : 'bg-white/90'}`}>
      <header className={`halo-divider flex items-center justify-between gap-3 px-4 py-4 backdrop-blur-xl ${isDark ? 'bg-slate-900/65' : 'bg-white/82'}`}>
        <div className='flex min-w-0 items-center gap-3'>
          <button
            type='button'
            onClick={() => setSelectedUser(null)}
            className={`rounded-xl p-2 transition md:hidden ${isDark ? 'hover:bg-slate-700/40 text-white' : 'hover:bg-slate-200 text-slate-700'}`}
          >
            <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
              <path fillRule='evenodd' d='M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z' clipRule='evenodd'/>
            </svg>
          </button>

          <div className='relative shrink-0'>
            <img
              src={selectedUser.profilePic || assets.avatar_icon}
              alt='selected user'
              className={`h-12 w-12 rounded-2xl object-cover shadow-lg ${isDark ? 'border border-white/10' : 'border border-slate-200'}`}
            />
            <div className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 ${isDark ? 'border-slate-900' : 'border-white'} ${isOnline ? 'bg-emerald-400' : isDark ? 'bg-slate-500' : 'bg-slate-400'}`} />
          </div>

          <div className='min-w-0'>
            <h3 className={`font-display truncate text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedUser.fullName}</h3>
            {peerIsTyping ? (
              <TypingIndicator />
            ) : (
              <div className='flex flex-wrap items-center gap-2'>
                <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {isOnline ? 'Active now' : 'Offline'}
                </p>
                {selectedUser.bio && (
                  <span className={`hidden rounded-full px-2 py-0.5 text-[10px] font-medium sm:inline-flex ${isDark ? 'bg-white/6 text-slate-300' : 'bg-slate-100 text-slate-500'}`}>
                    {selectedUser.bio.length > 32 ? `${selectedUser.bio.slice(0, 32)}…` : selectedUser.bio}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className='hidden items-center gap-2 lg:flex'>
          <div className={`rounded-[24px] border px-4 py-2.5 text-right text-[11px] font-medium ${isDark ? 'border-white/8 bg-white/5 text-slate-300' : 'border-slate-200 bg-slate-50/90 text-slate-600'}`}>
            <div>{messages.length} messages in stream</div>
            <div>{isOnline ? 'Presence active' : 'Presence paused'}</div>
          </div>
        </div>
      </header>

      <div className={`chat-surface min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-4 sm:py-5 scrollbar-thin overscroll-contain ${isDark ? 'scrollbar-thumb-slate-600 scrollbar-track-slate-800' : 'scrollbar-thumb-slate-300 scrollbar-track-slate-100'}`}>
        <div className='mx-auto flex max-w-4xl flex-col gap-4'>
          {isMessagesLoading && (
            <div className='space-y-3'>
              {[1, 2, 3].map((item) => (
                <div key={item} className={`h-18 animate-pulse rounded-3xl ${isDark ? 'bg-slate-800/70' : 'bg-slate-100'}`} />
              ))}
            </div>
          )}

          {!isMessagesLoading && messages.length === 0 && (
            <div className={`mx-auto mt-10 max-w-md rounded-[28px] border px-6 py-8 text-center shadow-xl ${isDark ? 'border-white/10 bg-slate-900/65 text-slate-200' : 'border-slate-200 bg-white text-slate-700'}`}>
              <div className='mb-3 text-4xl'>👋</div>
              <p className='text-lg font-semibold'>Say hello to {selectedUser.fullName}</p>
              <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Start with a short message or share an image to begin the conversation.
              </p>
            </div>
          )}

          {!isMessagesLoading && messages.map((msg) => (
            <MessageBubble
              key={msg._id || `${msg.senderId}-${msg.createdAt}`}
              msg={msg}
              isMine={msg.senderId === authUser._id}
              peerAvatar={selectedUser.profilePic}
              myAvatar={authUser.profilePic}
            />
          ))}

          <div ref={scrollEnd} />
        </div>
      </div>

      <form
        onSubmit={handleSendMessage}
        className={`border-t px-4 py-3 backdrop-blur-xl ${isDark ? 'border-white/10 bg-slate-900/75' : 'border-slate-200 bg-white/90'}`}
      >
        <div className='mx-auto flex max-w-4xl flex-col gap-2'>
          <div className='lg:hidden'>
            <AIAssistantPanel
              selectedUser={selectedUser}
              messages={messages}
              onSuggestionPick={handleSuggestionPick}
              compact
            />
          </div>

          <div className='flex items-center gap-2'>
            <label
              htmlFor='image'
              className={`inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl transition ${isDark ? 'bg-white/6 text-slate-100 hover:bg-white/12' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              title='Send image'
            >
              <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                <path d='M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z'/>
              </svg>
            </label>

            <input onChange={handleSendImage} id='image' type='file' accept='image/png,image/jpeg,image/gif,image/webp' hidden />

            <div className={`frost-panel flex flex-1 items-center gap-2 rounded-[28px] border px-3 py-2 shadow-inner ${isDark ? 'border-white/10 bg-slate-800/72' : 'border-slate-200 bg-white/80'}`}>
              <input
                value={input}
                onChange={handleInputChange}
                className={`flex-1 bg-transparent px-1 py-1 text-sm outline-none ${isDark ? 'text-white placeholder-slate-400' : 'text-slate-900 placeholder-slate-500'}`}
                placeholder='Write a message or use AI suggestions...'
                disabled={loading}
              />
              <button
                type='submit'
                disabled={loading || !input.trim()}
                className='inline-flex h-10 min-w-10 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-500 px-4 text-xs font-semibold uppercase tracking-wide text-white shadow-lg transition hover:from-violet-600 hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-50'
                title='Send message'
              >
                {loading ? (
                  <svg className='w-4 h-4 animate-spin' fill='none' viewBox='0 0 24 24'>
                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'/>
                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'/>
                  </svg>
                ) : (
                  'Send'
                )}
              </button>
            </div>
          </div>

          <div className={`flex items-center justify-between px-1 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <span>Messages flow live with presence, media, and AI assistance.</span>
            <span className='hidden sm:inline'>Press Enter to send</span>
          </div>
        </div>
      </form>
    </section>
  );
};

export default ChatContainer;
