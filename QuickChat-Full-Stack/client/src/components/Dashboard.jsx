import React, { useMemo } from 'react';
import { useAuth, useChat, useTheme } from '../../context';

const Dashboard = () => {
  const { users, messages, unseenMessages } = useChat();
  const { authUser, onlineUsers } = useAuth();
  const { isDark } = useTheme();

  const stats = useMemo(() => {
    const totalMessages = messages.length;
    const totalUnseen = Object.values(unseenMessages).reduce((a, b) => a + (b || 0), 0);
    const onlineCount = onlineUsers.length;
    const totalUsers = users.length;

    return {
      totalMessages,
      totalUnseen,
      onlineCount,
      totalUsers,
    };
  }, [messages, onlineUsers, unseenMessages, users]);

  const cards = [
    { label: 'Contacts', value: stats.totalUsers, icon: '👥', tone: isDark ? 'text-emerald-200' : 'text-emerald-700' },
    { label: 'Messages in thread', value: stats.totalMessages, icon: '💬', tone: isDark ? 'text-sky-200' : 'text-sky-700' },
    { label: 'Unread items', value: stats.totalUnseen, icon: '🔔', tone: isDark ? 'text-amber-200' : 'text-amber-700' },
    { label: 'Online now', value: stats.onlineCount, icon: '🟢', tone: isDark ? 'text-teal-200' : 'text-teal-700' },
  ];

  return (
    <div className='space-y-4 p-1'>
      <section className={`surface-border rounded-[26px] p-5 ${isDark ? 'bg-slate-900/65' : 'bg-white/90'}`}>
        <p className='section-kicker'>Overview</p>
        <h2 className='mt-3 text-2xl font-semibold'>Welcome back, {authUser?.fullName?.split(' ')[0]}.</h2>
        <p className={`mt-2 text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Here&apos;s a quick snapshot of your current workspace activity so you can decide what needs attention first.
        </p>
      </section>

      <div className='grid grid-cols-2 gap-3'>
        {cards.map((card) => (
          <article key={card.label} className={`surface-border rounded-[24px] p-4 ${isDark ? 'bg-slate-900/65' : 'bg-white/90'}`}>
            <div className='flex items-center justify-between'>
              <p className={`text-[11px] uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{card.label}</p>
              <span className='text-lg'>{card.icon}</span>
            </div>
            <p className={`mt-3 text-2xl font-semibold ${card.tone}`}>{card.value}</p>
          </article>
        ))}
      </div>

      <section className={`surface-border rounded-[26px] p-5 ${isDark ? 'bg-slate-900/65' : 'bg-white/90'}`}>
        <p className='section-kicker'>Recommendations</p>
        <div className='mt-4 space-y-3'>
          {[
            authUser?.bio ? 'Your profile bio is complete and visible to teammates.' : 'Add a short bio to make your profile easier to recognise in search.',
            `${stats.totalUnseen} unread message${stats.totalUnseen === 1 ? '' : 's'} currently need review.`,
            `${stats.onlineCount} contact${stats.onlineCount === 1 ? '' : 's'} ${stats.onlineCount === 1 ? 'is' : 'are'} online right now.`,
          ].map((item) => (
            <div key={item} className={`rounded-2xl px-4 py-3 text-sm leading-6 ${isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
