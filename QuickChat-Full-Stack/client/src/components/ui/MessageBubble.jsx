import React from 'react';
import { formatMessageTime } from '../../lib/utils';
import assets from '../../assets/assets';
import { useTheme } from '../../../context';

const MessageBubble = ({ msg, isMine, peerAvatar, myAvatar }) => {
  const { isDark } = useTheme();
  const showImage = msg.image && msg.image.trim() !== '';
  const showText = msg.text && msg.text.trim() !== '';

  const bubbleClass = isMine
    ? 'bg-[linear-gradient(135deg,#7c3aed_0%,#8b5cf6_42%,#06b6d4_100%)] text-white rounded-[26px_26px_10px_26px] shadow-[0_18px_40px_rgba(79,70,229,0.24)]'
    : isDark
      ? 'bg-slate-800/92 text-slate-100 rounded-[26px_26px_26px_10px] border border-white/6 shadow-[0_18px_34px_rgba(15,23,42,0.45)]'
      : 'bg-white/96 text-slate-800 rounded-[26px_26px_26px_10px] border border-slate-200 shadow-[0_12px_30px_rgba(15,23,42,0.08)]';

  return (
    <div className={`flex max-w-full items-end gap-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
      {!isMine && (
        <img
          src={peerAvatar || assets.avatar_icon}
          alt='sender avatar'
          className={`h-8 w-8 rounded-full object-cover shadow-md ${isDark ? 'border border-white/10' : 'border border-slate-200'}`}
        />
      )}

      <div className={`flex max-w-[min(100%,28rem)] flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        <div className={`relative overflow-hidden px-4 py-3.5 text-sm break-words transition-all duration-200 ${bubbleClass}`}>
          {isMine && <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.24),transparent_30%)]' />}
          {showImage && (
            <button
              type='button'
              onClick={() => window.open(msg.image, '_blank')}
              className='mb-2 overflow-hidden rounded-2xl'
            >
              <img
                src={msg.image}
                alt='attachment'
                className='max-h-56 w-full max-w-sm rounded-2xl object-cover transition duration-200 hover:scale-[1.02]'
              />
            </button>
          )}

          {showText && <p className='whitespace-pre-wrap leading-6'>{msg.text}</p>}

          <div className='mt-3 flex items-center gap-1.5'>
            <time className={`text-[11px] font-medium ${isMine ? 'text-violet-100' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {formatMessageTime(msg.createdAt)}
            </time>

            {isMine && (
              <span className={`text-xs ${msg.seen ? 'text-cyan-100' : 'text-violet-200/80'}`} title={msg.seen ? 'Seen' : 'Sent'}>
                {msg.seen ? '✓✓' : '✓'}
              </span>
            )}
          </div>
        </div>

        {msg.editedAt && (
          <span className={`mt-1 px-1 text-[10px] italic ${isMine ? 'text-slate-400' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            edited
          </span>
        )}
      </div>

      {isMine && (
        <img
          src={myAvatar || assets.avatar_icon}
          alt='my avatar'
          className={`h-8 w-8 rounded-full object-cover shadow-md ${isDark ? 'border border-white/10' : 'border border-slate-200'}`}
        />
      )}
    </div>
  );
};

export default MessageBubble;
