'use client'

import { NmatSubject } from '@/types'

const SUBJECTS: { label: string; value: NmatSubject; emoji: string }[] = [
  { label: 'Biology', value: 'biology', emoji: '🧬' },
  { label: 'Physical Science', value: 'physical_science', emoji: '⚗️' },
  { label: 'Social Science', value: 'social_science', emoji: '🌍' },
  { label: 'Verbal', value: 'verbal', emoji: '📖' },
  { label: 'Quantitative', value: 'quantitative', emoji: '🔢' },
  { label: 'Inductive', value: 'inductive_reasoning', emoji: '🧩' },
]

interface Props {
  selected: NmatSubject | null
  onChange: (subject: NmatSubject | null) => void
}

export default function SubjectFilter({ selected, onChange }: Props) {
  return (
    <div style={{
      display: 'flex',
      gap: 8,
      overflowX: 'auto',
      paddingBottom: 4,
      scrollbarWidth: 'none',
    }}>
      <button
        onClick={() => onChange(null)}
        style={{
          padding: '7px 16px',
          borderRadius: 50,
          border: !selected ? '1.5px solid var(--sage-deep)' : '1.5px solid rgba(184,224,200,0.4)',
          background: !selected ? 'var(--sage-deep)' : 'var(--white)',
          color: !selected ? 'var(--white)' : 'var(--moss-light)',
          fontSize: 13,
          fontWeight: !selected ? 500 : 400,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'all 0.18s ease',
          fontFamily: 'DM Sans, sans-serif',
        }}
      >
        All
      </button>
      {SUBJECTS.map(s => (
        <button
          key={s.value}
          onClick={() => onChange(selected === s.value ? null : s.value)}
          style={{
            padding: '7px 14px',
            borderRadius: 50,
            border: selected === s.value ? '1.5px solid var(--sage-deep)' : '1.5px solid rgba(184,224,200,0.4)',
            background: selected === s.value ? 'var(--sage-deep)' : 'var(--white)',
            color: selected === s.value ? 'var(--white)' : 'var(--moss-light)',
            fontSize: 13,
            fontWeight: selected === s.value ? 500 : 400,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.18s ease',
            fontFamily: 'DM Sans, sans-serif',
            display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          <span>{s.emoji}</span>
          <span>{s.label}</span>
        </button>
      ))}
    </div>
  )
}
