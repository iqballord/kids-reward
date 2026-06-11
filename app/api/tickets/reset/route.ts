import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { children, ticketTransactions } from '@/lib/db/schema'
import { eq, sum } from 'drizzle-orm'
import { emitEvent } from '@/lib/sse'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { child_id } = body as { child_id?: string }

  const targets = child_id
    ? [{ id: child_id }]
    : await db.select({ id: children.id }).from(children)

  for (const child of targets) {
    // Hitung saldo saat ini
    const result = await db
      .select({ total: sum(ticketTransactions.amount) })
      .from(ticketTransactions)
      .where(eq(ticketTransactions.childId, child.id))

    const balance = Number(result[0]?.total ?? 0)
    if (balance === 0) continue

    // Insert transaksi negatif untuk nolkan saldo
    await db.insert(ticketTransactions).values({
      childId: child.id,
      type: 'redeemed',
      amount: -balance,
      reason: 'Reset saldo tiket',
    })

    emitEvent('reward_redeemed', { childId: child.id, totalTickets: 0 })
  }

  return NextResponse.json({ ok: true })
}
