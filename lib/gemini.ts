import { GoogleGenerativeAI } from '@google/generative-ai'
import { Choice, NmatSubject } from '@/types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

/**
 * Generate text embedding for a chunk of text
 */
export async function embedText(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' })
  const result = await model.embedContent({
    content: { parts: [{ text }], role: 'user' },
    taskType: 'RETRIEVAL_DOCUMENT',
    outputDimensionality: 768,
  } as any)
  return result.embedding.values
}

/**
 * Auto-detect the NMAT subject tag from source content
 */
export async function detectSubject(text: string): Promise<NmatSubject> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  const prompt = `You are an NMAT exam classifier. Given the following text, classify it into exactly one of these NMAT subject areas:
- biology
- physical_science
- social_science
- verbal
- quantitative
- inductive_reasoning

Respond with ONLY the subject label, nothing else.

Text:
${text.slice(0, 1500)}`

  const result = await model.generateContent(prompt)
  const label = result.response.text().trim().toLowerCase() as NmatSubject
  const valid: NmatSubject[] = ['biology', 'physical_science', 'social_science', 'verbal', 'quantitative', 'inductive_reasoning']
  return valid.includes(label) ? label : 'biology'
}

export interface GeneratedQuestion {
  question_text: string
  choices: Choice[]
  correct_answer: 'A' | 'B' | 'C' | 'D'
  rationale: string
}

/**
 * Generate a single MCQ from a text chunk
 */
export async function generateQuestion(
  chunk: string,
  subject: NmatSubject
): Promise<GeneratedQuestion | null> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `You are an NMAT exam question writer specializing in ${subject.replace('_', ' ')}.

Generate ONE multiple choice question based on this study material. The question should test genuine understanding, not just recall.

Study material:
${chunk}

Respond in this exact JSON format (no markdown, no backticks):
{
  "question_text": "The question here?",
  "choices": [
    { "label": "A", "text": "First option" },
    { "label": "B", "text": "Second option" },
    { "label": "C", "text": "Third option" },
    { "label": "D", "text": "Fourth option" }
  ],
  "correct_answer": "A",
  "rationale": "Brief explanation of why this is correct and why others are wrong."
}`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean) as GeneratedQuestion
  } catch {
    return null
  }
}

/**
 * Messenger nudge message — picks a question and formats it for Messenger
 */
export async function formatMessengerQuestion(q: {
  id: string
  question_text: string
  choices: Choice[]
  subject_tag: NmatSubject
}): Promise<string> {
  const subjectLabel: Record<NmatSubject, string> = {
    biology: '🧬 Biology',
    physical_science: '⚗️ Physical Science',
    social_science: '🌍 Social Science',
    verbal: '📖 Verbal',
    quantitative: '🔢 Quantitative',
    inductive_reasoning: '🧩 Inductive Reasoning',
  }

  const choices = q.choices.map(c => `${c.label}. ${c.text}`).join('\n')
  return `✨ Time for a quick review!\n\n${subjectLabel[q.subject_tag]}\n\n${q.question_text}\n\n${choices}\n\nReply with A, B, C, or D — or open Avis to review your full session.`
}
