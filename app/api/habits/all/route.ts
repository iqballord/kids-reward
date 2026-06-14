import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { habits, children } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { requireFamilyContext } from '@/lib/family'

export async function GET() {
  const { familyId } = await requireFamilyContext()
  const familyChildren = await db.select({ id: children.id }).from(children).where(eq(children.familyId, familyId))
  const childIds = familyChildren.map(c => c.id)
  if (childIds.length === 0) return NextResponse.json([])
  const all = await db.select().from(habits).where(inArray(habits.childId, childIds)).orderBy(habits.sortOrder)
  return NextResponse.json(all)
}
