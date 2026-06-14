import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { children, ticketTransactions } from '@/lib/db/schema'
import { eq, sum, and } from 'drizzle-orm'
import { pusherServer, familyChannel } from '@/lib/pusher'
import { requireFamilyContext } from '@/lib/family'

export async function POST(request: NextRequest) {
  const { familyId } = await requireFamilyContext()
  const body = await request.json().catch(() => ({}))
  const { child_id } = body as { child_id?: string }

  const targets = child_id
    ? await db.select({ id: children.id }).from(children).where(and(eq(children.id, child_id), eq(children.familyId, familyId)))
    : await db.select({ id: children.id }).from(children).where(eq(children.familyId, familyId))

  for (const child of targets) {
    const result = await db.select({ total: sum(ticketTransactions.amount) }).from(ticketTransactions).where(eq(ticketTransactions.childId, child.id))
    const balance = Number(result[0]?.total ?? 0)
    if (balance === 0) continue
    await db.insert(ticketTransactions).values({ childId: child.id, type: 'redeemed', amount: -balance, reason: 'Reset saldo tiket' })
    await pusherServer.trigger(familyChannel(familyId), 'reward_redeemed', { childId: child.id, totalTickets: 0 })
  }

  return NextResponse.json({ ok: true })
}
