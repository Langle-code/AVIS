import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sm2Update, nextDueDate } from '@/lib/sm2'

// GET /api/questions — fetch today's due questions
export async function GET(req: NextRequest) {
  const db = supabaseAdmin()
  const subject = req.nextUrl.searchParams.get('subject')
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '5')

  let query = db
    .from('review_state')
    .select(`
      *,
      questions (
        id, question_text, choices, correct_answer, rationale, subject_tag
      )
    `)
    .lte('next_due_date', new Date().toISOString())
    .order('next_due_date', { ascending: true })
    .limit(limit)

  if (subject) {
    // Filter via join — fetch then filter
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const questions = data
    ?.filter(row => row.questions)
    .filter(row => !subject || (row.questions as any).subject_tag === subject)
    .map(row => ({
      review_state_id: row.id,
      ...(row.questions as any),
    }))

  return NextResponse.json({ questions: questions || [] })
}

// POST /api/questions — record an answer
export async function POST(req: NextRequest) {
  const db = supabaseAdmin()
  const { question_id, review_state_id, answer, channel = 'web' } = await req.json()

  // Fetch the question to check correct answer
  const { data: question } = await db
    .from('questions')
    .select('correct_answer')
    .eq('id', question_id)
    .single()

  const correct = question?.correct_answer === answer

  // Record attempt
  await db.from('attempts').insert({
    question_id,
    correct,
    answered_at: new Date().toISOString(),
    channel,
  })

  // Update SM-2 state
  const { data: state } = await db
    .from('review_state')
    .select('*')
    .eq('id', review_state_id)
    .single()

  if (state) {
    const quality = correct ? 4 : 1
    const updated = sm2Update(
      { ease_factor: state.ease_factor, interval: state.interval, repetitions: state.repetitions },
      quality
    )
    await db.from('review_state').update({
      ...updated,
      next_due_date: nextDueDate(updated.interval),
    }).eq('id', review_state_id)
  }

  return NextResponse.json({ correct, correct_answer: question?.correct_answer })
}
