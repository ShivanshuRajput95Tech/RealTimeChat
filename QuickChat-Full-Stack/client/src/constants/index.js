// Application constants

export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

export const SOCKET_CONFIG = {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling'],
}

export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  SYSTEM: 'system',
  BROADCAST: 'broadcast',
  TEMPLATE: 'template',
}

export const USER_STATUS = {
  ONLINE: 'online',
  IDLE: 'idle',
  DND: 'dnd',
  OFFLINE: 'offline',
}

export const USER_STATUS_OPTIONS = [
  { value: USER_STATUS.ONLINE, label: 'Online', color: 'status-online' },
  { value: USER_STATUS.IDLE, label: 'Idle', color: 'status-idle' },
  { value: USER_STATUS.DND, label: 'Do Not Disturb', color: 'status-dnd' },
  { value: USER_STATUS.OFFLINE, label: 'Invisible', color: 'status-offline' },
]

export const CALL_STATES = {
  IDLE: 'idle',
  CALLING: 'calling',
  INCOMING: 'incoming',
  CONNECTED: 'connected',
}

export const CALL_TYPES = {
  AUDIO: 'audio',
  VIDEO: 'video',
}

export const VIEW_TYPES = {
  DM: 'dm',
  WORKSPACE: 'workspace',
  CHANNEL: 'channel',
  GROUP: 'group',
}

export const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉']

export const TOAST_OPTIONS = {
  duration: 3000,
  style: {
    background: '#1a1a25',
    color: '#e2e8f0',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px',
    fontSize: '14px',
  },
  success: { iconTheme: { primary: '#22c55e', secondary: '#1a1a25' } },
  error: { iconTheme: { primary: '#ef4444', secondary: '#1a1a25' } },
}

export const PAGINATION = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
}

export const CACHE_KEYS = {
  USERS: 'users:sidebar',
  MESSAGES: 'messages',
  WORKSPACES: 'workspaces',
  GROUPS: 'groups',
}

export const ERROR_MESSAGES = {
  NETWORK: 'Cannot connect to server. Please check your connection and try again.',
  GENERIC: 'Something went wrong. Please try again.',
  AUTH_REQUIRED: 'Authentication required',
  PERMISSION_DENIED: 'You do not have permission to perform this action',
}

export const GREETING_TIMES = {
  MORNING_END: 12,
  AFTERNOON_END: 17,
}

export const ANIMATION_DELAYS = {
  STAGGER: 0.08,
  FAST: 0.1,
  NORMAL: 0.2,
}

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
}

export const FEATURE_CARDS = [
  { icon: '💬', title: 'Real-time Messaging', desc: 'Instant messages' },
  { icon: '🤖', title: 'AI Copilot', desc: 'Smart assistance' },
  { icon: '👥', title: 'Workspaces', desc: 'Team collaboration' },
  { icon: '📞', title: 'Voice & Video', desc: 'Crystal clear calls' },
]

export const STATS_DATA = [
  { label: 'Latency', value: '<50ms' },
  { label: 'Uptime', value: '99.99%' },
  { label: 'Encrypted', value: 'E2E' },
  { label: 'AI Models', value: 'GPT-4o' },
]

export default {
  API_BASE_URL,
  SOCKET_CONFIG,
  MESSAGE_TYPES,
  USER_STATUS,
  USER_STATUS_OPTIONS,
  CALL_STATES,
  CALL_TYPES,
  VIEW_TYPES,
  QUICK_EMOJIS,
  TOAST_OPTIONS,
  PAGINATION,
  CACHE_KEYS,
  ERROR_MESSAGES,
  GREETING_TIMES,
  ANIMATION_DELAYS,
  BREAKPOINTS,
  FEATURE_CARDS,
  STATS_DATA,
}