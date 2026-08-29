import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const db = supabaseAdmin()
  const { data, error } = await db
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notes: data || [] })
}

export async function POST(req: NextRequest) {
  const db = supabaseAdmin()
  const { content, subject_tag } = await req.json()
  const { data, error } = await db
    .from('notes')
    .insert({ content: content || '', subject_tag: subject_tag || null })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ note: data })
}

export async function PATCH(req: NextRequest) {
  const db = supabaseAdmin()
  const { id, content, subject_tag } = await req.json()
  const { data, error } = await db
    .from('notes')
    .update({ content, subject_tag: subject_tag || null, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ note: data })
}

export async function DELETE(req: NextRequest) {
  const db = supabaseAdmin()
  const { id } = await req.json()
  const { error } = await db.from('notes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
