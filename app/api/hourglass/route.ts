import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hourglassSessions, children } from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { pusherServer, familyChannel } from '@/lib/pusher'
import { computeState } from '@/lib/hourglass'
import { requireFamilyContext } from '@/lib/family'

async function verifyChildOwnership(childId: string, familyId: string) {
  const [child] = await db.select({ id: children.id }).from(children).where(
    and(eq(children.id, childId), eq(children.familyId, familyId))
  )
  return !!child
}

export async function GET(request: NextRequest) {
  const { familyId } = await requireFamilyContext()
  const childId = request.nextUrl.searchParams.get('child_id')
  if (!childId) return NextResponse.json({ session: null })
  if (!await verifyChildOwnership(childId, familyId)) return NextResponse.json({ session: null })

  const [session] = await db
    .select()
    .from(hourglassSessions)
    .where(and(eq(hourglassSessions.childId, childId), isNull(hourglassSessions.endedAt)))
    .orderBy(hourglassSessions.startedAt)
    .limit(1)

  if (!session) return NextResponse.json({ session: null })
  return NextResponse.json({ session: computeState(session) })
}

export async function POST(request: NextRequest) {
  const { familyId } = await requireFamilyContext()
  const body = await request.json()
  const { child_id, action, duration_s = 1800 } = body as {
    child_id: string
    action: 'start' | 'pause' | 'resume' | 'stop'
    duration_s?: number
  }

  if (!child_id || !action) {
    return NextResponse.json({ error: 'child_id and action required' }, { status: 400 })
  }

  if (!await verifyChildOwnership(child_id, familyId)) {
    return NextResponse.json({ error: 'Child not found' }, { status: 404 })
  }

  // Ambil sesi aktif (belum ended)
  const [active] = await db
    .select()
    .from(hourglassSessions)
    .where(and(eq(hourglassSessions.childId, child_id), isNull(hourglassSessions.endedAt)))
    .limit(1)

  if (action === 'start') {
    // Stop sesi lama jika ada
    if (active) {
      await db
        .update(hourglassSessions)
        .set({ endedAt: new Date() })
        .where(eq(hourglassSessions.id, active.id))
    }

    const [session] = await db
      .insert(hourglassSessions)
      .values({ childId: child_id, startedAt: new Date(), durationS: duration_s })
      .returning()

    await pusherServer.trigger(familyChannel(familyId), 'hourglass_started', { childId: child_id, sessionId: session.id, durationS: duration_s, startedAt: session.startedAt })
    return NextResponse.json({ session: computeState(session) })
  }

  if (!active) {
    return NextResponse.json({ error: 'No active session' }, { status: 404 })
  }

  if (action === 'pause') {
    if (active.pausedAt) return NextResponse.json({ error: 'Already paused' }, { status: 409 })
    const [updated] = await db
      .update(hourglassSessions)
      .set({ pausedAt: new Date() })
      .where(eq(hourglassSessions.id, active.id))
      .returning()

    await pusherServer.trigger(familyChannel(familyId), 'hourglass_paused', { childId: child_id, sessionId: active.id })
    return NextResponse.json({ session: computeState(updated) })
  }

  if (action === 'resume') {
    if (!active.pausedAt) return NextResponse.json({ error: 'Not paused' }, { status: 409 })
    const pausedDuration = Math.floor((Date.now() - active.pausedAt.getTime()) / 1000)
    const [updated] = await db
      .update(hourglassSessions)
      .set({
        pausedAt: null,
        totalPausedS: active.totalPausedS + pausedDuration,
      })
      .where(eq(hourglassSessions.id, active.id))
      .returning()

    await pusherServer.trigger(familyChannel(familyId), 'hourglass_resumed', { childId: child_id, sessionId: active.id })
    return NextResponse.json({ session: computeState(updated) })
  }

  if (action === 'stop') {
    const [updated] = await db
      .update(hourglassSessions)
      .set({ endedAt: new Date() })
      .where(eq(hourglassSessions.id, active.id))
      .returning()

    await pusherServer.trigger(familyChannel(familyId), 'hourglass_stopped', { childId: child_id, sessionId: active.id })
    return NextResponse.json({ session: computeState(updated) })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
