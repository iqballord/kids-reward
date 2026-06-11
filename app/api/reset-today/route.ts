import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { habitLogs, ticketTransactions } from '@/lib/db/schema'
import { eq, and, gte, lt } from 'drizzle-orm'
import { emitEvent } from '@/lib/sse'
import { todayWIB } from '@/lib/date'

function todayRangeWIB() {
  const today = todayWIB()
  const start = new Date(`${today}T00:00:00+07:00`)
  const end = new Date(`${today}T23:59:59.999+07:00`)
  return { start, end }
}

export async function POST() {
  const today = todayWIB()
  const { start, end } = todayRangeWIB()

  // Hapus semua habit logs hari ini
  await db
    .delete(habitLogs)
    .where(eq(habitLogs.date, today))

  // Hapus semua ticket transactions hari ini (earned maupun redeemed)
  await db
    .delete(ticketTransactions)
    .where(and(
      gte(ticketTransactions.createdAt, start),
      lt(ticketTransactions.createdAt, end)
    ))

  // Notify TV dashboard untuk refresh
  emitEvent('habit_completed', { reset: true })

  return NextResponse.json({ ok: true })
}
