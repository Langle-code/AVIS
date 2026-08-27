import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { embedText, generateQuestion } from '@/lib/gemini'
import { NmatSubject } from '@/types'

// POST /api/rag
// Body: { topic: string, subject?: NmatSubject }
// Embeds the topic, finds closest chunks, generates a fresh targeted question
export async function POST(req: NextRequest) {
  try {
    const { topic, subject } = await req.json()

    if (!topic) {
      return NextResponse.json({ error: 'topic is required' }, { status: 400 })
    }

    const db = supabaseAdmin()

    // 1. Embed the topic query
    const queryEmbedding = await embedText(topic)

    // 2. Retrieve top 3 most similar chunks via pgvector
    const { data: chunks, error } = await db.rpc('match_chunks', {
      query_embedding: queryEmbedding,
      match_count: 3,
      filter_subject: subject || null,
    })

    if (error) throw error
    if (!chunks || chunks.length === 0) {
      return NextResponse.json({ error: 'No relevant material found for this topic' }, { status: 404 })
    }

    // 3. Merge top chunks into a single context block
    const context = chunks.map((c: any) => c.content).join('\n\n---\n\n')
    const subjectTag: NmatSubject = subject || chunks[0].subject_tag

    // 4. Generate a fresh question from the retrieved context
    const question = await generateQuestion(context, subjectTag)

    if (!question) {
      return NextResponse.json({ error: 'Question generation failed' }, { status: 500 })
    }

    // 5. Save it to the question bank + init review state
    const { data: saved, error: saveError } = await db
      .from('questions')
      .insert({
        chunk_id: chunks[0].id,
        source_id: chunks[0].source_id,
        question_text: question.question_text,
        choices: question.choices,
        correct_answer: question.correct_answer,
        rationale: question.rationale,
        subject_tag: subjectTag,
      })
      .select()
      .single()

    if (saveError) throw saveError

    await db.from('review_state').insert({
      question_id: saved.id,
      next_due_date: new Date().toISOString(),
      ease_factor: 2.5,
      interval: 1,
      repetitions: 0,
    })

    return NextResponse.json({
      success: true,
      question: {
        ...saved,
        review_state_id: saved.id, // will be updated on first fetch
      },
      chunks_used: chunks.length,
      similarity_scores: chunks.map((c: any) => c.similarity),
    })
  } catch (err) {
    console.error('RAG error:', err)
    return NextResponse.json({ error: 'RAG retrieval failed', detail: String(err) }, { status: 500 })
  }
}
