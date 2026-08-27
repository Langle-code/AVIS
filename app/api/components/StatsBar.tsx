'use client'

import { useEffect, useState } from 'react'

interface Stats {
  total_answered: number
  correct_today: number
  streak_days: number
}

export default function StatsBar() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
  }, [])

  if (!stats) return null

  return (
    <div style={{
      display: 'flex',
      gap: 10,
      marginTop: 16,
    }}>
      {[
        { label: 'answered', value: stats.total_answered, emoji: '📝' },
        { label: 'correct today', value: stats.correct_today, emoji: '✅' },
        { label: 'day streak', value: stats.streak_days, emoji: '🔥' },
      ].map(item => (
        <div key={item.label} style={{
          flex: 1,
          background: 'var(--white)',
          borderRadius: 14,
          padding: '12px 14px',
          border: '1px solid rgba(184,224,200,0.35)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 18, marginBottom: 2 }}>{item.emoji}</div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 500, color: 'var(--bark)' }}>
            {item.value}
          </div>
          <div style={{ fontSize: 11, color: 'var(--moss-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  )
}
