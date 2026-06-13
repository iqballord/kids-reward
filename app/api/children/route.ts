import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { children } from '@/lib/db/schema'
import { asc } from 'drizzle-orm'

export async function GET() {
  const result = await db.select().from(children).orderBy(asc(children.createdAt))
  return NextResponse.json(result)
}
