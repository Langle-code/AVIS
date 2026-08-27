export type NmatSubject =
  | 'biology'
  | 'physical_science'
  | 'social_science'
  | 'verbal'
  | 'quantitative'
  | 'inductive_reasoning'

export interface Source {
  id: string
  url: string
  type: 'youtube' | 'pdf' | 'doc' | 'text'
  subject_tag: NmatSubject
  title: string
  raw_text: string
  ingested_at: string
}

export interface Chunk {
  id: string
  source_id: string
  content: string
  embedding: number[]
  subject_tag: NmatSubject
}

export interface Choice {
  label: 'A' | 'B' | 'C' | 'D'
  text: string
}

export interface Question {
  id: string
  chunk_id: string
  source_id: string
  question_text: string
  choices: Choice[]
  correct_answer: 'A' | 'B' | 'C' | 'D'
  rationale: string
  subject_tag: NmatSubject
  created_at: string
}

export interface Attempt {
  id: string
  question_id: string
  correct: boolean
  answered_at: string
  channel: 'web' | 'messenger'
}

export interface ReviewState {
  id: string
  question_id: string
  next_due_date: string
  ease_factor: number
  interval: number // days
  repetitions: number
}
