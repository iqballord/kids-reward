import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rewards, children, ticketTransactions } from '@/lib/db/schema'
import { eq, sum } from 'drizzle-orm'

export async function GET() {
  const allChildren = await db.select().from(children).orderBy(children.createdAt)
  const allRewards = await db.select().from(rewards).where(eq(rewards.isActive, true)).orderBy(rewards.createdAt)

  const ticketBalances = await Promise.all(
    allChildren.map(async (child) => {
      const result = await db
        .select({ total: sum(ticketTransactions.amount) })
        .from(ticketTransactions)
        .where(eq(ticketTransactions.childId, child.id))
      return { childId: child.id, balance: Number(result[0]?.total ?? 0) }
    })
  )

  return NextResponse.json({
    rewards: allRewards,
    children: allChildren,
    ticketBalances,
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { child_id, name, icon, ticket_cost } = body as {
    child_id: string | null
    name: string
    icon?: string
    ticket_cost: number
  }

  if (!name || !ticket_cost || ticket_cost < 1) {
    return NextResponse.json({ error: 'name and ticket_cost required' }, { status: 400 })
  }

  const [reward] = await db
    .insert(rewards)
    .values({ childId: child_id ?? null, name, icon: icon ?? '🎁', ticketCost: ticket_cost })
    .returning()

  return NextResponse.json(reward)
}
