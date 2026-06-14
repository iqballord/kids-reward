import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { familyMembers, families } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export type FamilyContext = {
  familyId: string
  familySlug: string
  role: string
}

export async function getFamilyContext(): Promise<FamilyContext | null> {
  const { userId } = await auth()
  if (!userId) return null

  const [member] = await db
    .select({
      familyId: familyMembers.familyId,
      familySlug: families.slug,
      role: familyMembers.role,
    })
    .from(familyMembers)
    .innerJoin(families, eq(familyMembers.familyId, families.id))
    .where(eq(familyMembers.clerkUserId, userId))
    .limit(1)

  return member ?? null
}

export async function requireFamilyContext(): Promise<FamilyContext> {
  const ctx = await getFamilyContext()
  if (!ctx) throw new Error('FAMILY_REQUIRED')
  return ctx
}

/**
 * Wrapper untuk API route handlers — tangkap FAMILY_REQUIRED dan return 401/403.
 */
export function withFamily<T extends unknown[]>(
  handler: (ctx: FamilyContext, ...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      const ctx = await requireFamilyContext()
      return await handler(ctx, ...args)
    } catch (e) {
      if (e instanceof Error && e.message === 'FAMILY_REQUIRED') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      throw e
    }
  }
}
