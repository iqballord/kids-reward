import type { MealJournal } from '@/lib/report'

const PORTIONS = ['none', 'little', 'half', 'all'] as const
const BEHAVIORS_NEGATIVE = ['fussy', 'running', 'gagging', 'spitting', 'negotiating']
const BEHAVIORS_POSITIVE = ['focused', 'distracted']

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function weightedPortion(eatenWith: string): typeof PORTIONS[number] {
  // Sama nenek → cenderung lebih banyak makan
  const r = Math.random()
  if (eatenWith === 'grandparents') {
    if (r < 0.05) return 'none'
    if (r < 0.15) return 'little'
    if (r < 0.45) return 'half'
    return 'all'
  }
  // Sama orang tua → lebih sering sedikit
  if (r < 0.15) return 'none'
  if (r < 0.40) return 'little'
  if (r < 0.70) return 'half'
  return 'all'
}

function weightedBehaviorEnd(portion: string, eatenWith: string): string[] {
  const behaviors: string[] = []
  const bad = portion === 'none' || portion === 'little'
  const withGrandma = eatenWith === 'grandparents'

  if (!bad && !withGrandma && Math.random() < 0.4) behaviors.push('focused')
  if (bad && Math.random() < 0.5) behaviors.push(randomFrom(BEHAVIORS_NEGATIVE))
  if (bad && Math.random() < 0.3) behaviors.push('running')
  if (!bad && withGrandma && Math.random() < 0.5) behaviors.push('focused')
  if (Math.random() < 0.2) behaviors.push('distracted')

  return [...new Set(behaviors)]
}

function behaviorStart(eatenWith: string): string[] {
  // Awal makan biasanya lebih tenang
  if (Math.random() < 0.6) return ['focused']
  if (Math.random() < 0.3) return ['distracted']
  return []
}

export function generateDummyJournals(childId: string, year: number, month: number): MealJournal[] {
  const journals: MealJournal[] = []
  const daysInMonth = new Date(year, month, 0).getDate()
  let id = 1

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    // Tentukan siapa yang jaga hari ini
    const dayOfWeek = new Date(dateStr).getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    // Tiap Minggu + 2 hari acak di minggu → sama nenek
    const withGrandma = isWeekend && Math.random() < 0.6

    const mealSessions: { type: string; hour: number }[] = [
      { type: 'breakfast', hour: 7 },
      { type: 'lunch', hour: 12 },
      { type: 'dinner', hour: 18 },
    ]

    // Snack 4-5x seminggu
    if (Math.random() < 0.65) {
      mealSessions.push({ type: 'snack', hour: 15 })
    }

    for (const { type, hour } of mealSessions) {
      // Skip beberapa sesi secara acak (orang tua lupa catat)
      if (Math.random() < 0.12) continue

      const eatenWith = withGrandma && type !== 'breakfast'
        ? 'grandparents'
        : Math.random() < 0.85 ? 'parents' : 'caregiver'

      const location = eatenWith === 'grandparents'
        ? 'grandparents_home'
        : Math.random() < 0.9 ? 'home' : 'restaurant'

      const portion = weightedPortion(eatenWith)
      const bStart = behaviorStart(eatenWith)
      const bEnd = weightedBehaviorEnd(portion, eatenWith)

      const minute = Math.floor(Math.random() * 30)
      const startTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

      // Durasi: kalau susah makan, lebih lama
      const baseDuration = type === 'snack' ? 10 : 25
      const durationModifier = portion === 'none' ? 20 : portion === 'little' ? 10 : 0
      const durationMinutes = baseDuration + durationModifier + Math.floor(Math.random() * 10)

      // Makanan
      const foods: Record<string, string[]> = {
        breakfast: ['Nasi + telur dadar', 'Bubur ayam', 'Roti + selai', 'Nasi goreng', 'Oatmeal + pisang'],
        lunch: ['Nasi + ayam + sayur', 'Nasi + ikan + brokoli', 'Mie ayam', 'Nasi + tempe + bayam', 'Nasi + sop'],
        dinner: ['Nasi + ayam + wortel', 'Nasi + ikan + tahu', 'Nasi + daging + buncis', 'Bubur + ayam suwir'],
        snack: ['Biskuit', 'Buah potong', 'Yogurt', 'Roti', 'Puding'],
      }
      const foodOffered = randomFrom(foods[type] ?? foods.lunch)
      const foodRejected = (portion === 'none' || portion === 'little') && Math.random() < 0.5

      const preMealContextOptions = ['normal', 'after_play', 'after_nap', 'after_school']
      const preMealContext = Math.random() < 0.4 ? randomFrom(preMealContextOptions) : null

      const notesPool = [
        'Minta main dulu sebelum mau duduk',
        'Semangat banget makannya hari ini',
        'Nangis minta jajan',
        'Mau makan sendiri pakai sendok',
        'Bilang perut sakit tapi langsung baik setelah makan',
        'Minta disuapi terus',
        null, null, null, null, // lebih sering null
      ]
      const notes = Math.random() < 0.2 ? randomFrom(notesPool) : null

      journals.push({
        id: String(id++),
        childId,
        date: dateStr,
        mealType: type,
        startTime,
        portion,
        behaviorStart: bStart,
        behaviorEnd: bEnd,
        eatenWith,
        eatenWithOther: null,
        location,
        locationOther: null,
        foodOffered,
        foodRejected,
        durationMinutes,
        preMealContext,
        notes,
        createdAt: `${dateStr}T${startTime}:00+07:00`,
      })
    }
  }

  return journals
}
