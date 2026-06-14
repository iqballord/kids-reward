'use client'

import { useEffect, useState, useCallback } from 'react'
import { MealLogForm, type MealJournalData } from '@/components/parent/MealLogForm'
import type { Child } from '@/lib/types'

type MealJournal = MealJournalData & { createdAt: string }

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

const PRE_MEAL_LABEL: Record<string, string> = {
  normal: 'Normal',
  after_nap: 'Habis tidur',
  after_play: 'Habis main',
  after_school: 'Habis sekolah',
  sick: 'Sedang sakit',
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

function DetailSheet({
  journal,
  childName,
  onEdit,
  onDelete,
  onClose,
}: {
  journal: MealJournal
  childName: string
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={onClose}>
      <div
        className="bg-white w-full rounded-t-3xl max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white rounded-t-3xl pt-4 px-6 pb-3 border-b border-gray-100">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-gray-900">
                {MEAL_TYPE_LABEL[journal.mealType] ?? journal.mealType}
              </p>
              <p className="text-sm text-gray-400">{childName} · {formatDate(journal.date)}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onEdit}
                className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-sm font-semibold"
              >
                Edit
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="px-3 py-1.5 rounded-xl bg-red-50 text-red-500 text-sm font-semibold"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Waktu & durasi */}
          <div className="flex gap-6">
            {journal.startTime && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Mulai jam</p>
                <p className="text-base font-semibold text-gray-800">{journal.startTime.slice(0, 5)}</p>
              </div>
            )}
            {journal.durationMinutes && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Durasi</p>
                <p className="text-base font-semibold text-gray-800">~{journal.durationMinutes} menit</p>
              </div>
            )}
          </div>

          {/* Porsi */}
          <div>
            <p className="text-xs text-gray-400 mb-1">Porsi</p>
            <p className="text-base font-semibold text-gray-800">
              {PORTION_LABEL[journal.portion] ?? journal.portion}
            </p>
          </div>

          {/* Sama siapa & lokasi */}
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-gray-400 mb-1">Sama siapa</p>
              <p className="text-sm font-semibold text-gray-800">
                {EATEN_WITH_LABEL[journal.eatenWith] ?? journal.eatenWith}
                {journal.eatenWithOther ? ` — ${journal.eatenWithOther}` : ''}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Lokasi</p>
              <p className="text-sm font-semibold text-gray-800">
                {LOCATION_LABEL[journal.location] ?? journal.location}
                {journal.locationOther ? ` — ${journal.locationOther}` : ''}
              </p>
            </div>
          </div>

          {/* Behavior */}
          {(journal.behaviorStart.length > 0 || journal.behaviorEnd.length > 0) && (
            <div className="space-y-3">
              {journal.behaviorStart.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-1.5">Awal makan</p>
                  <div className="flex flex-wrap gap-1.5">
                    {journal.behaviorStart.map(b => (
                      <span key={b} className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium">
                        {BEHAVIOR_LABEL[b] ?? b}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {journal.behaviorEnd.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-1.5">Akhir makan</p>
                  <div className="flex flex-wrap gap-1.5">
                    {journal.behaviorEnd.map(b => (
                      <span key={b} className="text-xs bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full font-medium">
                        {BEHAVIOR_LABEL[b] ?? b}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Makanan */}
          {journal.foodOffered && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Makanan</p>
              <p className="text-sm text-gray-800">{journal.foodOffered}</p>
              {journal.foodRejected && (
                <p className="text-xs text-red-400 mt-0.5">Ada makanan yang ditolak</p>
              )}
            </div>
          )}

          {/* Konteks sebelum makan */}
          {journal.preMealContext && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Kondisi sebelum makan</p>
              <p className="text-sm text-gray-800">{PRE_MEAL_LABEL[journal.preMealContext] ?? journal.preMealContext}</p>
            </div>
          )}

          {/* Catatan */}
          {journal.notes && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Catatan</p>
              <p className="text-sm text-gray-600 italic">"{journal.notes}"</p>
            </div>
          )}
        </div>

        {/* Confirm delete */}
        {confirmDelete && (
          <div className="mx-6 mb-6 p-4 bg-red-50 rounded-2xl">
            <p className="text-sm font-semibold text-red-700 mb-3">Hapus log makan ini?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-500 text-sm font-semibold"
              >
                Batal
              </button>
              <button
                onClick={onDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold"
              >
                Hapus
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MealPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [activeChildId, setActiveChildId] = useState<string>('')
  const [journals, setJournals] = useState<MealJournal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedJournal, setSelectedJournal] = useState<MealJournal | null>(null)
  const [editingJournal, setEditingJournal] = useState<MealJournal | null>(null)

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

  async function handleDelete(id: string) {
    await fetch(`/api/meal-journal/${id}`, { method: 'DELETE' })
    setSelectedJournal(null)
    fetchJournals(activeChildId)
  }

  function handleDone() {
    setShowForm(false)
    setEditingJournal(null)
    setSelectedJournal(null)
    fetchJournals(activeChildId)
  }

  function handleEdit(journal: MealJournal) {
    setSelectedJournal(null)
    setEditingJournal(journal)
  }

  const grouped = groupByDate(journals)
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  const childMap = Object.fromEntries(children.map(c => [c.id, c.name]))

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
                  <button
                    key={journal.id}
                    onClick={() => setSelectedJournal(journal)}
                    className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 active:scale-[0.99] transition-transform"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold text-gray-800">
                        {MEAL_TYPE_LABEL[journal.mealType] ?? journal.mealType}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        {journal.startTime && <span>{journal.startTime.slice(0, 5)}</span>}
                        <span className="text-gray-200">›</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                      <span>{PORTION_LABEL[journal.portion] ?? journal.portion}</span>
                      <span>·</span>
                      <span>{EATEN_WITH_LABEL[journal.eatenWith] ?? journal.eatenWith}{journal.eatenWithOther ? ` (${journal.eatenWithOther})` : ''}</span>
                      <span>·</span>
                      <span>{LOCATION_LABEL[journal.location] ?? journal.location}{journal.locationOther ? ` (${journal.locationOther})` : ''}</span>
                    </div>

                    {(journal.behaviorStart.length > 0 || journal.behaviorEnd.length > 0) && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {journal.behaviorStart.map(b => (
                          <span key={`s-${b}`} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                            {BEHAVIOR_LABEL[b] ?? b}
                          </span>
                        ))}
                        {journal.behaviorEnd.filter(b => !journal.behaviorStart.includes(b)).map(b => (
                          <span key={`e-${b}`} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
                            {BEHAVIOR_LABEL[b] ?? b}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail sheet */}
      {selectedJournal && (
        <DetailSheet
          journal={selectedJournal}
          childName={childMap[selectedJournal.childId] ?? ''}
          onEdit={() => handleEdit(selectedJournal)}
          onDelete={() => handleDelete(selectedJournal.id)}
          onClose={() => setSelectedJournal(null)}
        />
      )}

      {/* Form create */}
      {showForm && (
        <MealLogForm children={children} onDone={handleDone} />
      )}

      {/* Form edit */}
      {editingJournal && (
        <MealLogForm
          children={children}
          initialData={editingJournal}
          onDone={handleDone}
        />
      )}
    </div>
  )
}
