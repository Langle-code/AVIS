'use client'

import { useState } from 'react'
import { Question } from '@/types'

const SUBJECT_COLORS: Record<string, { bg: string; text: string }> = {
  biology:           { bg: '#E8F5EE', text: '#3D7A5C' },
  physical_science:  { bg: '#EEF0F8', text: '#4A5280' },
  social_science:    { bg: '#FFF4E8', text: '#8A5A20' },
  verbal:            { bg: '#FFF0F5', text: '#8A3A5A' },
  quantitative:      { bg: '#F0F8FF', text: '#2A6080' },
  inductive_reasoning: { bg: '#F5F0FF', text: '#5A3A80' },
}

const SUBJECT_EMOJI: Record<string, string> = {
  biology: '🧬',
  physical_science: '⚗️',
  social_science: '🌍',
  verbal: '📖',
  quantitative: '🔢',
  inductive_reasoning: '🧩',
}

interface Props {
  question: Question & { review_state_id: string }
  onAnswer: (questionId: string, reviewStateId: string, answer: string, correct: boolean) => void
}

export default function QuizCard({ question, onAnswer }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)

  const colors = SUBJECT_COLORS[question.subject_tag] || { bg: '#E8F5EE', text: '#3D7A5C' }
  const emoji = SUBJECT_EMOJI[question.subject_tag] || '📚'

  const handleSelect = async (label: string) => {
    if (revealed) return
    setSelected(label)
    setRevealed(true)
    const correct = label === question.correct_answer

    await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question_id: question.id,
        review_state_id: question.review_state_id,
        answer: label,
        channel: 'web',
      }),
    })

    onAnswer(question.id, question.review_state_id, label, correct)
  }

  return (
    <div className="card" style={{ padding: 28 }}>
      {/* Subject tag */}
      <div style={{ marginBottom: 18 }}>
        <span
          className="subject-pill"
          style={{ background: colors.bg, color: colors.text }}
        >
          {emoji} {question.subject_tag.replace('_', ' ')}
        </span>
      </div>

      {/* Question */}
      <p style={{
        fontFamily: 'Fraunces, serif',
        fontSize: 18,
        fontWeight: 400,
        lineHeight: 1.5,
        color: 'var(--bark)',
        marginBottom: 24,
      }}>
        {question.question_text}
      </p>

      {/* Choices */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {question.choices.map((choice) => {
          const isSelected = selected === choice.label
          const isCorrect = choice.label === question.correct_answer
          const showCorrect = revealed && isCorrect
          const showWrong = revealed && isSelected && !isCorrect

          return (
            <button
              key={choice.label}
              onClick={() => handleSelect(choice.label)}
              disabled={revealed}
              className={showCorrect ? 'feedback-correct' : showWrong ? 'feedback-wrong' : ''}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '14px 16px',
                borderRadius: 14,
                border: showCorrect
                  ? '1.5px solid var(--sage)'
                  : showWrong
                  ? '1.5px solid var(--rose)'
                  : isSelected
                  ? '1.5px solid var(--sage-deep)'
                  : '1.5px solid rgba(184,224,200,0.35)',
                background: showCorrect
                  ? 'rgba(184,224,200,0.18)'
                  : showWrong
                  ? 'rgba(245,198,214,0.18)'
                  : isSelected
                  ? 'rgba(184,224,200,0.1)'
                  : 'var(--white)',
                cursor: revealed ? 'default' : 'pointer',
                textAlign: 'left',
                transition: 'all 0.18s ease',
                width: '100%',
              }}
            >
              <span style={{
                minWidth: 26, height: 26,
                borderRadius: '50%',
                background: showCorrect
                  ? 'var(--sage-deep)'
                  : showWrong
                  ? 'var(--rose-deep)'
                  : 'rgba(184,224,200,0.3)',
                color: showCorrect || showWrong ? 'var(--white)' : 'var(--moss)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 600,
                flexShrink: 0,
              }}>
                {showCorrect ? '✓' : showWrong ? '✗' : choice.label}
              </span>
              <span style={{ fontSize: 14, color: 'var(--bark)', lineHeight: 1.5, paddingTop: 3 }}>
                {choice.text}
              </span>
            </button>
          )
        })}
      </div>

      {/* Rationale */}
      {revealed && (
        <div className="fade-up" style={{
          marginTop: 20,
          padding: '16px 18px',
          background: 'rgba(184,224,200,0.12)',
          borderRadius: 14,
          borderLeft: '3px solid var(--sage-deep)',
        }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--sage-deep)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Explanation
          </p>
          <p style={{ fontSize: 14, color: 'var(--moss)', lineHeight: 1.6 }}>
            {question.rationale}
          </p>
        </div>
      )}
    </div>
  )
}
