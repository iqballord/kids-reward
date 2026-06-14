import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { habitLogs, habits, children } from '@/lib/db/schema'
import { eq, and, gte, lte, desc } from 'drizzle-orm'
import { requireFamilyContext } from '@/lib/family'

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

  const conditions = [eq(habitLogs.childId, childId)]
  if (from) conditions.push(gte(habitLogs.date, from))
  if (to) conditions.push(lte(habitLogs.date, to))

  const rows = await db
    .select({
      id: habitLogs.id,
      date: habitLogs.date,
      completedAt: habitLogs.completedAt,
      ticketsEarned: habitLogs.ticketsEarned,
      habitId: habitLogs.habitId,
      habitName: habits.name,
      habitIcon: habits.icon,
      habitSchedule: habits.schedule,
    })
    .from(habitLogs)
    .innerJoin(habits, eq(habitLogs.habitId, habits.id))
    .where(and(...conditions))
    .orderBy(desc(habitLogs.date))

  const grouped: Record<string, typeof rows> = {}
  for (const row of rows) {
    if (!grouped[row.date]) grouped[row.date] = []
    grouped[row.date].push(row)
  }

  return NextResponse.json(grouped)
}
