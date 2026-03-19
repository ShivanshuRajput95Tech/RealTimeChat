import React from 'react';
import { useTheme } from '../../../context';
import assets from '../../assets/assets';
import { formatMessageTime } from '../../lib/utils';

const MessageBubble = ({ msg, isMine, peerAvatar, myAvatar }) => {
  const { isDark } = useTheme();
  const showImage = msg.image && msg.image.trim() !== '';
  const showText = msg.text && msg.text.trim() !== '';

  return (
    <div className={`flex max-w-full items-end gap-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
      {!isMine && (
        <img
          src={peerAvatar || assets.avatar_icon}
          alt='sender avatar'
          className='h-12 w-12 rounded-full object-cover shadow-md'
        />
      )}

      <div className={`flex max-w-[min(100%,32rem)] flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        <div
          className={`relative overflow-hidden rounded-[30px] px-5 py-4 text-base shadow-lg ${
            isMine
              ? 'bg-[#07b28a] text-white rounded-br-[10px]'
              : isDark
                ? 'bg-slate-900/88 text-slate-100 rounded-bl-[10px]'
                : 'bg-white text-slate-900 rounded-bl-[10px]'
          }`}
        >
          {showImage && (
            <button type='button' onClick={() => window.open(msg.image, '_blank')} className='mb-3 overflow-hidden rounded-[24px]'>
              <img src={msg.image} alt='attachment' className='max-h-64 w-full max-w-sm rounded-[24px] object-cover' />
            </button>
          )}

          {showText && <p className='whitespace-pre-wrap leading-7'>{msg.text}</p>}
        </div>

        <div className={`mt-2 flex items-center gap-2 px-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {isMine && <span className='text-[#07b28a]'>✓✓</span>}
          <time>{formatMessageTime(msg.createdAt)}</time>
          {msg.editedAt && <span>• edited</span>}
        </div>
      </div>

      {isMine && (
        <img
          src={myAvatar || assets.avatar_icon}
          alt='my avatar'
          className='h-12 w-12 rounded-full object-cover shadow-md'
        />
      )}
    </div>
  );
};

export default MessageBubble;
