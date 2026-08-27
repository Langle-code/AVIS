-- Enable pgvector extension
create extension if not exists vector;

-- Sources: ingested URLs / documents
create table sources (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  type text not null check (type in ('youtube', 'pdf', 'doc', 'text')),
  title text,
  subject_tag text not null,
  raw_text text,
  ingested_at timestamptz default now()
);

-- Chunks: text pieces with embeddings
create table chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references sources(id) on delete cascade,
  content text not null,
  embedding vector(768),
  subject_tag text not null,
  created_at timestamptz default now()
);

-- Vector index for similarity search
create index on chunks using hnsw (embedding vector_cosine_ops);

-- Questions: MCQs generated from chunks
create table questions (
  id uuid primary key default gen_random_uuid(),
  chunk_id uuid references chunks(id) on delete cascade,
  source_id uuid references sources(id) on delete cascade,
  question_text text not null,
  choices jsonb not null,
  correct_answer text not null check (correct_answer in ('A', 'B', 'C', 'D')),
  rationale text not null,
  subject_tag text not null,
  created_at timestamptz default now()
);

-- Attempts: answer history
create table attempts (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references questions(id) on delete cascade,
  correct boolean not null,
  answered_at timestamptz default now(),
  channel text not null check (channel in ('web', 'messenger'))
);

-- Review state: SM-2 spaced repetition state per question
create table review_state (
  id uuid primary key default gen_random_uuid(),
  question_id uuid unique references questions(id) on delete cascade,
  next_due_date timestamptz default now(),
  ease_factor float default 2.5,
  interval int default 1,
  repetitions int default 0
);

-- Index for efficient due-question queries
create index on review_state (next_due_date asc);

-- Messenger pending: tracks questions sent via Messenger awaiting reply
create table messenger_pending (
  id uuid primary key default gen_random_uuid(),
  sender_id text not null,
  question_id uuid references questions(id) on delete cascade,
  review_state_id uuid references review_state(id) on delete cascade,
  sent_at timestamptz default now(),
  answered boolean default false
);

create index on messenger_pending (sender_id, answered);

-- RAG: similarity search function
-- Returns the top N chunks closest to a query embedding
create or replace function match_chunks (
  query_embedding vector(768),
  match_count int default 3,
  filter_subject text default null
)
returns table (
  id uuid,
  source_id uuid,
  content text,
  subject_tag text,
  similarity float
)
language sql stable
as $$
  select
    chunks.id,
    chunks.source_id,
    chunks.content,
    chunks.subject_tag,
    1 - (chunks.embedding <=> query_embedding) as similarity
  from chunks
  where filter_subject is null or chunks.subject_tag = filter_subject
  order by chunks.embedding <=> query_embedding
  limit match_count;
$$;
