import React from 'react';
import { formatMessageTime } from '../../lib/utils';
import assets from '../../assets/assets';

const MessageBubble = ({ msg, isMine, peerAvatar, myAvatar }) => {
  const showImage = msg.image && msg.image.trim() !== '';
  const showText = msg.text && msg.text.trim() !== '';

  return (
    <div className={`flex items-end gap-2 mb-4 max-w-full group ${isMine ? 'justify-end' : 'justify-start'}`}>
      {!isMine && (
        <img 
          src={peerAvatar || assets.avatar_icon} 
          alt='sender avatar' 
          className='w-8 h-8 rounded-full object-cover border border-white/20 shadow-md' 
        />
      )}

      <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-4 py-2 text-sm break-words max-w-xs transition-all duration-200 ${
          isMine 
            ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-none shadow-lg' 
            : 'bg-gradient-to-br from-slate-700 to-slate-800 text-slate-100 rounded-bl-none shadow-md'
        } hover:shadow-lg`}>
          {showImage && (
            <img 
              src={msg.image} 
              alt='attachment' 
              className='max-w-sm max-h-48 rounded-lg mb-2 cursor-pointer hover:opacity-90 transition shadow-md' 
              onClick={() => window.open(msg.image, '_blank')}
            />
          )}
          
          {showText && (
            <p className='whitespace-pre-wrap'>{msg.text}</p>
          )}
          
          <div className='flex items-center gap-1 mt-1'>
            <time className={`text-[11px] font-medium ${isMine ? 'text-violet-100' : 'text-slate-400'}`}>
              {formatMessageTime(msg.createdAt)}
            </time>
            
            {isMine && (
              <span className={`text-xs ml-1 ${msg.seen ? 'text-violet-100' : 'text-slate-400'}`} title={msg.seen ? 'Seen' : 'Sent'}>
                {msg.seen ? '✓✓' : '✓'}
              </span>
            )}
          </div>
        </div>

        {msg.editedAt && (
          <span className={`text-[10px] mt-1 ${isMine ? 'text-slate-400' : 'text-slate-500'} italic`}>
            (edited)
          </span>
        )}
      </div>

      {isMine && (
        <img 
          src={myAvatar || assets.avatar_icon} 
          alt='my avatar' 
          className='w-8 h-8 rounded-full object-cover border border-white/20 shadow-md' 
        />
      )}
    </div>
  );
};

export default MessageBubble;
