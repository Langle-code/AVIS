import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendMessage, sendQuickReply } from '@/lib/messenger'
import { sm2Update, nextDueDate } from '@/lib/sm2'

const VERIFY_TOKEN = process.env.MESSENGER_VERIFY_TOKEN!

// GET — Meta webhook verification handshake
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('hub.mode')
  const token = req.nextUrl.searchParams.get('hub.verify_token')
  const challenge = req.nextUrl.searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Messenger webhook verified')
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// POST — incoming messages from Messenger
export async function POST(req: NextRequest) {
  const body = await req.json()

  if (body.object !== 'page') {
    return NextResponse.json({ error: 'Not a page event' }, { status: 404 })
  }

  for (const entry of body.entry || []) {
    for (const event of entry.messaging || []) {
      const senderId = event.sender?.id
      if (!senderId) continue

      if (event.message?.text) {
        await handleTextMessage(senderId, event.message.text)
      } else if (event.postback?.payload) {
        await handlePostback(senderId, event.postback.payload)
      }
    }
  }

  // Always return 200 quickly so Meta doesn't retry
  return NextResponse.json({ status: 'ok' })
}

async function handleTextMessage(senderId: string, text: string) {
  const normalized = text.trim().toUpperCase()

  // Check if it's an answer to a pending question
  if (['A', 'B', 'C', 'D'].includes(normalized)) {
    await handleAnswer(senderId, normalized as 'A' | 'B' | 'C' | 'D')
    return
  }

  // Default response
  await sendMessage(
    senderId,
    "Hi! I'm Avis 🌿 I'll send you review questions throughout the day. Reply A, B, C, or D to answer. You can also open your Avis dashboard to do a full session!"
  )
}

async function handlePostback(senderId: string, payload: string) {
  if (payload === 'GET_STARTED') {
    await sendMessage(
      senderId,
      "Welcome to Avis! 🌸 I'll nudge you with NMAT review questions throughout the day. Just reply with A, B, C, or D when you get a question. Let's get you ready! 💪"
    )
  }
}

async function handleAnswer(senderId: string, answer: 'A' | 'B' | 'C' | 'D') {
  const db = supabaseAdmin()

  // Find the most recent unanswered question sent to this user via Messenger
  const { data: pending } = await db
    .from('messenger_pending')
    .select('*, review_state_id, question_id')
    .eq('sender_id', senderId)
    .eq('answered', false)
    .order('sent_at', { ascending: false })
    .limit(1)
    .single()

  if (!pending) {
    await sendMessage(senderId, "Hmm, I don't have an active question for you right now. Check your Avis dashboard for a full review session! 🌿")
    return
  }

  // Check answer
  const { data: question } = await db
    .from('questions')
    .select('correct_answer, rationale, question_text')
    .eq('id', pending.question_id)
    .single()

  if (!question) return

  const correct = question.correct_answer === answer

  // Record attempt
  await db.from('attempts').insert({
    question_id: pending.question_id,
    correct,
    answered_at: new Date().toISOString(),
    channel: 'messenger',
  })

  // Mark pending as answered
  await db.from('messenger_pending').update({ answered: true }).eq('id', pending.id)

  // Update SM-2
  const { data: state } = await db
    .from('review_state')
    .select('*')
    .eq('id', pending.review_state_id)
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
    }).eq('id', pending.review_state_id)
  }

  // Send result
  const resultMsg = correct
    ? `✅ Correct! Great job!\n\n📖 ${question.rationale}`
    : `❌ Not quite — the answer is ${question.correct_answer}.\n\n📖 ${question.rationale}`

  await sendMessage(senderId, resultMsg)
}
