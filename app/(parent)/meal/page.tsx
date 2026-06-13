'use client'

import { useEffect, useState, useCallback } from 'react'
import { MealLogForm } from '@/components/parent/MealLogForm'
import type { Child } from '@/lib/types'

type MealJournal = {
  id: string
  childId: string
  date: string
  mealType: string
  startTime: string | null
  portion: string
  behaviorStart: string[]
  behaviorEnd: string[]
  eatenWith: string
  eatenWithOther: string | null
  location: string
  locationOther: string | null
  foodOffered: string | null
  foodRejected: boolean
  durationMinutes: number | null
  preMealContext: string | null
  notes: string | null
  createdAt: string
}

const MEAL_TYPE_LABEL: Record<string, string> = {
  breakfast: '🌅 Sarapan',
  lunch: '☀️ Makan siang',
  dinner: '🌙 Makan malam',
  snack: '🍪 Snack',
}

const PORTION_LABEL: Record<string, string> = {
  none: 'Tidak mau 😶',
  little: 'Sedikit 😔',
  half: 'Setengah 😐',
  all: 'Habis 😄',
}

const EATEN_WITH_LABEL: Record<string, string> = {
  parents: 'Orang tua',
  grandparents: 'Nenek/Kakek',
  caregiver: 'Pengasuh',
  school: 'Di sekolah',
  other: 'Lain-lain',
}

const LOCATION_LABEL: Record<string, string> = {
  home: 'Rumah',
  grandparents_home: 'Rmh nenek',
  school: 'Sekolah',
  restaurant: 'Restoran',
  other: 'Lain-lain',
}

const BEHAVIOR_LABEL: Record<string, string> = {
  focused: 'Fokus',
  distracted: 'Distraksi',
  fussy: 'Rewel',
  spitting: 'Meludah',
  gagging: 'Gag',
  vomiting: 'Muntah',
  running: 'Lari-lari',
  negotiating: 'Negosiasi',
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })
}

function groupByDate(journals: MealJournal[]) {
  const groups: Record<string, MealJournal[]> = {}
  for (const j of journals) {
    if (!groups[j.date]) groups[j.date] = []
    groups[j.date].push(j)
  }
  return groups
}

export default function MealPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [activeChildId, setActiveChildId] = useState<string>('')
  const [journals, setJournals] = useState<MealJournal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetch('/api/children')
      .then(r => r.json())
      .then((data: Child[]) => {
        setChildren(data)
        if (data.length > 0) setActiveChildId(data[0].id)
      })
  }, [])

  const fetchJournals = useCallback(async (childId: string) => {
    if (!childId) return
    setLoading(true)
    const res = await fetch(`/api/meal-journal?child_id=${childId}`)
    if (res.ok) setJournals(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchJournals(activeChildId)
  }, [activeChildId, fetchJournals])

  function handleDone() {
    setShowForm(false)
    fetchJournals(activeChildId)
  }

  const grouped = groupByDate(journals)
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-900">Meal Log</h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-2xl active:scale-95 transition-transform"
        >
          + Log Makan
        </button>
      </div>

      {/* Tab per anak */}
      {children.length > 1 && (
        <div className="flex gap-2 mb-5">
          {children.map(child => (
            <button
              key={child.id}
              onClick={() => setActiveChildId(child.id)}
              className={`flex-1 py-2 rounded-2xl text-sm font-semibold border-2 transition-all ${
                activeChildId === child.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-100 bg-gray-50 text-gray-500'
              }`}
            >
              {child.name}
            </button>
          ))}
        </div>
      )}

      {/* List journals */}
      {loading ? (
        <p className="text-sm text-gray-400 text-center py-8">Memuat...</p>
      ) : sortedDates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="text-gray-500 text-sm">Belum ada log makan.</p>
          <p className="text-gray-400 text-xs mt-1">Tap "+ Log Makan" untuk mulai mencatat.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {sortedDates.map(date => (
            <div key={date}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 capitalize">
                {formatDate(date)}
              </p>
              <div className="space-y-2">
                {grouped[date].map(journal => (
                  <div key={journal.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-gray-800">
                        {MEAL_TYPE_LABEL[journal.mealType] ?? journal.mealType}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        {journal.startTime && <span>{journal.startTime.slice(0, 5)}</span>}
                        {journal.durationMinutes && <span>~{journal.durationMinutes} mnt</span>}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-2">
                      <span>{PORTION_LABEL[journal.portion] ?? journal.portion}</span>
                      <span>{EATEN_WITH_LABEL[journal.eatenWith] ?? journal.eatenWith}{journal.eatenWithOther ? ` (${journal.eatenWithOther})` : ''}</span>
                      <span>{LOCATION_LABEL[journal.location] ?? journal.location}{journal.locationOther ? ` (${journal.locationOther})` : ''}</span>
                    </div>

                    {(journal.behaviorStart.length > 0 || journal.behaviorEnd.length > 0) && (
                      <div className="space-y-1">
                        {journal.behaviorStart.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs text-gray-400 mr-1">Awal:</span>
                            {journal.behaviorStart.map(b => (
                              <span key={b} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                                {BEHAVIOR_LABEL[b] ?? b}
                              </span>
                            ))}
                          </div>
                        )}
                        {journal.behaviorEnd.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs text-gray-400 mr-1">Akhir:</span>
                            {journal.behaviorEnd.map(b => (
                              <span key={b} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
                                {BEHAVIOR_LABEL[b] ?? b}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {journal.foodOffered && (
                      <p className="text-xs text-gray-400 mt-1.5">
                        🍴 {journal.foodOffered}
                        {journal.foodRejected && <span className="text-red-400 ml-1">(ada yang ditolak)</span>}
                      </p>
                    )}

                    {journal.notes && (
                      <p className="text-xs text-gray-400 mt-1 italic">"{journal.notes}"</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <MealLogForm children={children} onDone={handleDone} />
      )}
    </div>
  )
}
