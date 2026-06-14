import type { MealJournalData } from '@/components/parent/MealLogForm'

export type MealJournal = MealJournalData & { createdAt: string }

const NEGATIVE_BEHAVIORS = ['fussy', 'running', 'gagging', 'vomiting', 'spitting', 'negotiating']

export type WeekStats = {
  total: number
  goodPortion: number
  goodPortionPct: number
  negativeSessions: number
  negativeSessionsPct: number
  avgDuration: number | null
  topEatenWith: string | null
  topLocation: string | null
}

export type ReportData = {
  child: { id: string; name: string; age: number }
  from: string
  to: string
  journals: MealJournal[]
  overall: WeekStats
  half1: WeekStats
  half2: WeekStats
  hasTrend: boolean
  topEatenWith: { key: string; goodPct: number; total: number }[]
  behaviorFrequency: { behavior: string; count: number }[]
  mealTypeBreakdown: { type: string; goodPct: number; total: number }[]
}

function calcStats(journals: MealJournal[]): WeekStats {
  const total = journals.length
  if (total === 0) {
    return { total: 0, goodPortion: 0, goodPortionPct: 0, negativeSessions: 0, negativeSessionsPct: 0, avgDuration: null, topEatenWith: null, topLocation: null }
  }

  const goodPortion = journals.filter(j => j.portion === 'half' || j.portion === 'all').length
  const negativeSessions = journals.filter(j =>
    j.behaviorEnd.some(b => NEGATIVE_BEHAVIORS.includes(b))
  ).length

  const withDuration = journals.filter(j => j.durationMinutes)
  const avgDuration = withDuration.length > 0
    ? Math.round(withDuration.reduce((s, j) => s + j.durationMinutes!, 0) / withDuration.length)
    : null

  const eatenWithCount: Record<string, number> = {}
  for (const j of journals) {
    const key = j.eatenWith === 'other' && j.eatenWithOther ? j.eatenWithOther : j.eatenWith
    eatenWithCount[key] = (eatenWithCount[key] ?? 0) + 1
  }
  const topEatenWith = Object.entries(eatenWithCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  const locationCount: Record<string, number> = {}
  for (const j of journals) {
    const key = j.location === 'other' && j.locationOther ? j.locationOther : j.location
    locationCount[key] = (locationCount[key] ?? 0) + 1
  }
  const topLocation = Object.entries(locationCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  return {
    total,
    goodPortion,
    goodPortionPct: Math.round((goodPortion / total) * 100),
    negativeSessions,
    negativeSessionsPct: Math.round((negativeSessions / total) * 100),
    avgDuration,
    topEatenWith,
    topLocation,
  }
}

export function buildReport(
  child: { id: string; name: string; age: number },
  journals: MealJournal[],
  from: string,
  to: string
): ReportData {
  const sorted = [...journals].sort((a, b) => a.date.localeCompare(b.date))

  // Split tengah untuk trend
  const fromDate = new Date(from + 'T00:00:00')
  const toDate = new Date(to + 'T00:00:00')
  const midDate = new Date((fromDate.getTime() + toDate.getTime()) / 2)
  const midStr = midDate.toISOString().slice(0, 10)

  const half1 = sorted.filter(j => j.date <= midStr)
  const half2 = sorted.filter(j => j.date > midStr)

  // Perlu minimal 2 minggu data (14 hari spread)
  const firstDate = sorted[0]?.date
  const lastDate = sorted[sorted.length - 1]?.date
  const daySpread = firstDate && lastDate
    ? (new Date(lastDate).getTime() - new Date(firstDate).getTime()) / (1000 * 60 * 60 * 24)
    : 0
  const hasTrend = daySpread >= 13 && half1.length > 0 && half2.length > 0

  // Top eaten with + good portion rate per caregiver
  const eatenWithMap: Record<string, MealJournal[]> = {}
  for (const j of sorted) {
    const key = j.eatenWith === 'other' && j.eatenWithOther ? j.eatenWithOther : j.eatenWith
    if (!eatenWithMap[key]) eatenWithMap[key] = []
    eatenWithMap[key].push(j)
  }
  const topEatenWith = Object.entries(eatenWithMap)
    .map(([key, jList]) => ({
      key,
      total: jList.length,
      goodPct: Math.round((jList.filter(j => j.portion === 'half' || j.portion === 'all').length / jList.length) * 100),
    }))
    .sort((a, b) => b.goodPct - a.goodPct)

  // Behavior frequency (gabungan start + end)
  const behaviorCount: Record<string, number> = {}
  for (const j of sorted) {
    for (const b of [...j.behaviorStart, ...j.behaviorEnd]) {
      behaviorCount[b] = (behaviorCount[b] ?? 0) + 1
    }
  }
  const behaviorFrequency = Object.entries(behaviorCount)
    .map(([behavior, count]) => ({ behavior, count }))
    .sort((a, b) => b.count - a.count)

  // Meal type breakdown
  const mealTypeMap: Record<string, MealJournal[]> = {}
  for (const j of sorted) {
    if (!mealTypeMap[j.mealType]) mealTypeMap[j.mealType] = []
    mealTypeMap[j.mealType].push(j)
  }
  const mealTypeBreakdown = Object.entries(mealTypeMap)
    .map(([type, jList]) => ({
      type,
      total: jList.length,
      goodPct: Math.round((jList.filter(j => j.portion === 'half' || j.portion === 'all').length / jList.length) * 100),
    }))
    .sort((a, b) => b.total - a.total)

  return {
    child,
    from,
    to,
    journals: sorted,
    overall: calcStats(sorted),
    half1: calcStats(half1),
    half2: calcStats(half2),
    hasTrend,
    topEatenWith,
    behaviorFrequency,
    mealTypeBreakdown,
  }
}

export function trendArrow(v1: number, v2: number, higherIsBetter = true): '↑' | '↓' | '→' {
  const diff = v2 - v1
  if (Math.abs(diff) < 5) return '→'
  if (higherIsBetter) return diff > 0 ? '↑' : '↓'
  return diff > 0 ? '↓' : '↑'
}

export function trendColor(arrow: '↑' | '↓' | '→'): string {
  if (arrow === '↑') return 'text-green-600'
  if (arrow === '↓') return 'text-red-500'
  return 'text-gray-400'
}
