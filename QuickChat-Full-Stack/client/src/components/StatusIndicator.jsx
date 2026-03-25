import React from 'react'

const StatusIndicator = ({ status, className = '' }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )
      case 'sent':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'delivered':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'read':
        return (
          <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return null
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'sending': return 'text-zinc-500'
      case 'sent': return 'text-zinc-400'
      case 'delivered': return 'text-zinc-300'
      case 'read': return 'text-blue-400'
      default: return 'text-zinc-500'
    }
  }

  if (!status) return null

  return (
    <span className={`inline-flex items-center ${getStatusColor()} ${className}`}>
      {getStatusIcon()}
    </span>
  )
}

export default StatusIndicator