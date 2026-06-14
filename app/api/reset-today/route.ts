import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { habitLogs, ticketTransactions, children } from '@/lib/db/schema'
import { eq, and, gte, lt, inArray } from 'drizzle-orm'
import { pusherServer, familyChannel } from '@/lib/pusher'
import { todayWIB } from '@/lib/date'
import { requireFamilyContext } from '@/lib/family'

function todayRangeWIB() {
  const today = todayWIB()
  const start = new Date(`${today}T00:00:00+07:00`)
  const end = new Date(`${today}T23:59:59.999+07:00`)
  return { today, start, end }
}

export async function POST() {
  const { familyId } = await requireFamilyContext()
  const { today, start, end } = todayRangeWIB()

  const familyChildren = await db.select({ id: children.id }).from(children).where(eq(children.familyId, familyId))
  const childIds = familyChildren.map(c => c.id)
  if (childIds.length === 0) return NextResponse.json({ ok: true })

  await db.delete(habitLogs).where(and(eq(habitLogs.date, today), inArray(habitLogs.childId, childIds)))
  await db.delete(ticketTransactions).where(and(gte(ticketTransactions.createdAt, start), lt(ticketTransactions.createdAt, end), inArray(ticketTransactions.childId, childIds)))

  await pusherServer.trigger(familyChannel(familyId), 'reset_today', { reset: true })
  return NextResponse.json({ ok: true })
}
