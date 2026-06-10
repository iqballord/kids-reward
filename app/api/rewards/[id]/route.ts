import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rewards } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { name, ticket_cost, is_active } = body as {
    name?: string
    ticket_cost?: number
    is_active?: boolean
  }

  const updates: Partial<{ name: string; ticketCost: number; isActive: boolean }> = {}
  if (name !== undefined) updates.name = name
  if (ticket_cost !== undefined) updates.ticketCost = ticket_cost
  if (is_active !== undefined) updates.isActive = is_active

  const [updated] = await db
    .update(rewards)
    .set(updates)
    .where(eq(rewards.id, id))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await db.update(rewards).set({ isActive: false }).where(eq(rewards.id, id))
  return NextResponse.json({ ok: true })
}
