import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { children } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireFamilyContext } from '@/lib/family'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { familyId } = await requireFamilyContext()
  const { id } = await params
  const body = await request.json()
  const { name, date_of_birth, avatar_url } = body as {
    name?: string
    date_of_birth?: string
    avatar_url?: string
  }

  const updates: Partial<{ name: string; dateOfBirth: string; avatarUrl: string }> = {}
  if (name !== undefined) updates.name = name.trim()
  if (date_of_birth !== undefined) updates.dateOfBirth = date_of_birth
  if (avatar_url !== undefined) updates.avatarUrl = avatar_url

  const [updated] = await db
    .update(children)
    .set(updates)
    .where(and(eq(children.id, id), eq(children.familyId, familyId)))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Child not found' }, { status: 404 })
  return NextResponse.json(updated)
}
