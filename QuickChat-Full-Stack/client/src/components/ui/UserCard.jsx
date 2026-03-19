import React from 'react';
import assets from '../../assets/assets';
import { useTheme } from '../../../context';

const UserCard = ({ user, onSelect, selected, online, unseen }) => {
  const { isDark } = useTheme();

  return (
    <button
      type='button'
      onClick={() => onSelect(user)}
      className={`group relative w-full rounded-[28px] px-4 py-4 text-left transition-all duration-200 ${
        selected
          ? isDark
            ? 'bg-emerald-500/12 ring-1 ring-emerald-400/20'
            : 'bg-emerald-50 ring-1 ring-emerald-200'
          : isDark
            ? 'hover:bg-white/6'
            : 'hover:bg-slate-50'
      }`}
    >
      <div className='flex items-center gap-3'>
        <div className='relative shrink-0'>
          <img
            src={user?.profilePic || assets.avatar_icon}
            alt={`${user?.fullName || 'User'} avatar`}
            className='h-14 w-14 rounded-full object-cover shadow-md'
          />
          <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 ${isDark ? 'border-slate-900' : 'border-white'} ${online ? 'bg-emerald-400' : isDark ? 'bg-slate-500' : 'bg-slate-300'}`} />
        </div>

        <div className='min-w-0 flex-1'>
          <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0'>
              <p className={`truncate text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.fullName}</p>
              <p className={`mt-1 truncate text-sm ${online ? 'text-emerald-400' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {selected ? 'Open conversation' : unseen > 0 ? 'Typing…' : user.bio || 'Available for chat'}
              </p>
            </div>
            <div className='shrink-0 text-right'>
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{unseen > 0 ? 'New' : 'Now'}</p>
              {unseen > 0 && (
                <span className='mt-2 inline-flex min-w-[28px] items-center justify-center rounded-full bg-emerald-500 px-2 py-1 text-[11px] font-semibold text-white'>
                  {unseen > 99 ? '99+' : unseen}
                </span>
              )}
            </div>
          </div>

          <div className='mt-3 flex items-center gap-2'>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${selected ? (isDark ? 'bg-emerald-500/12 text-emerald-200' : 'bg-emerald-100 text-emerald-700') : isDark ? 'bg-white/6 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
              {selected ? 'Selected' : online ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};

export default UserCard;
