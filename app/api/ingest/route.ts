import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { extractFromUrl, chunkText } from '@/lib/extract'
import { embedText, detectSubject, generateQuestion } from '@/lib/gemini'
import { NmatSubject } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const { url, subject_override } = await req.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const db = supabaseAdmin()

    // 1. Extract text from URL
    const { text, type, title } = await extractFromUrl(url)
    if (!text || text.length < 100) {
      return NextResponse.json({ error: 'Could not extract enough text from this URL' }, { status: 422 })
    }

    // 2. Detect subject (or use override)
    const subject_tag: NmatSubject = subject_override || await detectSubject(text)

    // 3. Save source
    const { data: source, error: sourceError } = await db
      .from('sources')
      .insert({ url, type, title, subject_tag, raw_text: text.slice(0, 50000) })
      .select()
      .single()

    if (sourceError) throw sourceError

    // 4. Chunk text
    const chunks = chunkText(text)

    // 5. Embed + save chunks + generate questions (batch)
    let questionsGenerated = 0
    for (const chunkContent of chunks) {
      const embedding = await embedText(chunkContent)

      const { data: chunk, error: chunkError } = await db
        .from('chunks')
        .insert({
          source_id: source.id,
          content: chunkContent,
          embedding,
          subject_tag,
        })
        .select()
        .single()

      if (chunkError) {
        console.error('Chunk insert error:', chunkError)
        continue
      }

      // Generate a question for every other chunk to avoid over-generation
      if (chunks.indexOf(chunkContent) % 2 === 0) {
        const q = await generateQuestion(chunkContent, subject_tag)
        if (q) {
          const { data: question, error: qError } = await db
            .from('questions')
            .insert({
              chunk_id: chunk.id,
              source_id: source.id,
              question_text: q.question_text,
              choices: q.choices,
              correct_answer: q.correct_answer,
              rationale: q.rationale,
              subject_tag,
            })
            .select()
            .single()

          if (!qError && question) {
            // Init SM-2 review state for this question
            await db.from('review_state').insert({
              question_id: question.id,
              next_due_date: new Date().toISOString(),
              ease_factor: 2.5,
              interval: 1,
              repetitions: 0,
            })
            questionsGenerated++
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      source_id: source.id,
      title,
      subject_tag,
      chunks_processed: chunks.length,
      questions_generated: questionsGenerated,
    })
  } catch (err) {
    console.error('Ingest error:', err)
    return NextResponse.json({ error: 'Ingestion failed', detail: String(err) }, { status: 500 })
  }
}
