'use client'

import { useState } from 'react'
import { todayWIB } from '@/lib/date'
import type { Child } from '@/lib/types'

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
type Portion = 'none' | 'little' | 'half' | 'all'
type EatenWith = 'parents' | 'grandparents' | 'caregiver' | 'school' | 'other'
type Location = 'home' | 'grandparents_home' | 'school' | 'restaurant' | 'other'
type PreMealContext = 'after_nap' | 'after_play' | 'after_school' | 'sick' | 'normal'

const BEHAVIOR_OPTIONS = [
  { value: 'focused',      label: 'Fokus' },
  { value: 'distracted',   label: 'Distraksi' },
  { value: 'fussy',        label: 'Rewel' },
  { value: 'spitting',     label: 'Meludah' },
  { value: 'gagging',      label: 'Gag' },
  { value: 'vomiting',     label: 'Muntah' },
  { value: 'running',      label: 'Lari-lari' },
  { value: 'negotiating',  label: 'Negosiasi' },
]

const MEAL_TYPES: { value: MealType; label: string; icon: string }[] = [
  { value: 'breakfast', label: 'Sarapan',     icon: '🌅' },
  { value: 'lunch',     label: 'Makan siang', icon: '☀️' },
  { value: 'dinner',    label: 'Makan malam', icon: '🌙' },
  { value: 'snack',     label: 'Snack',       icon: '🍪' },
]

const PORTION_OPTIONS: { value: Portion; label: string; emoji: string }[] = [
  { value: 'none',   label: 'Tidak mau', emoji: '😶' },
  { value: 'little', label: 'Sedikit',   emoji: '😔' },
  { value: 'half',   label: 'Setengah',  emoji: '😐' },
  { value: 'all',    label: 'Habis',     emoji: '😄' },
]

const EATEN_WITH_OPTIONS: { value: EatenWith; label: string }[] = [
  { value: 'parents',      label: 'Orang tua' },
  { value: 'grandparents', label: 'Nenek/Kakek' },
  { value: 'caregiver',    label: 'Pengasuh' },
  { value: 'school',       label: 'Di sekolah' },
  { value: 'other',        label: 'Lain-lain' },
]

const LOCATION_OPTIONS: { value: Location; label: string }[] = [
  { value: 'home',              label: 'Rumah' },
  { value: 'grandparents_home', label: 'Rmh nenek' },
  { value: 'school',            label: 'Sekolah' },
  { value: 'restaurant',        label: 'Restoran' },
  { value: 'other',             label: 'Lain-lain' },
]

const DURATION_OPTIONS = [
  { value: 10,  label: '<10 mnt' },
  { value: 20,  label: '10–20' },
  { value: 30,  label: '20–30' },
  { value: 45,  label: '30–45' },
  { value: 60,  label: '>45' },
]

const PRE_MEAL_OPTIONS: { value: PreMealContext; label: string }[] = [
  { value: 'normal',       label: 'Normal' },
  { value: 'after_nap',    label: 'Habis tidur' },
  { value: 'after_play',   label: 'Habis main' },
  { value: 'after_school', label: 'Habis sekolah' },
  { value: 'sick',         label: 'Sedang sakit' },
]

function guessMealType(): MealType {
  const h = Number(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta', hour: 'numeric', hour12: false }))
  if (h < 10) return 'breakfast'
  if (h < 15) return 'lunch'
  if (h < 18) return 'snack'
  return 'dinner'
}

function nowTime() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

export type MealJournalData = {
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
}

interface MealLogFormProps {
  children: Child[]
  initialData?: MealJournalData
  onDone: () => void
}

export function MealLogForm({ children, initialData, onDone }: MealLogFormProps) {
  const isEdit = !!initialData
  const [childId, setChildId] = useState(initialData?.childId ?? children[0]?.id ?? '')
  const [mealType, setMealType] = useState<MealType>((initialData?.mealType as MealType) ?? guessMealType())
  const [startTime, setStartTime] = useState(initialData?.startTime?.slice(0, 5) ?? nowTime())
  const [portion, setPortion] = useState<Portion | null>((initialData?.portion as Portion) ?? null)
  const [behaviorStart, setBehaviorStart] = useState<string[]>(initialData?.behaviorStart ?? [])
  const [behaviorEnd, setBehaviorEnd] = useState<string[]>(initialData?.behaviorEnd ?? [])
  const [eatenWith, setEatenWith] = useState<EatenWith | null>((initialData?.eatenWith as EatenWith) ?? null)
  const [eatenWithOther, setEatenWithOther] = useState(initialData?.eatenWithOther ?? '')
  const [location, setLocation] = useState<Location | null>((initialData?.location as Location) ?? null)
  const [locationOther, setLocationOther] = useState(initialData?.locationOther ?? '')
  const [showDetail, setShowDetail] = useState(
    !!(initialData?.foodOffered || initialData?.durationMinutes || initialData?.preMealContext || initialData?.notes)
  )
  const [foodOffered, setFoodOffered] = useState(initialData?.foodOffered ?? '')
  const [foodRejected, setFoodRejected] = useState(initialData?.foodRejected ?? false)
  const [duration, setDuration] = useState<number | null>(initialData?.durationMinutes ?? null)
  const [preMealContext, setPreMealContext] = useState<PreMealContext | null>((initialData?.preMealContext as PreMealContext) ?? null)
  const [notes, setNotes] = useState(initialData?.notes ?? '')
  const [saving, setSaving] = useState(false)

  function toggleBehavior(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter(b => b !== value) : [...list, value])
  }

  const canSave = !!portion && !!eatenWith && !!location

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    const payload = {
      child_id: childId,
      date: initialData?.date ?? todayWIB(),
      meal_type: mealType,
      start_time: startTime || null,
      portion,
      behavior_start: behaviorStart,
      behavior_end: behaviorEnd,
      eaten_with: eatenWith,
      eaten_with_other: eatenWith === 'other' ? eatenWithOther : null,
      location,
      location_other: location === 'other' ? locationOther : null,
      food_offered: foodOffered || null,
      food_rejected: foodRejected,
      duration_minutes: duration,
      pre_meal_context: preMealContext,
      notes: notes || null,
    }
    try {
      await fetch(
        isEdit ? `/api/meal-journal/${initialData.id}` : '/api/meal-journal',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={onDone}>
      <div
        className="bg-white w-full rounded-t-3xl max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white rounded-t-3xl pt-4 px-6 pb-2 border-b border-gray-100">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">{isEdit ? '✏️ Edit Log Makan' : '🍽️ Log Makan'}</h2>
        </div>

        <div className="px-6 pt-4 pb-8 space-y-6">
          {/* Pilih anak */}
          <div>
            <p className="text-sm font-semibold text-gray-600 mb-2">Untuk siapa?</p>
            <div className="flex gap-2">
              {children.map(child => (
                <button
                  key={child.id}
                  onClick={() => setChildId(child.id)}
                  className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold border-2 transition-all ${
                    childId === child.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-100 bg-gray-50 text-gray-500'
                  }`}
                >
                  {child.name}
                </button>
              ))}
            </div>
          </div>

          {/* Jenis makan */}
          <div>
            <p className="text-sm font-semibold text-gray-600 mb-2">Makan apa?</p>
            <div className="grid grid-cols-4 gap-2">
              {MEAL_TYPES.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setMealType(opt.value)}
                  className={`flex flex-col items-center py-2.5 rounded-2xl border-2 transition-all ${
                    mealType === opt.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <span className="text-xl mb-0.5">{opt.icon}</span>
                  <span className={`text-xs font-semibold ${mealType === opt.value ? 'text-blue-600' : 'text-gray-500'}`}>
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Waktu mulai */}
          <div>
            <p className="text-sm font-semibold text-gray-600 mb-2">Mulai jam</p>
            <input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-gray-800 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* Porsi */}
          <div>
            <p className="text-sm font-semibold text-gray-600 mb-2">Berapa banyak dimakan?</p>
            <div className="grid grid-cols-4 gap-2">
              {PORTION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPortion(opt.value)}
                  className={`flex flex-col items-center py-2.5 rounded-2xl border-2 transition-all ${
                    portion === opt.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <span className="text-2xl mb-0.5">{opt.emoji}</span>
                  <span className={`text-xs font-semibold ${portion === opt.value ? 'text-blue-600' : 'text-gray-500'}`}>
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Behavior awal */}
          <div>
            <p className="text-sm font-semibold text-gray-600 mb-2">Awal makan</p>
            <div className="flex flex-wrap gap-2">
              {BEHAVIOR_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => toggleBehavior(behaviorStart, setBehaviorStart, opt.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    behaviorStart.includes(opt.value)
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-gray-50 text-gray-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Behavior akhir */}
          <div>
            <p className="text-sm font-semibold text-gray-600 mb-2">Akhir makan</p>
            <div className="flex flex-wrap gap-2">
              {BEHAVIOR_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => toggleBehavior(behaviorEnd, setBehaviorEnd, opt.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    behaviorEnd.includes(opt.value)
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 bg-gray-50 text-gray-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sama siapa */}
          <div>
            <p className="text-sm font-semibold text-gray-600 mb-2">Sama siapa?</p>
            <div className="flex flex-wrap gap-2">
              {EATEN_WITH_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setEatenWith(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    eatenWith === opt.value
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 bg-gray-50 text-gray-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {eatenWith === 'other' && (
              <input
                type="text"
                value={eatenWithOther}
                onChange={e => setEatenWithOther(e.target.value)}
                placeholder="Siapa?"
                className="mt-2 w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-purple-400"
              />
            )}
          </div>

          {/* Lokasi */}
          <div>
            <p className="text-sm font-semibold text-gray-600 mb-2">Di mana?</p>
            <div className="flex flex-wrap gap-2">
              {LOCATION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setLocation(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    location === opt.value
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-gray-200 bg-gray-50 text-gray-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {location === 'other' && (
              <input
                type="text"
                value={locationOther}
                onChange={e => setLocationOther(e.target.value)}
                placeholder="Di mana?"
                className="mt-2 w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-teal-400"
              />
            )}
          </div>

          {/* Detail tambahan accordion */}
          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowDetail(!showDetail)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-500 bg-gray-50"
            >
              <span>Detail tambahan (opsional)</span>
              <span>{showDetail ? '▲' : '▼'}</span>
            </button>

            {showDetail && (
              <div className="px-4 py-4 space-y-5">
                {/* Makanan */}
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">Makanan yang disajikan</p>
                  <input
                    type="text"
                    value={foodOffered}
                    onChange={e => setFoodOffered(e.target.value)}
                    placeholder="cth: nasi + ayam + sayur"
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
                  />
                  <label className="flex items-center gap-2 mt-2 text-sm text-gray-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={foodRejected}
                      onChange={e => setFoodRejected(e.target.checked)}
                      className="rounded"
                    />
                    Ada makanan yang ditolak
                  </label>
                </div>

                {/* Durasi */}
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">Durasi makan</p>
                  <div className="flex flex-wrap gap-2">
                    {DURATION_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setDuration(duration === opt.value ? null : opt.value)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                          duration === opt.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-gray-50 text-gray-500'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Konteks sebelum makan */}
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">Kondisi sebelum makan</p>
                  <div className="flex flex-wrap gap-2">
                    {PRE_MEAL_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setPreMealContext(preMealContext === opt.value ? null : opt.value)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                          preMealContext === opt.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-gray-50 text-gray-500'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Catatan */}
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">Catatan</p>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Observasi lain yang perlu dicatat..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onDone}
              className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-500 font-semibold text-base"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave || saving}
              className={`flex-1 py-3.5 rounded-2xl font-semibold text-base transition-all ${
                canSave && !saving
                  ? 'bg-blue-500 text-white active:scale-95'
                  : 'bg-gray-100 text-gray-300'
              }`}
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
