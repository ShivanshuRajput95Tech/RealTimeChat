import { ERROR_MESSAGES, GREETING_TIMES } from '../constants'

// Format message time for display
export function formatMessageTime(date) {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const diffMs = now - d
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return d.toLocaleDateString([], { weekday: 'short' })
  } else {
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }
}

// Format date for display
export function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString([], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Format relative time (e.g., "2 minutes ago")
export function formatRelativeTime(date) {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const diffMs = now - d
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return formatDate(date)
}

// Format bytes for display
export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// Format duration for voice messages
export function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Format error response from API
export function formatError(error) {
  if (!error?.response) {
    return ERROR_MESSAGES.NETWORK
  }
  return error.response.data?.message || ERROR_MESSAGES.GENERIC
}

// Get greeting based on time of day
export function getGreeting() {
  const hour = new Date().getHours()
  if (hour < GREETING_TIMES.MORNING_END) return 'Good morning'
  if (hour < GREETING_TIMES.AFTERNOON_END) return 'Good afternoon'
  return 'Good evening'
}

// Get first name from full name
export function getFirstName(fullName) {
  if (!fullName) return 'there'
  return fullName.split(' ')[0]
}

// Debounce function
export function debounce(fn, delay) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

// Throttle function
export function throttle(fn, limit) {
  let inThrottle
  return (...args) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Check if user is online
export function isUserOnline(userId, onlineUsers) {
  return onlineUsers?.includes(userId) || false
}

// Get user status color class
export function getStatusColor(status) {
  const colors = {
    online: 'status-online',
    idle: 'status-idle',
    dnd: 'status-dnd',
    offline: 'status-offline',
  }
  return colors[status] || colors.offline
}

// Truncate text with ellipsis
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

// Alias for truncate
export function truncate(str, maxLen = 50) {
  return truncateText(str, maxLen)
}

// Generate unique ID
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Class name helper (simple clsx alternative)
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

// Check if element is near bottom of container
export function isNearBottom(element, threshold = 100) {
  if (!element) return true
  const { scrollTop, scrollHeight, clientHeight } = element
  return scrollHeight - scrollTop - clientHeight < threshold
}

// Scroll to bottom of element
export function scrollToBottom(element, behavior = 'smooth') {
  if (element) {
    element.scrollIntoView({ behavior })
  }
}

// Check if message is from same sender as previous
export function isSameSender(msg1, msg2) {
  if (!msg1 || !msg2) return false
  const sender1 = typeof msg1.senderId === 'object' ? msg1.senderId._id : msg1.senderId
  const sender2 = typeof msg2.senderId === 'object' ? msg2.senderId._id : msg2.senderId
  return sender1 === sender2
}

// Get initials from name
export function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Validate email format
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate password strength
export function getPasswordStrength(password) {
  const checks = [
    { label: '8+ chars', met: password.length >= 8 },
    { label: 'Upper', met: /[A-Z]/.test(password) },
    { label: 'Number', met: /\d/.test(password) },
    { label: 'Special', met: /[^A-Za-z0-9]/.test(password) },
  ]
  const score = checks.filter((c) => c.met).length
  const labels = ['Weak', 'Fair', 'Good', 'Strong']
  const colors = ['#ef4444', '#f59e0b', '#22c55e', '#6366f1']

  return {
    score,
    checks,
    label: labels[score - 1] || 'Short',
    color: colors[score - 1] || '#ef4444',
  }
}

// Deep clone object
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(deepClone)
  const cloned = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key])
    }
  }
  return cloned
}

// Group messages by sender for chat bubbles
export function groupMessagesBySender(messages, currentUserId) {
  const groups = []
  let currentGroup = []

  messages.forEach((msg, index) => {
    const isOwn =
      msg.senderId === currentUserId ||
      msg.senderId?._id === currentUserId
    const prevMsg = messages[index - 1]
    const isFirstOfGroup = !prevMsg || prevMsg.senderId !== msg.senderId

    if (isFirstOfGroup && currentGroup.length > 0) {
      groups.push(currentGroup)
      currentGroup = []
    }
    currentGroup.push({ ...msg, isOwn, showAvatar: isFirstOfGroup })
  })

  if (currentGroup.length > 0) {
    groups.push(currentGroup)
  }

  return groups
}

// Check if running on mobile
export function isMobile() {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 768
}

// Local storage helpers with error handling
export const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Storage full or not available
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key)
    } catch {
      // Not available
    }
  },
}

export default {
  formatMessageTime,
  formatDate,
  formatRelativeTime,
  formatBytes,
  formatDuration,
  formatError,
  getGreeting,
  getFirstName,
  debounce,
  throttle,
  isUserOnline,
  getStatusColor,
  truncateText,
  truncate,
  generateId,
  cn,
  isNearBottom,
  scrollToBottom,
  isSameSender,
  getInitials,
  isValidEmail,
  getPasswordStrength,
  deepClone,
  groupMessagesBySender,
  isMobile,
  storage,
}