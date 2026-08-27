import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const db = supabaseAdmin()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [{ count: total }, { count: correctToday }] = await Promise.all([
    db.from('attempts').select('*', { count: 'exact', head: true }),
    db.from('attempts')
      .select('*', { count: 'exact', head: true })
      .eq('correct', true)
      .gte('answered_at', today.toISOString()),
  ])

  // Simple streak: count distinct days with at least one correct answer
  const { data: recentDays } = await db
    .from('attempts')
    .select('answered_at')
    .eq('correct', true)
    .order('answered_at', { ascending: false })
    .limit(100)

  let streakDays = 0
  if (recentDays && recentDays.length > 0) {
    const days = new Set(recentDays.map(r => r.answered_at.slice(0, 10)))
    const check = new Date()
    while (days.has(check.toISOString().slice(0, 10))) {
      streakDays++
      check.setDate(check.getDate() - 1)
    }
  }

  return NextResponse.json({
    total_answered: total || 0,
    correct_today: correctToday || 0,
    streak_days: streakDays,
  })
}
