import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { mealJournals, children } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireFamilyContext } from '@/lib/family'

async function verifyJournalOwnership(journalId: string, familyId: string) {
  const [journal] = await db
    .select({ id: mealJournals.id, childId: mealJournals.childId })
    .from(mealJournals)
    .where(eq(mealJournals.id, journalId))
  if (!journal) return null
  const [child] = await db.select({ id: children.id }).from(children).where(
    and(eq(children.id, journal.childId), eq(children.familyId, familyId))
  )
  return child ? journal : null
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { familyId } = await requireFamilyContext()
  const { id } = await params
  const journal = await verifyJournalOwnership(id, familyId)
  if (!journal) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const [full] = await db.select().from(mealJournals).where(eq(mealJournals.id, id))
  return NextResponse.json(full)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { familyId } = await requireFamilyContext()
  const { id } = await params
  if (!await verifyJournalOwnership(id, familyId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

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
      childId: child_id, date, mealType: meal_type, startTime: start_time ?? null,
      portion, behaviorStart: behavior_start ?? [], behaviorEnd: behavior_end ?? [],
      eatenWith: eaten_with, eatenWithOther: eaten_with_other ?? null,
      location, locationOther: location_other ?? null,
      foodOffered: food_offered ?? null, foodRejected: food_rejected ?? false,
      durationMinutes: duration_minutes ?? null, preMealContext: pre_meal_context ?? null,
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
  const { familyId } = await requireFamilyContext()
  const { id } = await params
  if (!await verifyJournalOwnership(id, familyId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  await db.delete(mealJournals).where(eq(mealJournals.id, id))
  return NextResponse.json({ ok: true })
}
