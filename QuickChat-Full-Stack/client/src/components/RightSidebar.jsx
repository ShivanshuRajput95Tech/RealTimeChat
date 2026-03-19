import React, { useMemo } from 'react';
import assets from '../assets/assets';
import { useAuth, useChat, useTheme } from '../../context';
import AIAssistantPanel from './AIAssistantPanel';

const toolItems = [
  { label: 'Gallery', icon: '🖼️' },
  { label: 'Share', icon: '🔗' },
  { label: 'Documents', icon: '📄' },
  { label: 'Music', icon: '🎵' },
  { label: 'Settings', icon: '⚙️' },
];

const RightSidebar = () => {
  const { selectedUser, messages } = useChat();
  const { authUser, onlineUsers } = useAuth();
  const { isDark } = useTheme();

  const msgImages = useMemo(() => messages.filter((msg) => msg.image).map((msg) => msg.image), [messages]);
  const totalMessages = useMemo(() => messages.length, [messages]);
  const myMessageCount = useMemo(() => messages.filter((msg) => msg.senderId === authUser?._id).length, [authUser?._id, messages]);
  const documents = useMemo(() => messages.filter((msg) => msg.text && msg.text.length > 24).slice(-3), [messages]);

  if (!selectedUser) return null;

  const isOnline = onlineUsers.includes(selectedUser._id);
  const joinDate = selectedUser.createdAt
    ? new Date(selectedUser.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Unknown';

  return (
    <aside className={`hidden min-h-0 h-full border-l p-4 xl:flex xl:gap-4 ${isDark ? 'border-white/10 bg-white/[0.03] text-white' : 'border-slate-200/70 bg-slate-50/50 text-slate-900'}`}>
      <div className='flex shrink-0 flex-col items-center gap-4 pt-2'>
        {toolItems.map((item) => (
          <button
            key={item.label}
            type='button'
            title={item.label}
            className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl ${isDark ? 'bg-[#dff3f0]/10' : 'bg-[#dff3f0]'} shadow-sm`}
          >
            <span aria-hidden='true'>{item.icon}</span>
          </button>
        ))}
      </div>

      <div className='min-h-0 flex-1 overflow-y-auto scrollbar-thin overscroll-contain'>
        <div className={`frost-panel overflow-hidden rounded-[32px] border ${isDark ? 'border-white/10 bg-slate-900/60' : 'border-white/80 bg-white/90'}`}>
          <div className={`h-28 bg-[radial-gradient(circle_at_top,rgba(52,211,153,0.28),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(56,189,248,0.28),transparent_40%)] ${isDark ? 'bg-slate-900' : 'bg-slate-100'}`} />
          <div className='px-5 pb-5'>
            <div className='-mt-12 flex flex-col items-center gap-3'>
              <div className='relative'>
                <img src={selectedUser.profilePic || assets.avatar_icon} alt='profile' className={`h-24 w-24 rounded-[28px] object-cover shadow-2xl ${isDark ? 'border border-white/10' : 'border border-white'}`} />
                <div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 ${isDark ? 'border-slate-900' : 'border-white'} ${isOnline ? 'bg-emerald-400' : 'bg-slate-400'}`} />
              </div>
              <div className='text-center'>
                <p className={`text-[11px] uppercase tracking-[0.22em] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Contact details</p>
                <h3 className={`mt-2 text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedUser.fullName}</h3>
                <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{selectedUser.email}</p>
                <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${isOnline ? 'bg-emerald-500/15 text-emerald-400' : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                  {isOnline ? 'Active now' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className='mt-4 grid grid-cols-2 gap-3'>
          {[
            { label: 'Messages', value: totalMessages, tone: 'text-emerald-400' },
            { label: 'Sent by you', value: myMessageCount, tone: 'text-sky-400' },
            { label: 'Shared media', value: msgImages.length, tone: 'text-amber-400' },
            { label: 'Member since', value: joinDate, tone: isDark ? 'text-slate-200' : 'text-slate-800' },
          ].map((item) => (
            <div key={item.label} className={`rounded-[24px] border p-3 ${isDark ? 'border-white/8 bg-slate-900/60' : 'border-slate-200 bg-white/82'}`}>
              <p className={`text-[11px] uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.label}</p>
              <p className={`mt-2 text-sm font-semibold ${item.tone}`}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className='mt-4'>
          <AIAssistantPanel selectedUser={selectedUser} messages={messages} />
        </div>

        <div className={`mt-4 rounded-[28px] border p-4 ${isDark ? 'border-white/8 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
          <div className='flex items-center justify-between'>
            <h4 className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Shared Media</h4>
            <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{msgImages.length} items</span>
          </div>
          {msgImages.length === 0 ? (
            <div className={`mt-4 rounded-2xl px-4 py-6 text-center text-sm ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
              📸 No shared photos yet.
            </div>
          ) : (
            <div className='mt-4 grid grid-cols-2 gap-2'>
              {msgImages.slice(0, 4).map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  onClick={() => window.open(image, '_blank')}
                  className={`group relative aspect-square overflow-hidden rounded-2xl border ${isDark ? 'border-white/10' : 'border-slate-200'}`}
                  title='Click to view full image'
                  type='button'
                >
                  <img src={image} alt='shared' className='h-full w-full object-cover transition duration-200 group-hover:scale-105' />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={`mt-4 rounded-[28px] border p-4 ${isDark ? 'border-white/8 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
          <div className='flex items-center justify-between'>
            <h4 className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Recent documents</h4>
            <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{documents.length} items</span>
          </div>
          <div className='mt-4 space-y-3'>
            {documents.length === 0 ? (
              <div className={`rounded-2xl px-4 py-4 text-sm ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>No text-heavy updates to pin yet.</div>
            ) : (
              documents.map((item) => (
                <div key={item._id} className={`flex items-start gap-3 rounded-2xl px-4 py-4 ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                  <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-xl text-white'>📄</div>
                  <div className='min-w-0'>
                    <p className='truncate text-sm font-semibold'>{selectedUser.fullName} update</p>
                    <p className={`mt-1 line-clamp-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;
