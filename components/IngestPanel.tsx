'use client'

import { useState } from 'react'
import { NmatSubject } from '@/types'

const SUBJECTS: { label: string; value: NmatSubject }[] = [
  { label: '🧬 Biology', value: 'biology' },
  { label: '⚗️ Physical Science', value: 'physical_science' },
  { label: '🌍 Social Science', value: 'social_science' },
  { label: '📖 Verbal', value: 'verbal' },
  { label: '🔢 Quantitative', value: 'quantitative' },
  { label: '🧩 Inductive Reasoning', value: 'inductive_reasoning' },
]

interface Props { onSuccess: () => void }

export default function IngestPanel({ onSuccess }: Props) {
  const [url, setUrl] = useState('')
  const [subject, setSubject] = useState<NmatSubject | ''>('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSubmit = async () => {
    if (!url.trim()) return
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), subject_override: subject || undefined }),
      })
      const data = await res.json()

      if (data.success) {
        setResult({
          success: true,
          message: `✨ Added! Generated ${data.questions_generated} questions from "${data.title}" (${data.subject_tag.replace('_', ' ')}).`,
        })
        setUrl('')
        setSubject('')
        setTimeout(onSuccess, 2000)
      } else {
        setResult({ success: false, message: data.error || 'Something went wrong.' })
      }
    } catch {
      setResult({ success: false, message: 'Network error — please try again.' })
    }

    setLoading(false)
  }

  return (
    <div className="card" style={{ padding: 24 }}>
      <h3 style={{ marginBottom: 4, fontSize: 17 }}>Add Study Material</h3>
      <p style={{ fontSize: 13, color: 'var(--moss-light)', marginBottom: 18 }}>
        Paste a YouTube video link, PDF URL, or any web page with study content.
      </p>

      <input
        type="url"
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="https://youtube.com/watch?v=... or PDF link"
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: 12,
          border: '1.5px solid rgba(184,224,200,0.5)',
          background: 'var(--cream)',
          color: 'var(--bark)',
          fontSize: 14,
          marginBottom: 12,
          outline: 'none',
          fontFamily: 'DM Sans, sans-serif',
        }}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
      />

      <select
        value={subject}
        onChange={e => setSubject(e.target.value as NmatSubject | '')}
        disabled={loading}
        style={{
          width: '100%',
          padding: '11px 16px',
          borderRadius: 12,
          border: '1.5px solid rgba(184,224,200,0.5)',
          background: 'var(--cream)',
          color: subject ? 'var(--bark)' : 'var(--moss-light)',
          fontSize: 14,
          marginBottom: 16,
          outline: 'none',
          fontFamily: 'DM Sans, sans-serif',
          cursor: 'pointer',
        }}
      >
        <option value="">Auto-detect subject</option>
        {SUBJECTS.map(s => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      <button
        className="btn-primary"
        onClick={handleSubmit}
        disabled={loading || !url.trim()}
        style={{ width: '100%', opacity: loading || !url.trim() ? 0.6 : 1 }}
      >
        {loading ? 'Processing… this may take a minute ⏳' : 'Add & Generate Questions'}
      </button>

      {result && (
        <div className="fade-up" style={{
          marginTop: 14,
          padding: '12px 16px',
          borderRadius: 12,
          background: result.success ? 'rgba(184,224,200,0.2)' : 'rgba(245,198,214,0.2)',
          color: result.success ? 'var(--moss)' : 'var(--rose-deep)',
          fontSize: 13,
          lineHeight: 1.5,
        }}>
          {result.message}
        </div>
      )}
    </div>
  )
}
