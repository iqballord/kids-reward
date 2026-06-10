import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rewards, ticketTransactions } from '@/lib/db/schema'
import { eq, sum } from 'drizzle-orm'
import { emitEvent } from '@/lib/sse'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { child_id } = await request.json() as { child_id: string }

  if (!child_id) {
    return NextResponse.json({ error: 'child_id required' }, { status: 400 })
  }

  const [reward] = await db.select().from(rewards).where(eq(rewards.id, id))
  if (!reward || !reward.isActive) {
    return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
  }

  // Cek saldo tiket cukup
  const balanceResult = await db
    .select({ total: sum(ticketTransactions.amount) })
    .from(ticketTransactions)
    .where(eq(ticketTransactions.childId, child_id))

  const balance = Number(balanceResult[0]?.total ?? 0)
  if (balance < reward.ticketCost) {
    return NextResponse.json(
      { error: 'Tiket tidak cukup', balance, required: reward.ticketCost },
      { status: 422 }
    )
  }

  await db.insert(ticketTransactions).values({
    childId: child_id,
    type: 'redeemed',
    amount: -reward.ticketCost,
    reason: `Tukar reward: ${reward.name}`,
  })

  const newBalance = balance - reward.ticketCost

  emitEvent('reward_redeemed', {
    childId: child_id,
    rewardName: reward.name,
    ticketsSpent: reward.ticketCost,
    totalTickets: newBalance,
  })

  return NextResponse.json({ ok: true, newBalance, rewardName: reward.name })
}
