import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { habits, habitLogs, ticketTransactions } from '@/lib/db/schema'
import { eq, and, sum } from 'drizzle-orm'
import { emitEvent } from '@/lib/sse'
import type { CompleteHabitResponse } from '@/lib/types'

function todayDate() {
  return new Date().toISOString().split('T')[0]
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { child_id } = body as { child_id: string }

  if (!child_id) {
    return NextResponse.json({ error: 'child_id is required' }, { status: 400 })
  }

  const today = todayDate()

  const [habit] = await db.select().from(habits).where(eq(habits.id, id))
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

  emitEvent('habit_completed', {
    childId: child_id,
    habitId: id,
    totalTickets,
    allHabitsDone,
  })

  const response: CompleteHabitResponse = {
    habitLogId: log.id,
    ticketsEarned: habit.ticketsValue,
    totalTickets,
    showJournal: habit.isMeal,
    allHabitsDone,
  }

  return NextResponse.json(response)
}
