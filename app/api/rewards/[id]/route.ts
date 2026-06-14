import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rewards, children } from '@/lib/db/schema'
import { eq, and, or, isNull, inArray } from 'drizzle-orm'
import { requireFamilyContext } from '@/lib/family'

async function verifyRewardOwnership(rewardId: string, familyId: string) {
  const [reward] = await db.select().from(rewards).where(eq(rewards.id, rewardId))
  if (!reward) return null
  // Reward milik keluarga ini jika childId null (semua) atau childId milik family ini
  if (!reward.childId) return reward
  const [child] = await db.select({ id: children.id }).from(children).where(
    and(eq(children.id, reward.childId), eq(children.familyId, familyId))
  )
  return child ? reward : null
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { familyId } = await requireFamilyContext()
  const { id } = await params

  if (!await verifyRewardOwnership(id, familyId)) {
    return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
  }

  const body = await request.json()
  const { name, ticket_cost, is_active } = body as {
    name?: string; ticket_cost?: number; is_active?: boolean
  }

  const updates: Partial<{ name: string; ticketCost: number; isActive: boolean }> = {}
  if (name !== undefined) updates.name = name
  if (ticket_cost !== undefined) updates.ticketCost = ticket_cost
  if (is_active !== undefined) updates.isActive = is_active

  const [updated] = await db.update(rewards).set(updates).where(eq(rewards.id, id)).returning()
  if (!updated) return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { familyId } = await requireFamilyContext()
  const { id } = await params

  if (!await verifyRewardOwnership(id, familyId)) {
    return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
  }

  await db.update(rewards).set({ isActive: false }).where(eq(rewards.id, id))
  return NextResponse.json({ ok: true })
}
