import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rewards, ticketTransactions, children } from '@/lib/db/schema'
import { eq, and, sum } from 'drizzle-orm'
import { pusherServer, familyChannel } from '@/lib/pusher'
import { requireFamilyContext } from '@/lib/family'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { familyId } = await requireFamilyContext()
  const { id } = await params
  const { child_id } = await request.json() as { child_id: string }

  if (!child_id) return NextResponse.json({ error: 'child_id required' }, { status: 400 })

  // Validasi child milik family yang login
  const [child] = await db.select({ id: children.id }).from(children).where(
    and(eq(children.id, child_id), eq(children.familyId, familyId))
  )
  if (!child) return NextResponse.json({ error: 'Child not found' }, { status: 404 })

  const [reward] = await db.select().from(rewards).where(eq(rewards.id, id))
  if (!reward || !reward.isActive) {
    return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
  }

  // Validasi reward milik family ini (childId null = global, atau childId milik family)
  if (reward.childId) {
    const [rewardChild] = await db.select({ id: children.id }).from(children).where(
      and(eq(children.id, reward.childId), eq(children.familyId, familyId))
    )
    if (!rewardChild) return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
  }

  const balanceResult = await db
    .select({ total: sum(ticketTransactions.amount) })
    .from(ticketTransactions)
    .where(eq(ticketTransactions.childId, child_id))

  const balance = Number(balanceResult[0]?.total ?? 0)
  if (balance < reward.ticketCost) {
    return NextResponse.json({ error: 'Tiket tidak cukup', balance, required: reward.ticketCost }, { status: 422 })
  }

  await db.insert(ticketTransactions).values({
    childId: child_id,
    type: 'redeemed',
    amount: -reward.ticketCost,
    reason: `Tukar reward: ${reward.name}`,
  })

  const newBalance = balance - reward.ticketCost
  await pusherServer.trigger(familyChannel(familyId), 'reward_redeemed', { childId: child_id, rewardName: reward.name, ticketsSpent: reward.ticketCost, totalTickets: newBalance })
  return NextResponse.json({ ok: true, newBalance, rewardName: reward.name })
}
