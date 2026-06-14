import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { children } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'
import { requireFamilyContext } from '@/lib/family'

export async function GET() {
  const { familyId } = await requireFamilyContext()
  const result = await db.select().from(children).where(eq(children.familyId, familyId)).orderBy(asc(children.createdAt))
  return NextResponse.json(result)
}
