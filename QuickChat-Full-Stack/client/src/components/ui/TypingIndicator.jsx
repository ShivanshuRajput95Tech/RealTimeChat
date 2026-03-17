import React from 'react';

const TypingIndicator = () => {
  return (
    <div className='flex items-center gap-1 text-slate-300 text-xs italic'>
      <span>typing</span>
      <span className='flex gap-0.5'>
        <span className='w-1 h-1 bg-cyan-400 rounded-full animate-bounce' style={{ animationDelay: '0ms' }}></span>
        <span className='w-1 h-1 bg-cyan-400 rounded-full animate-bounce' style={{ animationDelay: '150ms' }}></span>
        <span className='w-1 h-1 bg-cyan-400 rounded-full animate-bounce' style={{ animationDelay: '300ms' }}></span>
      </span>
    </div>
  );
};

export default TypingIndicator;
