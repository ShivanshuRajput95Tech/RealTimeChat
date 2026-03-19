import React from 'react';
import assets from '../assets/assets';
import { useTheme } from '../../context';

const icons = [
  {
    label: 'Messages',
    active: true,
    icon: (
      <svg className='h-6 w-6' fill='none' stroke='currentColor' strokeWidth='1.8' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' d='M8 10h8M8 14h5m-8 6 2.6-2.1a2 2 0 011.25-.44H18a3 3 0 003-3V7a3 3 0 00-3-3H6A3 3 0 003 7v10a3 3 0 002 3z' />
      </svg>
    ),
  },
  {
    label: 'Contacts',
    icon: (
      <svg className='h-6 w-6' fill='none' stroke='currentColor' strokeWidth='1.8' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' d='M15 19v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1m15-8a4 4 0 11-8 0 4 4 0 018 0zm6 8v-1a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' />
      </svg>
    ),
  },
  {
    label: 'Notifications',
    icon: (
      <svg className='h-6 w-6' fill='none' stroke='currentColor' strokeWidth='1.8' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' d='M15 17h5l-1.4-1.4A2 2 0 0118 14.17V11a6 6 0 10-12 0v3.17a2 2 0 01-.59 1.42L4 17h5m6 0a3 3 0 11-6 0m6 0H9' />
      </svg>
    ),
  },
  {
    label: 'Files',
    icon: (
      <svg className='h-6 w-6' fill='none' stroke='currentColor' strokeWidth='1.8' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' d='M7 3h7l5 5v13a1 1 0 01-1 1H7a2 2 0 01-2-2V5a2 2 0 012-2z' />
      </svg>
    ),
  },
  {
    label: 'Favourites',
    icon: (
      <svg className='h-6 w-6' fill='none' stroke='currentColor' strokeWidth='1.8' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' d='m12 3.5 2.8 5.68 6.27.91-4.54 4.43 1.07 6.25L12 17.77 6.4 20.77l1.07-6.25-4.54-4.43 6.27-.91L12 3.5z' />
      </svg>
    ),
  },
  {
    label: 'Settings',
    icon: (
      <svg className='h-6 w-6' fill='none' stroke='currentColor' strokeWidth='1.8' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' d='M10.33 4.32a1 1 0 011.34-.45l.64.31a1 1 0 001.39-.54l.22-.68a1 1 0 011.22-.66l1.44.4a1 1 0 01.7 1.18l-.16.7a1 1 0 00.58 1.13l.63.3a1 1 0 01.49 1.33l-.64 1.36a1 1 0 00.22 1.16l.53.53a1 1 0 010 1.42l-1.02 1.02a1 1 0 01-1.42 0l-.53-.53a1 1 0 00-1.16-.22l-1.36.64a1 1 0 01-1.33-.49l-.3-.63a1 1 0 00-1.13-.58l-.7.16a1 1 0 01-1.18-.7l-.4-1.44a1 1 0 01.66-1.22l.68-.22a1 1 0 00.54-1.39l-.31-.64a1 1 0 01.45-1.34l1.34-.67z' />
        <circle cx='12' cy='12' r='3' />
      </svg>
    ),
  },
];

const WorkspaceRail = () => {
  const { isDark } = useTheme();

  return (
    <aside className={`hidden h-full flex-col items-center justify-between border-r px-3 py-4 xl:flex ${isDark ? 'border-white/10 bg-emerald-500/90 text-white' : 'border-emerald-200 bg-emerald-500 text-white'}`}>
      <div className='flex flex-col items-center gap-4'>
        <div className='flex h-16 w-16 items-center justify-center rounded-[24px] bg-white/15 shadow-lg backdrop-blur'>
          <img src={assets.logo_icon} alt='QuickChat' className='h-9 w-9' />
        </div>
        <div className='space-y-3'>
          {icons.map((item) => (
            <button
              key={item.label}
              type='button'
              title={item.label}
              className={`flex h-12 w-12 items-center justify-center rounded-2xl transition ${item.active ? 'bg-white text-emerald-600 shadow-lg' : 'bg-white/10 text-white hover:bg-white/18'}`}
            >
              {item.icon}
            </button>
          ))}
        </div>
      </div>

      <button
        type='button'
        title='Logout shortcut'
        className='flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white transition hover:bg-white/18'
      >
        <svg className='h-6 w-6' fill='none' stroke='currentColor' strokeWidth='1.8' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' d='M10 17l5-5-5-5m5 5H3m8 8h6a2 2 0 002-2V6a2 2 0 00-2-2h-6' />
        </svg>
      </button>
    </aside>
  );
};

export default WorkspaceRail;
