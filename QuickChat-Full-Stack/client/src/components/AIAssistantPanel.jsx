import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTheme } from '../../context';
import { apiClient, apiPaths, extractErrorMessage } from '../lib/api';

const toneConfig = {
  positive: {
    label: 'Positive tone',
    classes: 'bg-emerald-500/12 text-emerald-300 border-emerald-400/20',
  },
  negative: {
    label: 'Needs attention',
    classes: 'bg-rose-500/12 text-rose-300 border-rose-400/20',
  },
  neutral: {
    label: 'Neutral tone',
    classes: 'bg-slate-500/12 text-slate-300 border-slate-400/20',
  },
};

const AIAssistantPanel = ({ selectedUser, messages, onSuggestionPick, compact = false }) => {
  const { isDark } = useTheme();
  const [summary, setSummary] = useState('');
  const [keyPoints, setKeyPoints] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [sentiment, setSentiment] = useState(null);
  const [loadingAction, setLoadingAction] = useState('');

  const recentMessages = useMemo(() => {
    return messages.slice(-8).map((message) => ({
      sender: message.senderId === selectedUser?._id ? selectedUser.fullName : 'You',
      text: message.text || (message.image ? '[shared image]' : ''),
    }));
  }, [messages, selectedUser]);

  const latestIncomingText = useMemo(() => {
    const latestIncoming = [...messages].reverse().find((message) => message.senderId === selectedUser?._id && message.text);
    return latestIncoming?.text || '';
  }, [messages, selectedUser]);

  if (!selectedUser) return null;

  const runAction = async (action) => {
    if (!messages.length) {
      toast.error('Start the conversation before using AI tools.');
      return;
    }

    setLoadingAction(action);
    try {
      if (action === 'summary') {
        const transcript = recentMessages.map((entry) => `${entry.sender}: ${entry.text}`).join('\n');
        const { data } = await apiClient.post(apiPaths.ai.summarize, { text: transcript });
        setSummary(data.data.summary);
        setKeyPoints(data.data.keyPoints || []);
      }

      if (action === 'suggestions') {
        const sourceText = latestIncomingText || recentMessages[recentMessages.length - 1]?.text;
        const { data } = await apiClient.post(apiPaths.ai.suggest, {
          messageText: sourceText,
          conversationContext: recentMessages,
        });
        setSuggestions(data.data.suggestions || []);
      }

      if (action === 'sentiment') {
        const sourceText = latestIncomingText || recentMessages[recentMessages.length - 1]?.text;
        const { data } = await apiClient.post(apiPaths.ai.sentiment, { text: sourceText });
        setSentiment(data.data.sentiment);
      }
    } catch (error) {
      toast.error(extractErrorMessage(error, 'AI action failed'));
    } finally {
      setLoadingAction('');
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    if (onSuggestionPick) {
      onSuggestionPick(suggestion);
      toast.success('Draft inserted into the composer.');
      return;
    }

    try {
      await navigator.clipboard.writeText(suggestion);
      toast.success('Suggestion copied to clipboard.');
    } catch {
      toast.error('Unable to copy suggestion.');
    }
  };

  const tone = sentiment ? toneConfig[sentiment.label] || toneConfig.neutral : toneConfig.neutral;

  return (
    <section className={`surface-border rounded-[28px] p-4 ${isDark ? 'bg-slate-900/60 text-white' : 'bg-white/92 text-slate-900'}`}>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <p className='section-kicker'>AI assistant</p>
          <h4 className='mt-2 text-lg font-semibold'>Summarise, assess tone, and draft replies</h4>
          <p className={`mt-1 text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Use AI to catch up on the latest thread or respond faster without losing your own voice.
          </p>
        </div>
        <div className='rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-500 px-3 py-2 text-sm font-semibold text-white shadow-lg'>
          AI
        </div>
      </div>

      <div className={`mt-4 grid gap-2 ${compact ? 'grid-cols-1' : 'sm:grid-cols-3'}`}>
        {[
          { key: 'summary', label: 'Summarize thread' },
          { key: 'suggestions', label: 'Suggest replies' },
          { key: 'sentiment', label: 'Analyze tone' },
        ].map((action) => (
          <button
            key={action.key}
            type='button'
            onClick={() => runAction(action.key)}
            disabled={loadingAction === action.key}
            className={`surface-border rounded-2xl px-3 py-3 text-left text-sm font-medium transition ${
              isDark
                ? 'bg-white/5 text-slate-200 hover:bg-white/10'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {loadingAction === action.key ? 'Working…' : action.label}
          </button>
        ))}
      </div>

      {summary && (
        <div className={`surface-border mt-4 rounded-2xl px-4 py-4 ${isDark ? 'bg-slate-950/60' : 'bg-slate-50'}`}>
          <div className='flex items-center justify-between gap-2'>
            <p className='text-sm font-semibold'>Conversation summary</p>
            <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Latest thread</span>
          </div>
          <p className={`mt-2 text-sm leading-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{summary}</p>
          {keyPoints.length > 0 && (
            <ul className={`mt-3 space-y-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {keyPoints.map((point) => (
                <li key={point} className='flex gap-2'>
                  <span className='mt-1 text-emerald-400'>•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {sentiment && (
        <div className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${tone.classes}`}>
          <span>{tone.label}</span>
          <span className='opacity-80'>{Math.round(sentiment.score * 100)}% confidence</span>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className='mt-4'>
          <div className='flex items-center justify-between gap-2'>
            <p className='text-sm font-semibold'>Reply suggestions</p>
            <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {onSuggestionPick ? 'Click to draft' : 'Click to copy'}
            </span>
          </div>
          <div className='mt-3 flex flex-wrap gap-2'>
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type='button'
                onClick={() => handleSuggestionClick(suggestion)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  isDark
                    ? 'bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/18'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default AIAssistantPanel;
