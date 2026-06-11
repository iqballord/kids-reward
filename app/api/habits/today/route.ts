import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { children, habits, habitLogs, ticketTransactions } from '@/lib/db/schema'
import { eq, and, sum } from 'drizzle-orm'
import type { TodayData, HabitWithStatus } from '@/lib/types'
import { todayWIB } from '@/lib/date'

export async function GET() {
  const today = todayWIB()

  const allChildren = await db.select().from(children).orderBy(children.createdAt)

  const result: TodayData[] = await Promise.all(
    allChildren.map(async (child) => {
      const activeHabits = await db
        .select()
        .from(habits)
        .where(and(eq(habits.childId, child.id), eq(habits.isActive, true)))
        .orderBy(habits.sortOrder)

      const todayLogs = await db
        .select()
        .from(habitLogs)
        .where(and(eq(habitLogs.childId, child.id), eq(habitLogs.date, today)))

      const ticketSum = await db
        .select({ total: sum(ticketTransactions.amount) })
        .from(ticketTransactions)
        .where(eq(ticketTransactions.childId, child.id))

      const totalTickets = Number(ticketSum[0]?.total ?? 0)

      const habitsWithStatus: HabitWithStatus[] = activeHabits.map((h) => {
        const log = todayLogs.find((l) => l.habitId === h.id)
        return {
          ...h,
          schedule: h.schedule as HabitWithStatus['schedule'],
          logId: log?.id ?? null,
          completedAt: log?.completedAt?.toISOString() ?? null,
          ticketsEarned: log?.ticketsEarned ?? null,
        }
      })

      return {
        child,
        totalTickets,
        habits: {
          morning: habitsWithStatus.filter((h) => h.schedule === 'morning'),
          afternoon: habitsWithStatus.filter((h) => h.schedule === 'afternoon'),
          evening: habitsWithStatus.filter((h) => h.schedule === 'evening'),
        },
      }
    })
  )

  return NextResponse.json(result)
}
