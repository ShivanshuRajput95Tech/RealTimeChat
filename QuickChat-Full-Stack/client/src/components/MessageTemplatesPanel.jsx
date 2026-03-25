import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { AuthContext } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const MessageTemplatesPanel = ({ isOpen, onClose, onSelectTemplate }) => {
  const { authUser } = useContext(AuthContext)
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newTemplate, setNewTemplate] = useState({ title: '', content: '', shortcut: '', category: 'general' })

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/messages/enhanced/templates`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      )
      setTemplates(res.data.templates || [])
    } catch (err) {
      console.error('Failed to fetch templates:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) fetchTemplates()
  }, [isOpen])

  const createTemplate = async (e) => {
    e.preventDefault()
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/messages/enhanced/templates`,
        newTemplate,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      )
      toast.success('Template created!')
      setNewTemplate({ title: '', content: '', shortcut: '', category: 'general' })
      setShowCreate(false)
      fetchTemplates()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create template')
    }
  }

  const deleteTemplate = async (id) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/messages/enhanced/templates/${id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      )
      toast.success('Template deleted')
      fetchTemplates()
    } catch (err) {
      toast.error('Failed to delete template')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface-800 rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Quick Replies</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="w-full py-2 px-4 bg-primary/20 hover:bg-primary/30 text-primary rounded-xl text-sm font-medium transition-colors"
          >
            + Create New Template
          </button>

          {showCreate && (
            <form onSubmit={createTemplate} className="mt-4 space-y-3">
              <input
                type="text"
                placeholder="Title"
                value={newTemplate.title}
                onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                className="w-full bg-surface-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                required
              />
              <textarea
                placeholder="Message content..."
                value={newTemplate.content}
                onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                className="w-full bg-surface-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm h-24 resize-none"
                required
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Shortcut (optional)"
                  value={newTemplate.shortcut}
                  onChange={(e) => setNewTemplate({ ...newTemplate, shortcut: e.target.value })}
                  className="flex-1 bg-surface-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                />
                <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg text-sm">
                  Save
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : templates.length > 0 ? (
            <div className="divide-y divide-white/5">
              {templates.map((template) => (
                <div
                  key={template._id}
                  className="p-4 hover:bg-white/5 cursor-pointer transition-colors group"
                  onClick={() => {
                    onSelectTemplate(template.content)
                    onClose()
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white text-sm">{template.title}</span>
                        {template.shortcut && (
                          <span className="text-xs bg-surface-700 text-zinc-400 px-2 py-0.5 rounded">
                            {template.shortcut}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{template.content}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteTemplate(template._id) }}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-zinc-500 text-sm">
              No templates yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MessageTemplatesPanel