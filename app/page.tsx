'use client'

import { useState, useEffect } from 'react'
import QuizCard from '@/components/QuizCard'
import IngestPanel from '@/components/IngestPanel'
import SubjectFilter from '@/components/SubjectFilter'
import StatsBar from '@/components/StatsBar'
import NotesPanel from '@/components/NotesPanel'
import { NmatSubject, Question } from '@/types'

type Tab = 'review' | 'notes'

export default function Home() {
  const [tab, setTab] = useState<Tab>('review')
  const [questions, setQuestions] = useState<(Question & { review_state_id: string })[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [subject, setSubject] = useState<NmatSubject | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionDone, setSessionDone] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [showIngest, setShowIngest] = useState(false)

  const fetchQuestions = async (subjectFilter?: NmatSubject | null) => {
    setLoading(true); setSessionDone(false); setCurrentIndex(0); setCorrectCount(0)
    const params = new URLSearchParams({ limit: '5' })
    if (subjectFilter) params.set('subject', subjectFilter)
    const res = await fetch(`/api/questions?${params}`)
    const data = await res.json()
    setQuestions(data.questions || [])
    setLoading(false)
  }

  useEffect(() => { fetchQuestions(subject) }, [subject])

  const handleAnswer = async (_qId: string, _rsId: string, _ans: string, correct: boolean) => {
    if (correct) setCorrectCount(c => c + 1)
    await new Promise(r => setTimeout(r, 1400))
    if (currentIndex + 1 >= questions.length) setSessionDone(true)
    else setCurrentIndex(i => i + 1)
  }

  const currentQ = questions[currentIndex]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <header style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(184,224,200,0.4)', background: 'var(--white)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, background: 'var(--sage)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>🌿</div>
          <span style={{ fontFamily: 'Fraunces, serif', fontSize: 21, fontWeight: 500, color: 'var(--bark)' }}>Avis</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {tab === 'review' && <>
            <button className="btn-ghost" style={{ padding: '7px 16px', fontSize: 13 }} onClick={() => setShowIngest(v => !v)}>
              {showIngest ? 'Close' : '+ Add Material'}
            </button>
            <button className="btn-primary" style={{ padding: '7px 16px', fontSize: 13 }} onClick={() => fetchQuestions(subject)}>Refresh</button>
          </>}
        </div>
      </header>

      <div style={{ display: 'flex', background: 'var(--white)', borderBottom: '1px solid rgba(184,224,200,0.4)', padding: '0 24px' }}>
        {(['review', 'notes'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '12px 20px', border: 'none', background: 'none',
            fontFamily: 'DM Sans, sans-serif', fontSize: 14,
            fontWeight: tab === t ? 500 : 400,
            color: tab === t ? 'var(--bark)' : 'var(--moss-light)',
            borderBottom: tab === t ? '2px solid var(--sage-deep)' : '2px solid transparent',
            cursor: 'pointer', transition: 'all 0.18s ease', marginBottom: -1, textTransform: 'capitalize',
          }}>
            {t === 'review' ? '📚 Review' : '📝 Notes'}
          </button>
        ))}
      </div>

      <main style={{ maxWidth: 660, margin: '0 auto', padding: '28px 20px' }}>
        {tab === 'review' && <>
          {showIngest && <div className="fade-up" style={{ marginBottom: 24 }}><IngestPanel onSuccess={() => { setShowIngest(false); fetchQuestions(subject) }} /></div>}
          <SubjectFilter selected={subject} onChange={setSubject} />
          <StatsBar />
          <div style={{ marginTop: 24 }}>
            {loading ? (
              <div className="card" style={{ textAlign: 'center', padding: '56px 28px' }}>
                <div style={{ fontSize: 30, marginBottom: 10 }}>🌱</div>
                <p style={{ color: 'var(--moss-light)' }}>Hold up, little plant. Still loading your review session…</p>
              </div>
            ) : sessionDone ? (
              <div className="card bloom fade-up" style={{ textAlign: 'center', padding: '56px 28px' }}>
                <div style={{ fontSize: 38, marginBottom: 14 }}>{correctCount === questions.length ? '🌸' : '🌿'}</div>
                <h2 style={{ marginBottom: 8 }}>Session complete!</h2>
                <p style={{ color: 'var(--moss-light)', marginBottom: 24 }}>
                  {correctCount} of {questions.length} correct
                  {correctCount === questions.length ? ' — Yeah, that is what I am talking about!' : ' — RUN. RUN. RUN. YOU LITTLE PLANT!'}
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button className="btn-primary" onClick={() => fetchQuestions(subject)}>Next Round</button>
                  <button className="btn-ghost" onClick={() => setTab('notes')}>Write Notes</button>
                </div>
              </div>
            ) : questions.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '56px 28px' }}>
                <div style={{ fontSize: 34, marginBottom: 10 }}> 😵‍💫 </div>
                <h3 style={{ marginBottom: 8 }}>No questions yet. Just you wait</h3>
                <p style={{ color: 'var(--moss-light)', marginBottom: 24 }}>Add a YouTube link or PDF to get started.</p>
                <button className="btn-primary" onClick={() => setShowIngest(true)}>Add Study Material</button>
              </div>
            ) : currentQ ? (
              <div className="fade-up" key={currentQ.id}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14, gap: 10 }}>
                  <span style={{ fontSize: 12, color: 'var(--moss-light)', whiteSpace: 'nowrap' }}>{currentIndex + 1} / {questions.length}</span>
                  <div style={{ flex: 1, height: 4, background: 'rgba(184,224,200,0.3)', borderRadius: 2 }}>
                    <div style={{ height: '100%', background: 'var(--sage-deep)', borderRadius: 2, width: `${(currentIndex / questions.length) * 100}%`, transition: 'width 0.4s ease' }} />
                  </div>
                </div>
                <QuizCard question={currentQ} onAnswer={handleAnswer} />
              </div>
            ) : null}
          </div>
        </>}

        {tab === 'notes' && (
          <div className="fade-up">
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, marginBottom: 4 }}>My Notes</h2>
              <p style={{ fontSize: 13, color: 'var(--moss-light)' }}>Formulas, mnemonics, things to remember — all saved automatically.</p>
            </div>
            <NotesPanel />
          </div>
        )}
       </main>
    <footer style={{
      textAlign: 'center',
      padding: '32px 20px',
      color: 'var(--moss-light)',
      fontSize: 12,
      letterSpacing: '0.04em',
    }}>
      △ TenshiInc. All Rights Reserved. 2026
    </footer>
    </div>
  )
}
