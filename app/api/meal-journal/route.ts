import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { mealJournals } from '@/lib/db/schema'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { child_id, habit_log_id, date, meal_type, portion, mood, food_description, notes, duration_minutes } = body

  if (!child_id || !date || !meal_type || !portion || !mood) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const [journal] = await db
    .insert(mealJournals)
    .values({
      childId: child_id,
      habitLogId: habit_log_id ?? null,
      date,
      mealType: meal_type,
      portion,
      mood,
      foodDescription: food_description ?? null,
      notes: notes ?? null,
      durationMinutes: duration_minutes ?? null,
    })
    .returning()

  return NextResponse.json({ id: journal.id })
}
