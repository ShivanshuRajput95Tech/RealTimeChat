import React from 'react';
import StatusBadge from './StatusBadge';
import assets from '../../assets/assets';

const UserCard = ({ user, onSelect, selected, online, unseen }) => {
  return (
    <button
      type='button'
      onClick={() => onSelect(user)}
      className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-3 transition-all duration-200 ${
        selected ? 'bg-violet-800/60 shadow-lg' : 'hover:bg-slate-700/40'
      }`}
    >
      <div className='relative'>
        <img
          src={user?.profilePic || assets.avatar_icon}
          alt={`${user?.fullName || 'User'} avatar`}
          className='w-11 h-11 rounded-full object-cover border border-white/20'
        />
        <span className='absolute bottom-0 right-0 block w-3 h-3 rounded-full ring-2 ring-slate-900'>
          <StatusBadge online={online} />
        </span>
      </div>
      <div className='flex-1 overflow-hidden'>
        <p className='text-sm font-semibold line-clamp-1'>{user.fullName}</p>
        <p className='text-xs text-slate-300 line-clamp-1'>{user.bio || 'No status yet'}</p>
      </div>
      {unseen > 0 && (
        <span className='inline-flex items-center justify-center min-w-[22px] h-5 rounded-full bg-violet-500 text-white text-xs font-semibold'>
          {unseen}
        </span>
      )}
    </button>
  );
};

export default UserCard;
