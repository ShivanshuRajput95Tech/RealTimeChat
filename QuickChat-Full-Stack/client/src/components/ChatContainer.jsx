import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import assets from '../assets/assets';
import { useAuth, useChat, useTheme } from '../../context';
import AIAssistantPanel from './AIAssistantPanel';
import TypingIndicator from './ui/TypingIndicator';
import MessageBubble from './ui/MessageBubble';

const headerActions = [
  {
    label: 'Mute',
    icon: (
      <svg className='h-5 w-5' fill='none' stroke='currentColor' strokeWidth='1.8' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' d='M11 5 6 9H3v6h3l5 4V5Zm4 5a4 4 0 010 4m2-7a8 8 0 010 10' />
      </svg>
    ),
  },
  {
    label: 'Search',
    icon: (
      <svg className='h-5 w-5' fill='none' stroke='currentColor' strokeWidth='1.8' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' d='m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z' />
      </svg>
    ),
  },
  {
    label: 'Video',
    icon: (
      <svg className='h-5 w-5' fill='none' stroke='currentColor' strokeWidth='1.8' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' d='M15 10 19.55 7.72A1 1 0 0 1 21 8.62v6.76a1 1 0 0 1-1.45.9L15 14M5 19h8a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5A2 2 0 0 0 3 7v10a2 2 0 0 0 2 2Z' />
      </svg>
    ),
  },
  {
    label: 'Call',
    icon: (
      <svg className='h-5 w-5' fill='none' stroke='currentColor' strokeWidth='1.8' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' d='M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.63 2.62a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6.27 6.27l1.28-1.29a2 2 0 0 1 2.11-.45c.84.3 1.72.51 2.62.63A2 2 0 0 1 22 16.92Z' />
      </svg>
    ),
  },
  {
    label: 'Details',
    icon: (
      <svg className='h-5 w-5' fill='none' stroke='currentColor' strokeWidth='1.8' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' d='M4 5h6v6H4zm10 0h6v6h-6zM4 13h6v6H4zm10 0h6v6h-6z' />
      </svg>
    ),
  },
];

const composerActions = [
  {
    label: 'Sticker',
    icon: (
      <svg className='h-5 w-5' fill='none' stroke='currentColor' strokeWidth='1.8' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' d='M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Z' />
        <path strokeLinecap='round' strokeLinejoin='round' d='M8 15s1.5 2 4 2 4-2 4-2M9 10h.01M15 10h.01' />
      </svg>
    ),
  },
  {
    label: 'Emoji',
    icon: (
      <svg className='h-5 w-5' fill='none' stroke='currentColor' strokeWidth='1.8' viewBox='0 0 24 24'>
        <circle cx='12' cy='12' r='9' />
        <path strokeLinecap='round' strokeLinejoin='round' d='M8.5 14.5a5 5 0 0 0 7 0M9 10h.01M15 10h.01' />
      </svg>
    ),
  },
];

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
      <main className={`relative flex h-full flex-col items-center justify-center overflow-hidden px-6 text-center ${isDark ? 'bg-slate-950/20' : 'bg-slate-50/70'}`}>
        <div className={`absolute inset-0 opacity-70 ${isDark ? 'bg-[radial-gradient(circle_at_top,rgba(52,211,153,0.16),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(56,189,248,0.16),transparent_32%)]' : 'bg-[radial-gradient(circle_at_top,rgba(110,231,183,0.22),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(125,211,252,0.28),transparent_32%)]'}`} />
        <div className={`frost-panel relative max-w-xl rounded-[36px] border px-8 py-10 ${isDark ? 'border-white/10 bg-slate-900/60 text-white' : 'border-white bg-white/90 text-slate-900'}`}>
          <div className='mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-emerald-500 to-sky-500 text-4xl shadow-lg'>
            💬
          </div>
          <h2 className='text-3xl font-semibold'>Open a conversation to start messaging.</h2>
          <p className={`mt-3 text-sm leading-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Choose a chat from the list to view history, send messages, share media, and use AI-assisted replies.
          </p>
          <div className='mt-6 grid gap-3 sm:grid-cols-3'>
            {['Direct chat', 'Shared files', 'AI replies'].map((item) => (
              <div key={item} className={`rounded-[22px] border px-3 py-3 text-xs font-medium ${isDark ? 'border-white/8 bg-white/5 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
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
    <section className={`relative flex min-h-0 h-full flex-col ${isDark ? 'bg-[#d8eeeb]/[0.06]' : 'bg-[#eef8f6]'}`}>
      <div className={`absolute inset-0 opacity-40 ${isDark ? 'bg-[radial-gradient(circle,rgba(255,255,255,0.04)_1px,transparent_1px)]' : 'bg-[radial-gradient(circle,rgba(15,23,42,0.05)_1px,transparent_1px)]'} [background-size:26px_26px]`} />

      <header className={`halo-divider relative z-10 flex items-center justify-between gap-4 px-4 py-4 backdrop-blur-xl ${isDark ? 'bg-[#d8eeeb]/10' : 'bg-[#dff3f0]/95'}`}>
        <div className='flex min-w-0 items-center gap-3'>
          <button
            type='button'
            onClick={() => setSelectedUser(null)}
            className={`rounded-xl p-2 transition lg:hidden ${isDark ? 'text-white hover:bg-slate-700/40' : 'text-slate-700 hover:bg-slate-200'}`}
          >
            <svg className='h-5 w-5' fill='currentColor' viewBox='0 0 20 20'>
              <path fillRule='evenodd' d='M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z' clipRule='evenodd' />
            </svg>
          </button>

          <div className='relative shrink-0'>
            <img src={selectedUser.profilePic || assets.avatar_icon} alt='selected user' className='h-16 w-16 rounded-full object-cover shadow-lg' />
            <div className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 ${isDark ? 'border-slate-900' : 'border-white'} ${isOnline ? 'bg-emerald-400' : 'bg-slate-400'}`} />
          </div>

          <div className='min-w-0'>
            <h3 className={`truncate text-3xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedUser.fullName.split(' ')[0]}</h3>
            {peerIsTyping ? (
              <TypingIndicator />
            ) : (
              <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{isOnline ? 'Online' : 'Busy'}</p>
            )}
          </div>
        </div>

        <div className='hidden items-center gap-2 xl:flex'>
          {headerActions.map((action) => (
            <button
              key={action.label}
              type='button'
              title={action.label}
              className={`flex h-11 w-11 items-center justify-center rounded-full border ${isDark ? 'border-white/10 bg-white/5 text-emerald-200' : 'border-emerald-100 bg-white/90 text-emerald-700'}`}
            >
              {action.icon}
            </button>
          ))}
        </div>
      </header>

      <div className={`relative z-10 min-h-0 flex-1 overflow-y-auto px-4 py-6 scrollbar-thin overscroll-contain ${isDark ? 'scrollbar-thumb-slate-600 scrollbar-track-slate-800' : 'scrollbar-thumb-slate-300 scrollbar-track-slate-100'}`}>
        <div className='mx-auto flex max-w-4xl flex-col gap-4'>
          <div className='flex items-center gap-3'>
            <img src={selectedUser.profilePic || assets.avatar_icon} alt='selected user' className='h-12 w-12 rounded-full object-cover' />
            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          {isMessagesLoading && (
            <div className='space-y-3'>
              {[1, 2, 3].map((item) => (
                <div key={item} className={`h-[72px] animate-pulse rounded-3xl ${isDark ? 'bg-slate-800/70' : 'bg-white/70'}`} />
              ))}
            </div>
          )}

          {!isMessagesLoading && messages.length === 0 && (
            <div className={`mx-auto mt-10 max-w-md rounded-[30px] border px-6 py-8 text-center shadow-xl ${isDark ? 'border-white/10 bg-slate-900/70 text-slate-200' : 'border-slate-200 bg-white text-slate-700'}`}>
              <div className='mb-3 text-4xl'>👋</div>
              <p className='text-lg font-semibold'>Say hello to {selectedUser.fullName}</p>
              <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Start with a short message or share an image to begin the conversation.</p>
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

      <form onSubmit={handleSendMessage} className={`relative z-10 border-t px-4 py-4 backdrop-blur-xl ${isDark ? 'border-white/10 bg-white/5' : 'border-emerald-100 bg-white/92'}`}>
        <div className='mx-auto flex max-w-4xl flex-col gap-3'>
          <div className='lg:hidden'>
            <AIAssistantPanel selectedUser={selectedUser} messages={messages} onSuggestionPick={handleSuggestionPick} compact />
          </div>

          <div className={`flex items-center gap-3 rounded-[30px] border px-4 py-3 ${isDark ? 'border-white/10 bg-slate-900/75' : 'border-emerald-100 bg-white shadow-sm'}`}>
            <label htmlFor='image' className={`flex h-12 w-12 cursor-pointer items-center justify-center rounded-full ${isDark ? 'bg-emerald-500/10 text-emerald-200' : 'bg-emerald-50 text-emerald-700'}`} title='Send image'>
              <svg className='h-5 w-5' fill='none' stroke='currentColor' strokeWidth='1.8' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M12 5v14m7-7H5' />
              </svg>
            </label>
            <input onChange={handleSendImage} id='image' type='file' accept='image/png,image/jpeg,image/gif,image/webp' hidden />

            {composerActions.map((action) => (
              <button
                key={action.label}
                type='button'
                title={action.label}
                className={`flex h-12 w-12 items-center justify-center rounded-full ${isDark ? 'bg-white/6 text-slate-200' : 'bg-emerald-50 text-emerald-700'}`}
              >
                {action.icon}
              </button>
            ))}

            <div className='relative flex-1'>
              <span className='absolute -top-1 left-0 h-3 w-3 rounded-full bg-emerald-400' />
              <input
                value={input}
                onChange={handleInputChange}
                className={`w-full bg-transparent px-4 py-2 text-lg outline-none ${isDark ? 'text-white placeholder-slate-400' : 'text-slate-900 placeholder-slate-500'}`}
                placeholder='Write your message...'
                disabled={loading}
              />
            </div>

            <button
              type='button'
              className={`flex h-12 w-12 items-center justify-center rounded-full ${isDark ? 'bg-emerald-500/10 text-emerald-200' : 'bg-emerald-50 text-emerald-700'}`}
              title='Voice note'
            >
              <svg className='h-5 w-5' fill='none' stroke='currentColor' strokeWidth='1.8' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M12 3a3 3 0 0 0-3 3v6a3 3 0 1 0 6 0V6a3 3 0 0 0-3-3Zm6 9a6 6 0 0 1-12 0M12 18v3m-4 0h8' />
              </svg>
            </button>

            <button
              type='submit'
              disabled={loading || !input.trim()}
              className='flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 text-white shadow-lg transition hover:from-emerald-600 hover:to-sky-600 disabled:cursor-not-allowed disabled:opacity-50'
              title='Send message'
            >
              {loading ? (
                <svg className='h-5 w-5 animate-spin' fill='none' viewBox='0 0 24 24'>
                  <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                  <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                </svg>
              ) : (
                <svg className='h-5 w-5' fill='currentColor' viewBox='0 0 24 24'>
                  <path d='m3.4 20.4 17.45-7.48a1 1 0 0 0 0-1.84L3.4 3.6a1 1 0 0 0-1.38 1.16l1.58 5.9a1 1 0 0 0 .74.72l8.05 1.62-8.05 1.62a1 1 0 0 0-.74.72l-1.58 5.9A1 1 0 0 0 3.4 20.4Z' />
                </svg>
              )}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
};

export default ChatContainer;
