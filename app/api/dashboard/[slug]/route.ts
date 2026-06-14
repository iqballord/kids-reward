import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { families, children, habits, habitLogs, ticketTransactions, rewards, hourglassSessions } from '@/lib/db/schema'
import { eq, and, sum } from 'drizzle-orm'
import { todayWIB } from '@/lib/date'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const [family] = await db
    .select()
    .from(families)
    .where(eq(families.slug, slug.toLowerCase()))

  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 })

  const today = todayWIB()

  const familyChildren = await db
    .select()
    .from(children)
    .where(eq(children.familyId, family.id))

  const todayData = await Promise.all(
    familyChildren.map(async (child) => {
      const childHabits = await db
        .select()
        .from(habits)
        .where(and(eq(habits.childId, child.id), eq(habits.isActive, true)))

      const todayLogs = await db
        .select()
        .from(habitLogs)
        .where(and(eq(habitLogs.childId, child.id), eq(habitLogs.date, today)))

      const ticketSum = await db
        .select({ total: sum(ticketTransactions.amount) })
        .from(ticketTransactions)
        .where(eq(ticketTransactions.childId, child.id))

      const totalTickets = Number(ticketSum[0]?.total ?? 0)

      const habitsWithStatus = childHabits.map(habit => {
        const log = todayLogs.find(l => l.habitId === habit.id)
        return {
          ...habit,
          logId: log?.id ?? null,
          completedAt: log?.completedAt?.toISOString() ?? null,
          ticketsEarned: log?.ticketsEarned ?? null,
        }
      })

      const bySchedule = {
        morning: habitsWithStatus.filter(h => h.schedule === 'morning'),
        afternoon: habitsWithStatus.filter(h => h.schedule === 'afternoon'),
        evening: habitsWithStatus.filter(h => h.schedule === 'evening'),
      }

      return { child, habits: bySchedule, totalTickets }
    })
  )

  // Hourglass per child
  const hourglassData: Record<string, object> = {}
  for (const child of familyChildren) {
    const [session] = await db
      .select()
      .from(hourglassSessions)
      .where(and(eq(hourglassSessions.childId, child.id)))
      .orderBy(hourglassSessions.startedAt)
      .limit(1)
    if (session && !session.endedAt) {
      hourglassData[child.id] = session
    }
  }

  // Rewards
  const familyRewards = await db
    .select()
    .from(rewards)
    .where(and(eq(rewards.isActive, true)))

  return NextResponse.json({
    familyId: family.id,
    familyName: family.name,
    todayData,
    rewards: familyRewards.filter(r => !r.childId || familyChildren.some(c => c.id === r.childId)),
    hourglasses: hourglassData,
  })
}
