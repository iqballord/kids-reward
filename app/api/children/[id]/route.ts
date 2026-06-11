import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { children } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { name, age, avatar_url } = body as { name?: string; age?: number; avatar_url?: string }

  const updates: Partial<{ name: string; age: number; avatarUrl: string }> = {}
  if (name !== undefined) updates.name = name.trim()
  if (age !== undefined) updates.age = age
  if (avatar_url !== undefined) updates.avatarUrl = avatar_url

  const [updated] = await db
    .update(children)
    .set(updates)
    .where(eq(children.id, id))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Child not found' }, { status: 404 })
  return NextResponse.json(updated)
}
