import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { habits, children } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireFamilyContext } from '@/lib/family'

async function verifyChildOwnership(childId: string, familyId: string) {
  const [child] = await db.select({ id: children.id }).from(children).where(
    and(eq(children.id, childId), eq(children.familyId, familyId))
  )
  return !!child
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { familyId } = await requireFamilyContext()
  const { id } = await params
  if (!await verifyChildOwnership(id, familyId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const list = await db.select().from(habits).where(eq(habits.childId, id)).orderBy(habits.sortOrder)
  return NextResponse.json(list)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { familyId } = await requireFamilyContext()
  const { id } = await params
  if (!await verifyChildOwnership(id, familyId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  const { name, icon, schedule, tickets_value, is_meal } = body as {
    name: string; icon: string; schedule: string; tickets_value: number; is_meal: boolean
  }

  if (!name || !icon || !schedule || !tickets_value) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const existing = await db.select().from(habits).where(eq(habits.childId, id))
  const maxSort = existing.reduce((max, h) => Math.max(max, h.sortOrder), 0)

  const [habit] = await db
    .insert(habits)
    .values({ childId: id, name: name.trim(), icon, schedule, ticketsValue: tickets_value, isMeal: is_meal ?? false, sortOrder: maxSort + 1 })
    .returning()

  return NextResponse.json(habit)
}
