import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rewards, children, ticketTransactions } from '@/lib/db/schema'
import { eq, sum, inArray, or, isNull } from 'drizzle-orm'
import { requireFamilyContext } from '@/lib/family'

export async function GET() {
  const { familyId } = await requireFamilyContext()

  const allChildren = await db.select().from(children).where(eq(children.familyId, familyId)).orderBy(children.createdAt)
  const childIds = allChildren.map(c => c.id)

  const allRewards = childIds.length > 0
    ? await db.select().from(rewards).where(
        eq(rewards.isActive, true)
      ).orderBy(rewards.createdAt)
    : []

  // Filter rewards milik keluarga ini (childId null = semua, atau childId dalam keluarga)
  const familyRewards = allRewards.filter(r => !r.childId || childIds.includes(r.childId))

  const ticketBalances = await Promise.all(
    allChildren.map(async (child) => {
      const result = await db
        .select({ total: sum(ticketTransactions.amount) })
        .from(ticketTransactions)
        .where(eq(ticketTransactions.childId, child.id))
      return { childId: child.id, balance: Number(result[0]?.total ?? 0) }
    })
  )

  return NextResponse.json({ rewards: familyRewards, children: allChildren, ticketBalances })
}

export async function POST(request: NextRequest) {
  const { familyId } = await requireFamilyContext()
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

  // Validasi child_id milik keluarga ini
  if (child_id) {
    const [child] = await db.select({ id: children.id }).from(children).where(
      eq(children.id, child_id)
    )
    if (!child) return NextResponse.json({ error: 'Child not found' }, { status: 404 })
  }

  const [reward] = await db
    .insert(rewards)
    .values({ childId: child_id ?? null, name, icon: icon ?? '🎁', ticketCost: ticket_cost })
    .returning()

  return NextResponse.json(reward)
}
