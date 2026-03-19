import React, { useMemo, useState } from 'react';
import assets from '../assets/assets';
import { useAuth, useChat, useTheme } from '../../context';
import AIAssistantPanel from './AIAssistantPanel';

const RightSidebar = () => {
  const { selectedUser, messages } = useChat();
  const { authUser, onlineUsers } = useAuth();
  const { isDark } = useTheme();
  const [activePanel, setActivePanel] = useState('info');

  const msgImages = useMemo(() => messages.filter((msg) => msg.image).map((msg) => msg.image), [messages]);
  const myMessageCount = useMemo(() => messages.filter((msg) => msg.senderId === authUser?._id).length, [authUser?._id, messages]);

  const isOnline = selectedUser ? onlineUsers.includes(selectedUser._id) : false;
  const joinDate = selectedUser?.createdAt
    ? new Date(selectedUser.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Unknown';

  const panels = [
    { id: 'info', icon: '👤', label: 'Contact' },
    { id: 'media', icon: '🖼️', label: 'Media' },
    { id: 'docs', icon: '📄', label: 'Docs' },
    { id: 'ai', icon: '✦', label: 'AI' },
  ];

  const renderPanel = () => {
    if (!selectedUser) {
      return (
        <div className={`rounded-[28px] p-5 ${isDark ? 'bg-slate-900/90 text-white' : 'bg-white text-slate-900'}`}>
          <p className='section-kicker'>Workspace tips</p>
          <h3 className='mt-3 text-xl font-semibold'>Select a chat to open actions</h3>
          <p className={`mt-2 text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            The right rail gives you fast access to contact details, shared media, documents, and AI tools once a conversation is active.
          </p>
        </div>
      );
    }

    if (activePanel === 'ai') {
      return <AIAssistantPanel selectedUser={selectedUser} messages={messages} />;
    }

    if (activePanel === 'media') {
      return (
        <div className={`rounded-[28px] p-5 ${isDark ? 'bg-slate-900/90 text-white' : 'bg-white text-slate-900'}`}>
          <p className='section-kicker'>Shared media</p>
          <h3 className='mt-3 text-xl font-semibold'>Recent files and images</h3>
          <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{msgImages.length} shared item{msgImages.length === 1 ? '' : 's'} in this thread.</p>
          {msgImages.length === 0 ? (
            <div className={`mt-4 rounded-2xl px-4 py-6 text-center text-sm ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
              No shared photos yet.
            </div>
          ) : (
            <div className='mt-4 grid grid-cols-2 gap-2'>
              {msgImages.slice(0, 6).map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type='button'
                  onClick={() => window.open(image, '_blank')}
                  className='overflow-hidden rounded-2xl'
                >
                  <img src={image} alt='shared' className='h-24 w-full object-cover' />
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (activePanel === 'docs') {
      return (
        <div className={`rounded-[28px] p-5 ${isDark ? 'bg-slate-900/90 text-white' : 'bg-white text-slate-900'}`}>
          <p className='section-kicker'>Documents</p>
          <h3 className='mt-3 text-xl font-semibold'>Conversation details</h3>
          <div className='mt-4 space-y-3'>
            {[
              { label: 'Messages sent by you', value: myMessageCount },
              { label: 'Member since', value: joinDate },
              { label: 'Presence', value: isOnline ? 'Online now' : 'Offline' },
            ].map((item) => (
              <div key={item.label} className={`rounded-2xl px-4 py-4 ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                <p className={`text-[11px] uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.label}</p>
                <p className='mt-2 text-sm font-semibold'>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className={`rounded-[28px] p-5 ${isDark ? 'bg-slate-900/90 text-white' : 'bg-white text-slate-900'}`}>
        <div className='flex items-center gap-3'>
          <div className='relative'>
            <img src={selectedUser.profilePic || assets.avatar_icon} alt='profile' className='h-16 w-16 rounded-full object-cover' />
            <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 ${isDark ? 'border-slate-900' : 'border-white'} ${isOnline ? 'bg-emerald-400' : isDark ? 'bg-slate-500' : 'bg-slate-300'}`} />
          </div>
          <div>
            <p className='section-kicker'>Contact</p>
            <h3 className='mt-2 text-xl font-semibold'>{selectedUser.fullName}</h3>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{selectedUser.email}</p>
          </div>
        </div>
        {selectedUser.bio && (
          <p className={`mt-4 rounded-2xl px-4 py-4 text-sm leading-6 ${isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
            {selectedUser.bio}
          </p>
        )}
        <div className='mt-4 grid grid-cols-2 gap-3'>
          {[
            { label: 'Messages', value: messages.length },
            { label: 'Shared media', value: msgImages.length },
          ].map((item) => (
            <div key={item.label} className={`rounded-2xl px-4 py-4 ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
              <p className={`text-[11px] uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.label}</p>
              <p className='mt-2 text-sm font-semibold'>{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <aside className={`relative hidden h-full w-[92px] shrink-0 border-l lg:flex lg:flex-col lg:items-center lg:justify-between lg:py-5 ${isDark ? 'border-white/10 bg-white/4 text-white' : 'border-slate-200/70 bg-white/55 text-slate-900'}`}>
      <div className='relative flex h-full w-full flex-col items-center justify-between'>
        <div className='space-y-4'>
          <div className='flex justify-center'>
            <img
              src={selectedUser?.profilePic || authUser?.profilePic || assets.avatar_icon}
              alt='active profile'
              className='h-16 w-16 rounded-full object-cover shadow-lg'
            />
          </div>

          <div className='flex flex-col items-center gap-4'>
            {panels.map((panel) => (
              <button
                key={panel.id}
                type='button'
                onClick={() => setActivePanel(panel.id)}
                className={`flex h-14 w-14 items-center justify-center rounded-full text-xl transition ${activePanel === panel.id ? 'bg-[#07b28a] text-white shadow-lg' : isDark ? 'bg-white/10 text-slate-200 hover:bg-white/16' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                title={panel.label}
              >
                {panel.icon}
              </button>
            ))}
          </div>
        </div>

        <div className='pb-4'>
          <button
            type='button'
            onClick={() => setActivePanel('ai')}
            className='flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-2xl text-[#07b28a] shadow-xl dark:bg-black'
            title='AI assistant'
          >
            ✦
          </button>
        </div>

        <div className='pointer-events-none absolute left-[-356px] top-0 hidden h-full w-[336px] pl-4 xl:block'>
          <div className='pointer-events-auto h-full'>
            {renderPanel()}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;
