'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface Note {
  id: string
  content: string
  subject_tag: string | null
  created_at: string
  updated_at: string
}

const SUBJECT_OPTIONS = [
  { value: '', label: '📋 General' },
  { value: 'biology', label: '🧬 Biology' },
  { value: 'physical_science', label: '⚗️ Physical Science' },
  { value: 'social_science', label: '🌍 Social Science' },
  { value: 'verbal', label: '📖 Verbal' },
  { value: 'quantitative', label: '🔢 Quantitative' },
  { value: 'inductive_reasoning', label: '🧩 Inductive Reasoning' },
]

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
}

export default function NotesPanel() {
  const [notes, setNotes] = useState<Note[]>([])
  const [activeNote, setActiveNote] = useState<Note | null>(null)
  const [draft, setDraft] = useState('')
  const [draftSubject, setDraftSubject] = useState('')
  const [saving, setSaving] = useState(false)
  const saveTimer = useRef<NodeJS.Timeout | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetch('/api/notes').then(r => r.json()).then(data => setNotes(data.notes || []))
  }, [])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [draft])

  const autoSave = useCallback(async (noteId: string, content: string, subject: string) => {
    setSaving(true)
    const res = await fetch('/api/notes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: noteId, content, subject_tag: subject || null }),
    })
    const data = await res.json()
    if (data.note) {
      setNotes(prev => prev.map(n => n.id === noteId ? data.note : n))
      setActiveNote(data.note)
    }
    setSaving(false)
  }, [])

  const handleDraftChange = (value: string) => {
    setDraft(value)
    if (!activeNote) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => autoSave(activeNote.id, value, draftSubject), 800)
  }

  const handleSubjectChange = (value: string) => {
    setDraftSubject(value)
    if (!activeNote) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => autoSave(activeNote.id, draft, value), 400)
  }

  const createNewNote = async () => {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '', subject_tag: null }),
    })
    const data = await res.json()
    if (data.note) {
      setNotes(prev => [data.note, ...prev])
      setActiveNote(data.note)
      setDraft('')
      setDraftSubject('')
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }

  const openNote = (note: Note) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    if (activeNote && draft !== activeNote.content) autoSave(activeNote.id, draft, draftSubject)
    setActiveNote(note)
    setDraft(note.content)
    setDraftSubject(note.subject_tag || '')
  }

  const deleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await fetch('/api/notes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotes(prev => prev.filter(n => n.id !== id))
    if (activeNote?.id === id) { setActiveNote(null); setDraft(''); setDraftSubject('') }
  }

  const pastNotes = notes.filter(n => n.id !== activeNote?.id)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '14px 18px', borderBottom: '1px solid rgba(184,224,200,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(184,224,200,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <select value={draftSubject} onChange={e => handleSubjectChange(e.target.value)}
              disabled={!activeNote}
              style={{ border: 'none', background: 'transparent', color: 'var(--moss)', fontSize: 13, fontFamily: 'DM Sans, sans-serif', cursor: activeNote ? 'pointer' : 'default', outline: 'none' }}>
              {SUBJECT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            {activeNote && (
              <span style={{ fontSize: 11, color: 'var(--moss-light)' }}>
                {saving ? '● saving...' : '✓ saved'}
              </span>
            )}
          </div>
          <button className="btn-primary" style={{ padding: '6px 14px', fontSize: 12 }} onClick={createNewNote}>
            + New Note
          </button>
        </div>

        {activeNote ? (
          <div style={{ padding: '18px 20px' }}>
            <p style={{ fontSize: 11, color: 'var(--moss-light)', marginBottom: 10 }}>{formatDate(activeNote.created_at)}</p>
            <textarea ref={textareaRef} value={draft} onChange={e => handleDraftChange(e.target.value)}
              placeholder="Start writing... formulas, mnemonics, things to remember 🌿"
              style={{ width: '100%', minHeight: 180, border: 'none', outline: 'none', resize: 'none', fontFamily: 'DM Sans, sans-serif', fontSize: 14, lineHeight: 1.7, color: 'var(--bark)', background: 'transparent', overflow: 'hidden' }} />
          </div>
        ) : (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📝</div>
            <p style={{ color: 'var(--moss-light)', fontSize: 14, marginBottom: 20 }}>
              {notes.length === 0 ? 'No notes yet — start writing!' : 'Select a note or create a new one'}
            </p>
            <button className="btn-primary" onClick={createNewNote}>+ New Note</button>
          </div>
        )}
      </div>

      {pastNotes.length > 0 && (
        <div>
          <p style={{ fontSize: 11, color: 'var(--moss-light)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Previous Notes ({pastNotes.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pastNotes.map(note => (
              <div key={note.id} onClick={() => openNote(note)}
                style={{ background: 'var(--white)', borderRadius: 14, border: '1px solid rgba(184,224,200,0.3)', padding: '14px 16px', cursor: 'pointer', transition: 'all 0.18s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      {note.subject_tag && (
                        <span style={{ fontSize: 10, color: 'var(--sage-deep)', background: 'rgba(126,196,160,0.12)', padding: '2px 8px', borderRadius: 50, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>
                          {note.subject_tag.replace('_', ' ')}
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: 'var(--moss-light)' }}>{formatDate(note.created_at)}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--bark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%' }}>
                      {note.content || <span style={{ color: 'var(--moss-light)', fontStyle: 'italic' }}>Empty note</span>}
                    </p>
                  </div>
                  <button onClick={e => deleteNote(note.id, e)}
                    style={{ background: 'none', border: 'none', color: 'var(--moss-light)', cursor: 'pointer', fontSize: 16, padding: '0 4px', flexShrink: 0 }}>×</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
