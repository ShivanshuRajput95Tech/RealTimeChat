import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { AuthContext } from '../context/AuthContext'
import toast from 'react-hot-toast'

const NotesPanel = ({ isOpen, onClose, workspaceId, channelId, groupId }) => {
  const { authUser } = useContext(AuthContext)
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedNote, setSelectedNote] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newNote, setNewNote] = useState({ title: '', content: '' })

  const fetchNotes = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (workspaceId) params.append('workspaceId', workspaceId)
      if (channelId) params.append('channelId', channelId)
      if (groupId) params.append('groupId', groupId)

      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/notes?${params}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      )
      setNotes(res.data.notes || [])
    } catch (err) {
      console.error('Failed to fetch notes:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) fetchNotes()
  }, [isOpen, workspaceId, channelId, groupId])

  const createNote = async (e) => {
    e.preventDefault()
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/notes`,
        { ...newNote, workspaceId, channelId, groupId },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      )
      toast.success('Note created!')
      setNewNote({ title: '', content: '' })
      setShowCreate(false)
      fetchNotes()
    } catch (err) {
      toast.error('Failed to create note')
    }
  }

  const updateNote = async () => {
    if (!selectedNote) return
    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/notes/${selectedNote._id}`,
        { content: selectedNote.content, title: selectedNote.title },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      )
      toast.success('Note saved!')
      fetchNotes()
    } catch (err) {
      toast.error('Failed to save note')
    }
  }

  const deleteNote = async (id) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/notes/${id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      )
      toast.success('Note deleted')
      setSelectedNote(null)
      fetchNotes()
    } catch (err) {
      toast.error('Failed to delete note')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl h-[80vh] bg-surface-800 rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex">
        <div className="w-64 border-r border-white/10 flex flex-col">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-semibold text-white">Notes</h2>
            <button
              onClick={() => setShowCreate(true)}
              className="text-primary hover:text-primary/80"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {showCreate && (
            <form onSubmit={createNote} className="p-3 border-b border-white/10 space-y-2">
              <input
                type="text"
                placeholder="Note title"
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                className="w-full bg-surface-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                required
              />
              <textarea
                placeholder="Content..."
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                className="w-full bg-surface-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm h-20 resize-none"
              />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 py-1.5 bg-primary text-white rounded-lg text-sm">
                  Create
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-zinc-400 text-sm">
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : notes.length > 0 ? (
              <div className="divide-y divide-white/5">
                {notes.map((note) => (
                  <div
                    key={note._id}
                    className={`p-3 cursor-pointer transition-colors hover:bg-white/5 ${selectedNote?._id === note._id ? 'bg-primary/10' : ''}`}
                    onClick={() => setSelectedNote(note)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white text-sm truncate">{note.title}</span>
                      {note.isPinned && (
                        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L10 6.477V3a1 1 0 011-1z" />
                        </svg>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{note.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-zinc-500 text-sm">No notes yet</div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedNote ? (
            <>
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <input
                  type="text"
                  value={selectedNote.title}
                  onChange={(e) => setSelectedNote({ ...selectedNote, title: e.target.value })}
                  className="bg-transparent text-lg font-semibold text-white outline-none"
                />
                <div className="flex items-center gap-2">
                  <button onClick={updateNote} className="p-2 text-primary hover:bg-primary/10 rounded-lg">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button onClick={() => deleteNote(selectedNote._id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex-1 p-4">
                <textarea
                  value={selectedNote.content}
                  onChange={(e) => setSelectedNote({ ...selectedNote, content: e.target.value })}
                  className="w-full h-full bg-transparent text-white resize-none outline-none"
                  placeholder="Start writing..."
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-500">
              Select a note to edit
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotesPanel