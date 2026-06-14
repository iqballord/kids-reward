import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { mealJournals, habitLogs, habits, children } from '@/lib/db/schema'
import { eq, and, gte, lte, desc } from 'drizzle-orm'
import { requireFamilyContext } from '@/lib/family'

const MEAL_TYPE: Record<string, string> = {
  breakfast: 'Sarapan',
  lunch: 'Makan siang',
  dinner: 'Makan malam',
  snack: 'Snack',
}
const PORTION: Record<string, string> = {
  none: 'Tidak mau',
  little: 'Sedikit',
  half: 'Setengah',
  all: 'Habis',
}
const EATEN_WITH: Record<string, string> = {
  parents: 'Orang tua',
  grandparents: 'Nenek/Kakek',
  caregiver: 'Pengasuh',
  school: 'Di sekolah',
  other: 'Lain-lain',
}
const LOCATION: Record<string, string> = {
  home: 'Rumah',
  grandparents_home: 'Rumah nenek',
  school: 'Sekolah',
  restaurant: 'Restoran',
  other: 'Lain-lain',
}
const BEHAVIOR: Record<string, string> = {
  focused: 'Fokus',
  distracted: 'Distraksi',
  fussy: 'Rewel',
  spitting: 'Meludah',
  gagging: 'Gag',
  vomiting: 'Muntah',
  running: 'Lari-lari',
  negotiating: 'Negosiasi',
}
const SCHEDULE: Record<string, string> = {
  morning: 'Pagi',
  afternoon: 'Siang/Sore',
  evening: 'Malam',
}
const PRE_MEAL: Record<string, string> = {
  normal: 'Normal',
  after_nap: 'Habis tidur',
  after_play: 'Habis main',
  after_school: 'Habis sekolah',
  sick: 'Sedang sakit',
}

function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return ''
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function rowsToCsv(headers: string[], rows: string[][]): string {
  const lines = [headers.map(escapeCsv).join(',')]
  for (const row of rows) lines.push(row.map(escapeCsv).join(','))
  return lines.join('\r\n')
}

export async function GET(request: NextRequest) {
  const { familyId } = await requireFamilyContext()
  const { searchParams } = new URL(request.url)
  const childId = searchParams.get('child_id')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const type = searchParams.get('type') ?? 'meal'

  if (!childId) {
    return NextResponse.json({ error: 'child_id is required' }, { status: 400 })
  }

  const [child] = await db.select().from(children).where(
    and(eq(children.id, childId), eq(children.familyId, familyId))
  )
  if (!child) return NextResponse.json({ error: 'Child not found' }, { status: 404 })

  let csv = ''
  let filename = ''

  if (type === 'meal') {
    const conditions = [eq(mealJournals.childId, childId)]
    if (from) conditions.push(gte(mealJournals.date, from))
    if (to) conditions.push(lte(mealJournals.date, to))

    const rows = await db
      .select()
      .from(mealJournals)
      .where(and(...conditions))
      .orderBy(desc(mealJournals.date))

    const headers = [
      'Tanggal', 'Nama Anak', 'Jenis Makan', 'Jam Mulai', 'Durasi (menit)',
      'Porsi', 'Behavior Awal', 'Behavior Akhir',
      'Makan Sama', 'Keterangan Sama', 'Lokasi', 'Keterangan Lokasi',
      'Makanan', 'Ada Makanan Ditolak', 'Kondisi Sebelum Makan', 'Catatan',
    ]

    const dataRows = rows.map(j => [
      j.date,
      child.name,
      MEAL_TYPE[j.mealType] ?? j.mealType,
      j.startTime ?? '',
      j.durationMinutes?.toString() ?? '',
      PORTION[j.portion] ?? j.portion,
      j.behaviorStart.map(b => BEHAVIOR[b] ?? b).join('; '),
      j.behaviorEnd.map(b => BEHAVIOR[b] ?? b).join('; '),
      EATEN_WITH[j.eatenWith] ?? j.eatenWith,
      j.eatenWithOther ?? '',
      LOCATION[j.location] ?? j.location,
      j.locationOther ?? '',
      j.foodOffered ?? '',
      j.foodRejected ? 'Ya' : 'Tidak',
      j.preMealContext ? (PRE_MEAL[j.preMealContext] ?? j.preMealContext) : '',
      j.notes ?? '',
    ])

    csv = rowsToCsv(headers, dataRows)
    filename = `meal-journal-${child.name.toLowerCase()}-${from ?? 'all'}-${to ?? 'all'}.csv`

  } else {
    // Habit history
    const conditions = [eq(habitLogs.childId, childId)]
    if (from) conditions.push(gte(habitLogs.date, from))
    if (to) conditions.push(lte(habitLogs.date, to))

    const rows = await db
      .select({
        date: habitLogs.date,
        completedAt: habitLogs.completedAt,
        ticketsEarned: habitLogs.ticketsEarned,
        habitName: habits.name,
        habitIcon: habits.icon,
        habitSchedule: habits.schedule,
      })
      .from(habitLogs)
      .innerJoin(habits, eq(habitLogs.habitId, habits.id))
      .where(and(...conditions))
      .orderBy(desc(habitLogs.date))

    const headers = [
      'Tanggal', 'Nama Anak', 'Habit', 'Waktu', 'Selesai Jam', 'Tiket Didapat',
    ]

    const dataRows = rows.map(r => [
      r.date,
      child.name,
      `${r.habitIcon} ${r.habitName}`,
      SCHEDULE[r.habitSchedule] ?? r.habitSchedule,
      r.completedAt
        ? new Date(r.completedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
        : '',
      r.ticketsEarned.toString(),
    ])

    csv = rowsToCsv(headers, dataRows)
    filename = `habit-history-${child.name.toLowerCase()}-${from ?? 'all'}-${to ?? 'all'}.csv`
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
