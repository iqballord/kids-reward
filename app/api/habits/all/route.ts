import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { habits } from '@/lib/db/schema'

export async function GET() {
  const all = await db.select().from(habits).orderBy(habits.sortOrder)
  return NextResponse.json(all)
}
