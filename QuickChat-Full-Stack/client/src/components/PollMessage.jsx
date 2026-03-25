import React, { useContext, useState, useRef, useEffect } from 'react'
import { AIContext } from '../context/AIContext'
import { ChatContext } from '../context/ChatContext'
import { WorkspaceContext } from '../context/WorkspaceContext'
import toast from 'react-hot-toast'

const POLL_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']

const PollMessage = ({ poll, onVote, authUserId }) => {
  const totalVotes = poll.options?.reduce((sum, opt) => sum + (opt.voters?.length || 0), 0) || 0

  return (
    <div className="bg-surface-700/60 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden scale-in max-w-[380px]">
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <span className="text-xs text-zinc-400 font-medium">Poll</span>
        {poll.closed && <span className="text-[10px] text-danger bg-danger/10 px-2 py-0.5 rounded-full font-medium">Closed</span>}
      </div>
      <div className="p-4">
        <p className="text-sm text-white font-semibold mb-3">{poll.question}</p>
        <div className="space-y-2">
          {poll.options?.map((opt, i) => {
            const voteCount = opt.voters?.length || 0
            const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0
            const hasVoted = opt.voters?.some(v => (typeof v === 'string' ? v : v._id) === authUserId)

            return (
              <button
                key={opt._id || i}
                onClick={() => !poll.closed && onVote(poll._id, opt._id)}
                disabled={poll.closed}
                className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer group relative overflow-hidden ${
                  hasVoted ? 'bg-primary/10 border border-primary/30' : 'bg-surface-600/30 border border-transparent hover:border-white/10'
                } ${poll.closed ? 'cursor-default' : ''}`}
              >
                <div
                  className="absolute inset-0 bg-primary/5 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{POLL_EMOJIS[i] || `${i + 1}️⃣`}</span>
                    <span className="text-sm text-white font-medium">{opt.text}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400 font-mono">{percentage}%</span>
                    <span className="text-[10px] text-zinc-500 bg-surface-500/50 px-1.5 py-0.5 rounded-full">{voteCount}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
        <p className="text-[10px] text-zinc-600 mt-3 text-center">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</p>
      </div>
    </div>
  )
}

export default PollMessage
