import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { mealJournals, children } from '@/lib/db/schema'
import { eq, and, gte, lte, desc } from 'drizzle-orm'
import { todayWIB } from '@/lib/date'
import { requireFamilyContext } from '@/lib/family'

export async function POST(request: NextRequest) {
  const { familyId } = await requireFamilyContext()
  const body = await request.json()
  const {
    child_id, date, meal_type, start_time, portion,
    behavior_start, behavior_end, eaten_with, eaten_with_other,
    location, location_other, food_offered, food_rejected,
    duration_minutes, pre_meal_context, notes,
  } = body

  if (!child_id || !meal_type || !portion || !eaten_with || !location) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Validasi child milik keluarga ini
  const [child] = await db.select({ id: children.id }).from(children).where(
    and(eq(children.id, child_id), eq(children.familyId, familyId))
  )
  if (!child) return NextResponse.json({ error: 'Child not found' }, { status: 404 })

  const [journal] = await db
    .insert(mealJournals)
    .values({
      childId: child_id,
      date: date ?? todayWIB(),
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
    .returning()

  return NextResponse.json({ id: journal.id })
}

export async function GET(request: NextRequest) {
  const { familyId } = await requireFamilyContext()
  const { searchParams } = new URL(request.url)
  const childId = searchParams.get('child_id')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  if (!childId) return NextResponse.json({ error: 'child_id is required' }, { status: 400 })

  // Validasi child milik keluarga ini
  const [child] = await db.select({ id: children.id }).from(children).where(
    and(eq(children.id, childId), eq(children.familyId, familyId))
  )
  if (!child) return NextResponse.json({ error: 'Child not found' }, { status: 404 })

  const conditions = [eq(mealJournals.childId, childId)]
  if (from) conditions.push(gte(mealJournals.date, from))
  if (to) conditions.push(lte(mealJournals.date, to))

  const journals = await db
    .select()
    .from(mealJournals)
    .where(and(...conditions))
    .orderBy(desc(mealJournals.date), desc(mealJournals.createdAt))

  return NextResponse.json(journals)
}
