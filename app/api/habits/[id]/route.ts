import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { habits } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { name, icon, schedule, tickets_value, is_active, is_meal } = body as {
    name?: string
    icon?: string
    schedule?: string
    tickets_value?: number
    is_active?: boolean
    is_meal?: boolean
  }

  const updates: Record<string, unknown> = {}
  if (name !== undefined) updates.name = name.trim()
  if (icon !== undefined) updates.icon = icon
  if (schedule !== undefined) updates.schedule = schedule
  if (tickets_value !== undefined) updates.ticketsValue = tickets_value
  if (is_active !== undefined) updates.isActive = is_active
  if (is_meal !== undefined) updates.isMeal = is_meal

  const [updated] = await db
    .update(habits)
    .set(updates)
    .where(eq(habits.id, id))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await db.update(habits).set({ isActive: false }).where(eq(habits.id, id))
  return NextResponse.json({ ok: true })
}
