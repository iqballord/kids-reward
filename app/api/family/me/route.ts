import { NextResponse } from 'next/server'
import { getFamilyContext } from '@/lib/family'

export async function GET() {
  const ctx = await getFamilyContext()
  if (!ctx) return NextResponse.json({ familyId: null })
  return NextResponse.json({ familyId: ctx.familyId, familySlug: ctx.familySlug })
}
