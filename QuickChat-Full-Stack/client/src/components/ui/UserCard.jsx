import React from 'react';
import StatusBadge from './StatusBadge';
import assets from '../../assets/assets';
import { useTheme } from '../../../context';

const UserCard = ({ user, onSelect, selected, online, unseen }) => {
  const { isDark } = useTheme();

  return (
    <button
      type='button'
      onClick={() => onSelect(user)}
      className={`group relative w-full overflow-hidden rounded-[28px] border px-4 py-3.5 text-left transition-all duration-200 ${
        selected
          ? isDark
            ? 'border-violet-400/40 bg-[linear-gradient(135deg,rgba(109,40,217,0.45),rgba(15,23,42,0.15)_45%,rgba(6,182,212,0.18))] shadow-[0_18px_48px_rgba(109,40,217,0.22)]'
            : 'border-violet-300 bg-gradient-to-r from-violet-100 via-white to-cyan-50 shadow-[0_14px_40px_rgba(109,40,217,0.12)]'
          : isDark
            ? 'border-white/8 bg-slate-900/45 hover:border-cyan-400/20 hover:bg-slate-900/70'
            : 'border-slate-200 bg-white/88 hover:border-cyan-200 hover:bg-white'
      }`}
    >
      <div className='absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-cyan-400 via-violet-400 to-fuchsia-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100' />
      <div className={`absolute right-3 top-3 h-16 w-16 rounded-full blur-2xl transition-opacity ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-70'} ${isDark ? 'bg-cyan-400/10' : 'bg-cyan-200/50'}`} />

      <div className='flex items-center gap-3'>
        <div className='relative shrink-0'>
          <img
            src={user?.profilePic || assets.avatar_icon}
            alt={`${user?.fullName || 'User'} avatar`}
            className={`h-12 w-12 rounded-2xl object-cover border shadow-lg ${isDark ? 'border-white/10' : 'border-slate-200'}`}
          />
          <span className={`absolute -bottom-1 -right-1 block rounded-full ${isDark ? 'ring-4 ring-slate-900' : 'ring-4 ring-white'}`}>
            <StatusBadge online={online} />
          </span>
        </div>

        <div className='min-w-0 flex-1'>
          <div className='flex items-center justify-between gap-2'>
            <p className={`truncate text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.fullName}</p>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${online ? 'bg-emerald-500/15 text-emerald-400' : isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-500'}`}>
              {online ? 'Online' : 'Offline'}
            </span>
          </div>

          <p className={`mt-1 truncate text-xs leading-5 ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
            {user.bio || 'Ready to start a conversation'}
          </p>

          <div className='mt-2 flex items-center gap-2'>
            <span className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-emerald-400' : isDark ? 'bg-slate-500' : 'bg-slate-400'}`} />
            <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {selected ? 'Currently in focus' : unseen > 0 ? 'Unread activity waiting' : 'Conversation is calm'}
            </span>
          </div>
        </div>

        <div className='flex flex-col items-end gap-2'>
          {selected && (
            <span className={`text-[10px] font-medium ${isDark ? 'text-cyan-300' : 'text-cyan-600'}`}>
              Active chat
            </span>
          )}
          {unseen > 0 && (
            <span className='inline-flex min-w-[24px] items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 px-1.5 py-1 text-[11px] font-semibold text-white shadow-lg'>
              {unseen > 99 ? '99+' : unseen}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default UserCard;
