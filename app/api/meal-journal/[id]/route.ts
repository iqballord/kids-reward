import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { mealJournals } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [journal] = await db.select().from(mealJournals).where(eq(mealJournals.id, id))
  if (!journal) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(journal)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const {
    child_id, date, meal_type, start_time, portion,
    behavior_start, behavior_end, eaten_with, eaten_with_other,
    location, location_other, food_offered, food_rejected,
    duration_minutes, pre_meal_context, notes,
  } = body

  const [updated] = await db
    .update(mealJournals)
    .set({
      childId: child_id,
      date,
      mealType: meal_type,
      startTime: start_time ?? null,
      portion,
      behaviorStart: behavior_start ?? [],
      behaviorEnd: behavior_end ?? [],
      eatenWith: eaten_with,
      eatenWithOther: eaten_with_other ?? null,
      location,
      locationOther: location_other ?? null,
      foodOffered: food_offered ?? null,
      foodRejected: food_rejected ?? false,
      durationMinutes: duration_minutes ?? null,
      preMealContext: pre_meal_context ?? null,
      notes: notes ?? null,
    })
    .where(eq(mealJournals.id, id))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await db.delete(mealJournals).where(eq(mealJournals.id, id))
  return NextResponse.json({ ok: true })
}
