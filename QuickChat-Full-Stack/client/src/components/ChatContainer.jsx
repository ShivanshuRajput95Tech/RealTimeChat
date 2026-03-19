import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import assets from '../assets/assets';
import { useAuth, useChat, useTheme } from '../../context';
import AIAssistantPanel from './AIAssistantPanel';
import TypingIndicator from './ui/TypingIndicator';
import MessageBubble from './ui/MessageBubble';

const headerActions = [
  { label: 'Mute', icon: '🔇' },
  { label: 'Search', icon: '⌕' },
  { label: 'Video', icon: '🎥' },
  { label: 'Call', icon: '📞' },
  { label: 'More', icon: '⋮' },
];

const composerActions = [
  { label: 'Add', icon: '+' },
  { label: 'Sticker', icon: '☺' },
  { label: 'Emoji', icon: '☻' },
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
      <main className={`relative flex h-full flex-col items-center justify-center overflow-hidden px-6 text-center ${isDark ? 'bg-slate-950/28' : 'bg-[#eef9f6]'}`}>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(7,178,138,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.10),transparent_24%)] opacity-80' />
        <div className={`relative max-w-xl rounded-[36px] px-8 py-10 ${isDark ? 'bg-slate-900/70 text-white' : 'bg-white/92 text-slate-900'} shadow-xl`}>
          <div className='mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#07b28a] text-4xl text-white shadow-lg'>
            💬
          </div>
          <h2 className='text-3xl font-semibold'>Choose a conversation to begin</h2>
          <p className={`mt-3 text-sm leading-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Open a direct chat from the left column to view the full messenger layout, composer actions, media tools, and AI shortcuts.
          </p>
        </div>
      </main>
    );
  }

  const isOnline = onlineUsers.includes(selectedUser._id);
  const peerIsTyping = isTyping[selectedUser._id];

  return (
    <section className={`relative flex min-h-0 h-full flex-col ${isDark ? 'bg-slate-950/28' : 'bg-[#edf9f6]'}`}>
      <header className={`halo-divider flex items-center justify-between gap-4 px-5 py-5 ${isDark ? 'bg-emerald-950/25' : 'bg-[#def3ee]'}`}>
        <div className='flex min-w-0 items-center gap-4'>
          <button
            type='button'
            onClick={() => setSelectedUser(null)}
            className={`rounded-2xl p-2 transition md:hidden ${isDark ? 'bg-white/8 text-white' : 'bg-white text-slate-700'}`}
          >
            ←
          </button>

          <div className='relative'>
            <img src={selectedUser.profilePic || assets.avatar_icon} alt='selected user' className='h-16 w-16 rounded-full object-cover shadow-lg' />
            <span className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 ${isDark ? 'border-slate-900' : 'border-white'} ${isOnline ? 'bg-emerald-400' : isDark ? 'bg-slate-500' : 'bg-slate-300'}`} />
          </div>

          <div className='min-w-0'>
            <h3 className={`truncate text-[2rem] font-semibold leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedUser.fullName}</h3>
            {peerIsTyping ? (
              <div className='mt-2'><TypingIndicator /></div>
            ) : (
              <p className={`mt-2 text-base ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{isOnline ? 'Online' : 'Offline'}</p>
            )}
          </div>
        </div>

        <div className='hidden items-center gap-3 lg:flex'>
          {headerActions.map((item) => (
            <button
              key={item.label}
              type='button'
              className={`flex h-12 w-12 items-center justify-center rounded-full text-xl ${isDark ? 'bg-white/8 text-slate-200 hover:bg-white/14' : 'bg-white text-[#07b28a] hover:bg-emerald-50'}`}
              title={item.label}
            >
              {item.icon}
            </button>
          ))}
        </div>
      </header>

      <div className={`chat-surface min-h-0 flex-1 overflow-y-auto px-4 py-5 ${isDark ? 'scrollbar-thumb-slate-600 scrollbar-track-slate-800' : 'scrollbar-thumb-slate-300 scrollbar-track-slate-100'}`}>
        <div className='absolute inset-0 opacity-35 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(7,178,138,0.08),transparent_28%)]' />
        <div className='relative mx-auto flex max-w-4xl flex-col gap-6'>
          {isMessagesLoading && (
            <div className='space-y-3'>
              {[1, 2, 3].map((item) => (
                <div key={item} className={`h-24 animate-pulse rounded-[28px] ${isDark ? 'bg-white/6' : 'bg-white/70'}`} />
              ))}
            </div>
          )}

          {!isMessagesLoading && messages.length === 0 && (
            <div className={`mx-auto mt-10 max-w-md rounded-[32px] px-6 py-8 text-center ${isDark ? 'bg-slate-900/75 text-slate-200' : 'bg-white text-slate-700'} shadow-xl`}>
              <div className='mb-3 text-4xl'>👋</div>
              <p className='text-xl font-semibold'>Say hello to {selectedUser.fullName}</p>
              <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Start with a quick note, share an image, or use the AI helper on the right rail for a faster reply.
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

      <form onSubmit={handleSendMessage} className={`px-5 py-5 ${isDark ? 'bg-slate-950/40' : 'bg-transparent'}`}>
        <div className='mx-auto flex max-w-4xl flex-col gap-3'>
          <div className='lg:hidden'>
            <AIAssistantPanel selectedUser={selectedUser} messages={messages} onSuggestionPick={handleSuggestionPick} compact />
          </div>

          <div className={`flex items-center gap-3 rounded-[30px] px-4 py-4 ${isDark ? 'bg-slate-900/80' : 'bg-white'} shadow-[0_20px_50px_rgba(15,23,42,0.08)]`}>
            <label htmlFor='image' className={`flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-full text-2xl ${isDark ? 'bg-emerald-500/12 text-emerald-200' : 'bg-emerald-50 text-[#07b28a]'}`} title='Send image'>
              🖼
            </label>
            <input onChange={handleSendImage} id='image' type='file' accept='image/png,image/jpeg,image/gif,image/webp' hidden />

            <div className='hidden items-center gap-3 md:flex'>
              {composerActions.map((item) => (
                <button
                  key={item.label}
                  type='button'
                  className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl ${isDark ? 'bg-white/8 text-slate-200' : 'bg-emerald-50 text-[#07b28a]'}`}
                  title={item.label}
                >
                  {item.icon}
                </button>
              ))}
            </div>

            <input
              value={input}
              onChange={handleInputChange}
              className={`flex-1 bg-transparent px-2 py-1 text-xl outline-none ${isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`}
              placeholder='Write your message...'
              disabled={loading}
            />

            <button
              type='button'
              className={`hidden h-14 w-14 items-center justify-center rounded-full text-2xl md:flex ${isDark ? 'bg-emerald-500/12 text-emerald-200' : 'bg-emerald-50 text-[#07b28a]'}`}
              title='Voice note'
            >
              🎤
            </button>
            <button
              type='submit'
              disabled={loading || !input.trim()}
              className='flex h-14 w-14 items-center justify-center rounded-full bg-[#79d6c5] text-2xl text-white shadow-lg transition hover:bg-[#07b28a] disabled:cursor-not-allowed disabled:opacity-50'
              title='Send message'
            >
              ➤
            </button>
          </div>
        </div>
      </form>
    </section>
  );
};

export default ChatContainer;
