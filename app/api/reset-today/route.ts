import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { habitLogs, ticketTransactions } from '@/lib/db/schema'
import { eq, and, gte, lt } from 'drizzle-orm'
import { emitEvent } from '@/lib/sse'

function todayRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

function todayDate() {
  return new Date().toISOString().split('T')[0]
}

export async function POST() {
  const today = todayDate()
  const { start, end } = todayRange()

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
