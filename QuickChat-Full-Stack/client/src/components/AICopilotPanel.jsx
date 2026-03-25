import React, { useContext, useState, useRef, useEffect } from 'react'
import { AIContext } from '../../context/AIContext'
import { ChatContext } from '../../context/ChatContext'
import { WorkspaceContext } from '../../context/WorkspaceContext'
import QuickBotPanel from './QuickBotPanel'
import WritingCoach from './WritingCoach'
import ConversationCanvas from './ConversationCanvas'
import toast from 'react-hot-toast'

const AICopilotPanel = ({ onClose }) => {
  const {
    aiMessages, suggestions, isLoading, getSmartReplies, summarize,
    chatWithAI, clearAIChat, generateMeetingNotes, searchWithAI, getSentimentDashboard,
    sentimentData,
  } = useContext(AIContext)
  const { messages, selectedUser } = useContext(ChatContext)
  const { selectedChannel, selectedWorkspace } = useContext(WorkspaceContext)
  const [input, setInput] = useState('')
  const [mode, setMode] = useState('chat')
  const [translateText, setTranslateText] = useState('')
  const [translateLang, setTranslateLang] = useState('English')
  const [translateResult, setTranslateResult] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const scrollEnd = useRef()

  useEffect(() => {
    scrollEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [aiMessages])

  useEffect(() => {
    if (messages.length > 0 && mode === 'chat') getSmartReplies(messages)
  }, [messages.length, mode])

  const { translate } = useContext(AIContext)
  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    await chatWithAI(input.trim())
    setInput('')
  }

  const handleSummarize = async () => {
    setMode('summary')
    await summarize(messages)
  }

  const handleTranslate = async () => {
    if (!translateText.trim()) return
    const result = await translate(translateText.trim(), translateLang)
    setTranslateResult(result)
  }

  const handleMeetingNotes = async () => {
    const params = {}
    if (selectedChannel) params.channelId = selectedChannel._id
    else if (selectedUser) params.conversationId = selectedUser._id
    else { toast.error('Select a conversation first'); return }
    setMode('meeting')
    await generateMeetingNotes(params)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setMode('search')
    const results = await searchWithAI(searchQuery.trim())
    setSearchResults(results)
  }

  const handleSentiment = async () => {
    if (!selectedWorkspace?._id) { toast.error('Select a workspace first'); return }
    setMode('sentiment')
    await getSentimentDashboard(selectedWorkspace._id, 7)
  }

  if (mode === 'quickbot') {
    return (
      <QuickBotPanel
        channelId={selectedChannel?._id}
        groupId={null}
        conversationId={selectedUser?._id}
        onClose={() => setMode('chat')}
      />
    )
  }

  if (mode === 'canvas') {
    return <ConversationCanvas onClose={() => setMode('chat')} />
  }

  return (
    <div className="h-full flex flex-col bg-surface-800/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 2a10 10 0 1 0 10 10H12V2z" /><circle cx="12" cy="12" r="2" fill="white" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">AI Copilot</h3>
            <p className="text-[10px] text-zinc-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Powered by AI
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={clearAIChat} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-surface-700/60 cursor-pointer transition-all" title="Clear chat">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-surface-700/60 cursor-pointer transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex gap-1 px-4 py-2.5 border-b border-white/[0.04] flex-shrink-0 overflow-x-auto custom-scrollbar">
        {[
          { id: 'chat', label: 'Chat', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
          { id: 'quickbot', label: 'QuickBot', icon: 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z' },
          { id: 'summary', label: 'Summary', icon: 'M4 6h16M4 12h8m-8 6h16' },
          { id: 'translate', label: 'Translate', icon: 'M5 8l6 6M4 14l6-6 2-3M2 5h12' },
          { id: 'search', label: 'Search', icon: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35' },
          { id: 'meeting', label: 'Notes', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' },
          { id: 'sentiment', label: 'Mood', icon: 'M22 12h-4l-3 9L9 3l-3 9H2' },
          { id: 'canvas', label: 'Canvas', icon: 'M12 12m-10 0a10 10 0 1 0 20 0 10 10 0 1 0-20 0M12 12m-4 0a4 4 0 1 0 8 0 4 4 0 1 0-8 0' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setMode(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition-all duration-200 whitespace-nowrap ${
              mode === tab.id
                ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/20'
                : 'text-zinc-500 hover:text-white hover:bg-surface-700/60'
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {suggestions.length > 0 && mode === 'chat' && (
        <div className="px-4 py-3 border-b border-white/[0.04] flex-shrink-0">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-2 flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/></svg>
            Smart Replies
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 3).map((s, i) => (
              <button
                key={i}
                onClick={() => { navigator.clipboard.writeText(s); toast.success('Copied!') }}
                className="text-xs px-3 py-2 bg-gradient-to-r from-primary/10 to-accent/10 text-primary rounded-xl cursor-pointer hover:from-primary/20 hover:to-accent/20 transition-all border border-primary/10 hover:border-primary/20 hover:scale-105 font-medium"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {mode === 'chat' && (
          <div className="flex flex-col gap-4">
            {aiMessages.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mx-auto mb-4 flex items-center justify-center shadow-lg">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
                    <path d="M12 2a10 10 0 1 0 10 10H12V2z" /><circle cx="12" cy="12" r="2" fill="currentColor" />
                  </svg>
                </div>
                <p className="text-sm text-zinc-400">Ask me anything about your conversations</p>
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {['Summarize chat', 'Find info', 'Translate', 'Meeting notes'].map((q, i) => (
                    <button key={i} onClick={() => setInput(q)} className="text-xs px-3 py-1.5 bg-surface-700/50 text-zinc-400 rounded-lg hover:bg-surface-600/50 hover:text-white transition-all border border-transparent hover:border-white/5">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {aiMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} fade-in`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' ? 'message-bubble-sent text-white' : 'message-bubble-received text-zinc-200'
                }`}>
                  {msg.type === 'summary' && (
                    <span className="text-[10px] font-semibold text-primary block mb-2 uppercase tracking-wider">Summary</span>
                  )}
                  {msg.type === 'meeting-notes' && (
                    <span className="text-[10px] font-semibold text-amber-400 block mb-2 uppercase tracking-wider">Meeting Notes</span>
                  )}
                  <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start fade-in">
                <div className="bg-surface-700/80 backdrop-blur-sm rounded-2xl rounded-bl-md px-5 py-4 flex items-end gap-2 shadow-lg">
                  <span className="w-2 h-2 bg-zinc-400 rounded-full typing-dot" />
                  <span className="w-2 h-2 bg-zinc-400 rounded-full typing-dot" />
                  <span className="w-2 h-2 bg-zinc-400 rounded-full typing-dot" />
                </div>
              </div>
            )}
            <div ref={scrollEnd} />
          </div>
        )}

        {mode === 'summary' && (
          <div className="text-sm">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                <p className="text-zinc-400">Generating summary...</p>
              </div>
            ) : aiMessages.filter(m => m.type === 'summary').length > 0 ? (
              aiMessages.filter(m => m.type === 'summary').map((m, i) => (
                <div key={i} className="glass-card p-4 rounded-2xl fade-in">
                  <pre className="whitespace-pre-wrap font-sans text-zinc-300 leading-relaxed">{m.content}</pre>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-zinc-500 text-sm mb-4">Generate a summary of the current conversation.</p>
                <button onClick={handleSummarize} className="px-5 py-2.5 bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold rounded-xl cursor-pointer hover:shadow-lg transition-all hover:scale-105">
                  Generate Summary
                </button>
              </div>
            )}
          </div>
        )}

        {mode === 'meeting' && (
          <div className="text-sm">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-zinc-400">Generating meeting notes...</p>
              </div>
            ) : aiMessages.filter(m => m.type === 'meeting-notes').length > 0 ? (
              aiMessages.filter(m => m.type === 'meeting-notes').map((m, i) => (
                <div key={i} className="glass-card p-4 rounded-2xl fade-in">
                  <pre className="whitespace-pre-wrap font-sans text-zinc-300 leading-relaxed">{m.content}</pre>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-zinc-500 text-sm mb-4">Generate structured meeting notes from this conversation.</p>
                <button onClick={handleMeetingNotes} className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold rounded-xl cursor-pointer hover:shadow-lg transition-all hover:scale-105">
                  Generate Notes
                </button>
              </div>
            )}
          </div>
        )}

        {mode === 'translate' && (
          <div className="flex flex-col gap-5">
            <div className="space-y-2">
              <label className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">Text to translate</label>
              <textarea
                value={translateText}
                onChange={(e) => setTranslateText(e.target.value)}
                placeholder="Paste text here..."
                className="w-full p-4 bg-surface-700/60 border border-white/5 rounded-xl text-white text-sm outline-none resize-none h-28 input-glow transition-all placeholder-zinc-600"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">Target language</label>
              <select
                value={translateLang}
                onChange={(e) => setTranslateLang(e.target.value)}
                className="w-full p-4 bg-surface-700/60 border border-white/5 rounded-xl text-white text-sm outline-none cursor-pointer input-glow transition-all appearance-none"
              >
                {['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Portuguese'].map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
            <button onClick={handleTranslate} disabled={isLoading || !translateText.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold rounded-xl cursor-pointer hover:shadow-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
            >
              {isLoading ? 'Translating...' : 'Translate'}
            </button>
            {translateResult && (
              <div className="glass-card p-4 rounded-2xl fade-in">
                <p className="text-[11px] text-primary uppercase tracking-wider font-semibold mb-2">Translation to {translateLang}</p>
                <p className="text-sm text-zinc-200 leading-relaxed">{translateResult}</p>
              </div>
            )}
          </div>
        )}

        {mode === 'search' && (
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
                placeholder="Search conversations with AI..."
                className="flex-1 p-3 bg-surface-700/60 border border-white/5 rounded-xl text-white text-sm outline-none input-glow placeholder-zinc-600"
              />
              <button onClick={handleSearch} disabled={isLoading || !searchQuery.trim()}
                className="px-4 py-2 bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold rounded-xl cursor-pointer disabled:opacity-30 transition-all"
              >
                {isLoading ? '...' : 'Search'}
              </button>
            </div>
            {searchResults && (
              <div className="space-y-2 fade-in">
                {searchResults.type === 'ai' && searchResults.answer && (
                  <div className="glass-card p-4 rounded-2xl mb-3">
                    <p className="text-[10px] text-primary uppercase tracking-wider font-semibold mb-2">AI Answer</p>
                    <p className="text-sm text-zinc-200 leading-relaxed">{searchResults.answer}</p>
                  </div>
                )}
                {searchResults.messages?.map((msg, i) => (
                  <div key={i} className="bg-surface-700/40 rounded-xl p-3 border border-white/[0.04] hover:border-primary/20 transition-all cursor-pointer">
                    <p className="text-xs text-zinc-400 mb-1">{msg.senderId?.fullName || 'User'}</p>
                    <p className="text-sm text-zinc-200 line-clamp-2">{msg.text}</p>
                    {msg.similarity && <p className="text-[10px] text-zinc-600 mt-1">Relevance: {Math.round(msg.similarity * 100)}%</p>}
                  </div>
                ))}
                {searchResults.messages?.length === 0 && !searchResults.answer && (
                  <p className="text-xs text-zinc-600 text-center py-6">No results found</p>
                )}
              </div>
            )}
          </div>
        )}

        {mode === 'sentiment' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                <p className="text-xs text-zinc-500">Analyzing sentiment...</p>
              </div>
            ) : sentimentData ? (
              <div className="space-y-4 fade-in">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-success/10 rounded-xl p-3 text-center border border-success/20">
                    <div className="text-xl font-bold text-success">{sentimentData.overall?.positive || 0}</div>
                    <div className="text-[10px] text-zinc-500 mt-1">Positive</div>
                  </div>
                  <div className="bg-zinc-500/10 rounded-xl p-3 text-center border border-zinc-500/20">
                    <div className="text-xl font-bold text-zinc-400">{sentimentData.overall?.neutral || 0}</div>
                    <div className="text-[10px] text-zinc-500 mt-1">Neutral</div>
                  </div>
                  <div className="bg-danger/10 rounded-xl p-3 text-center border border-danger/20">
                    <div className="text-xl font-bold text-danger">{sentimentData.overall?.negative || 0}</div>
                    <div className="text-[10px] text-zinc-500 mt-1">Negative</div>
                  </div>
                </div>
                <div className="bg-surface-700/30 rounded-xl p-4 border border-white/[0.04]">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-3">Daily Trend</p>
                  <div className="flex items-end gap-1 h-20">
                    {(sentimentData.daily || []).map((day, i) => {
                      const height = Math.max(Math.abs(day.avgScore) * 80, 4)
                      const color = day.avgScore > 0 ? 'bg-success' : day.avgScore < 0 ? 'bg-danger' : 'bg-zinc-500'
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className={`${color} rounded-sm w-full transition-all`} style={{ height: `${height}px` }} />
                          <span className="text-[8px] text-zinc-600 truncate w-full text-center">{day._id?.slice(5)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <p className="text-xs text-zinc-500 text-center">
                  Avg score: <span className="font-mono text-primary">{(sentimentData.overall?.avgScore || 0).toFixed(2)}</span> across {sentimentData.overall?.totalMessages || 0} messages
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <button onClick={handleSentiment} className="px-5 py-2.5 bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold rounded-xl cursor-pointer hover:shadow-lg transition-all hover:scale-105">
                  Load Sentiment Data
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {mode === 'chat' && (
        <form onSubmit={handleSend} className="px-4 py-3 border-t border-white/[0.04] flex-shrink-0 bg-surface-800/50 backdrop-blur-xl">
          <div className="flex items-center gap-2 bg-surface-700/60 rounded-xl px-4 py-2.5 border border-white/[0.03] focus-within:border-primary/30 focus-within:shadow-lg focus-within:shadow-primary/5 transition-all">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e) }}
              placeholder="Ask AI anything..."
              className="flex-1 text-sm bg-transparent border-none outline-none text-white placeholder-zinc-500"
            />
            <button type="submit" disabled={isLoading || !input.trim()} className="text-primary hover:text-primary-light cursor-pointer transition-all disabled:opacity-30 hover:scale-110">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default AICopilotPanel
