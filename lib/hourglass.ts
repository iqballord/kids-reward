import type { InferSelectModel } from 'drizzle-orm'
import type { hourglassSessions } from './db/schema'

type Session = InferSelectModel<typeof hourglassSessions>

export interface HourglassState {
  sessionId: string
  childId: string
  durationS: number
  elapsedS: number       // detik yang sudah terpakai (tidak termasuk waktu pause)
  remainingS: number     // detik tersisa
  isPaused: boolean
  isFinished: boolean
  progressPct: number    // 0–100
}

export function computeState(session: Session): HourglassState {
  const now = Date.now()
  const startedAt = session.startedAt.getTime()
  const totalPausedMs = session.totalPausedS * 1000

  // Jika sedang di-pause, hitung elapsed sampai saat pause dimulai
  const pausedSince = session.pausedAt ? session.pausedAt.getTime() : null
  const runningMs = pausedSince
    ? pausedSince - startedAt - totalPausedMs
    : now - startedAt - totalPausedMs

  const elapsedS = Math.max(0, Math.floor(runningMs / 1000))
  const remainingS = Math.max(0, session.durationS - elapsedS)
  const isFinished = !!session.endedAt || remainingS === 0
  const progressPct = Math.min(100, (elapsedS / session.durationS) * 100)

  return {
    sessionId: session.id,
    childId: session.childId,
    durationS: session.durationS,
    elapsedS,
    remainingS,
    isPaused: !!session.pausedAt && !session.endedAt,
    isFinished,
    progressPct,
  }
}
