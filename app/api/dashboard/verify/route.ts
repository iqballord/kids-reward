import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { families } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

  const [family] = await db
    .select({ id: families.id })
    .from(families)
    .where(eq(families.slug, slug.toLowerCase()))

  if (!family) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
