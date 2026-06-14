import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { habits, habitLogs, ticketTransactions, children } from '@/lib/db/schema'
import { eq, and, sum } from 'drizzle-orm'
import { pusherServer, familyChannel } from '@/lib/pusher'
import type { CompleteHabitResponse } from '@/lib/types'
import { todayWIB } from '@/lib/date'
import { requireFamilyContext } from '@/lib/family'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { familyId, familySlug } = await requireFamilyContext()
  const { id } = await params
  const body = await request.json()
  const { child_id } = body as { child_id: string }

  if (!child_id) {
    return NextResponse.json({ error: 'child_id is required' }, { status: 400 })
  }

  // Validasi child milik family yang login
  const [child] = await db.select({ id: children.id }).from(children).where(
    and(eq(children.id, child_id), eq(children.familyId, familyId))
  )
  if (!child) return NextResponse.json({ error: 'Child not found' }, { status: 404 })

  const today = todayWIB()

  // Validasi habit milik child tersebut
  const [habit] = await db.select().from(habits).where(and(eq(habits.id, id), eq(habits.childId, child_id)))
  if (!habit) {
    return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
  }

  // Idempotent: jangan double-log jika sudah selesai hari ini
  const [existing] = await db
    .select()
    .from(habitLogs)
    .where(and(eq(habitLogs.habitId, id), eq(habitLogs.childId, child_id), eq(habitLogs.date, today)))

  if (existing) {
    return NextResponse.json({ error: 'Habit already completed today' }, { status: 409 })
  }

  const [log] = await db
    .insert(habitLogs)
    .values({
      habitId: id,
      childId: child_id,
      date: today,
      completedAt: new Date(),
      ticketsEarned: habit.ticketsValue,
    })
    .returning()

  await db.insert(ticketTransactions).values({
    childId: child_id,
    type: 'earned',
    amount: habit.ticketsValue,
    reason: `Selesai: ${habit.name}`,
  })

  const ticketSum = await db
    .select({ total: sum(ticketTransactions.amount) })
    .from(ticketTransactions)
    .where(eq(ticketTransactions.childId, child_id))

  const totalTickets = Number(ticketSum[0]?.total ?? 0)

  // Cek apakah semua habit hari ini sudah selesai
  const activeHabits = await db
    .select()
    .from(habits)
    .where(and(eq(habits.childId, child_id), eq(habits.isActive, true)))

  const todayLogs = await db
    .select()
    .from(habitLogs)
    .where(and(eq(habitLogs.childId, child_id), eq(habitLogs.date, today)))

  const allHabitsDone = activeHabits.every((h) =>
    todayLogs.some((l) => l.habitId === h.id)
  )

  await pusherServer.trigger(familyChannel(familyId), 'habit_completed', {
    childId: child_id,
    habitId: id,
    totalTickets,
    allHabitsDone,
    familySlug,
  })

  const response: CompleteHabitResponse = {
    habitLogId: log.id,
    ticketsEarned: habit.ticketsValue,
    totalTickets,
    allHabitsDone,
  }

  return NextResponse.json(response)
}
