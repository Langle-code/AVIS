import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendQuickReply } from '@/lib/messenger'
import { formatMessengerQuestion } from '@/lib/gemini'
import { NmatSubject } from '@/types'

const SISTER_PSID = process.env.SISTER_MESSENGER_PSID! // her Messenger Page-Scoped ID
const CRON_SECRET = process.env.CRON_SECRET!

export async function GET(req: NextRequest) {
  // Auth check — Vercel Cron passes the secret as a header
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = supabaseAdmin()

  // Fetch the next due question
  const { data: due } = await db
    .from('review_state')
    .select(`
      id,
      questions (
        id, question_text, choices, subject_tag
      )
    `)
    .lte('next_due_date', new Date().toISOString())
    .order('next_due_date', { ascending: true })
    .limit(1)
    .single()

  if (!due || !due.questions) {
    return NextResponse.json({ sent: false, reason: 'No questions due' })
  }

  const q = due.questions as any

  // Format the message
  const messageText = await formatMessengerQuestion({
    id: q.id,
    question_text: q.question_text,
    choices: q.choices,
    subject_tag: q.subject_tag as NmatSubject,
  })

  // Send to sister via Messenger
  await sendQuickReply(SISTER_PSID, messageText, [
    { title: 'A', payload: 'A' },
    { title: 'B', payload: 'B' },
    { title: 'C', payload: 'C' },
    { title: 'D', payload: 'D' },
  ])

  // Log the sent question so we can match her reply
  await db.from('messenger_pending').insert({
    sender_id: SISTER_PSID,
    question_id: q.id,
    review_state_id: due.id,
    sent_at: new Date().toISOString(),
    answered: false,
  })

  return NextResponse.json({ sent: true, question_id: q.id })
}
