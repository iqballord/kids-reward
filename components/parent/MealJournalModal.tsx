'use client'

import { useState } from 'react'

type Portion = 'little' | 'half' | 'all'
type Mood = 'focused' | 'distracted' | 'fussy'
type MealType = 'breakfast' | 'lunch' | 'dinner'

interface MealJournalModalProps {
  childId: string
  habitLogId: string
  onDone: () => void
}

const PORTION_OPTIONS: { value: Portion; label: string; emoji: string }[] = [
  { value: 'little', label: 'Sedikit', emoji: '😔' },
  { value: 'half',   label: 'Setengah', emoji: '😐' },
  { value: 'all',    label: 'Habis', emoji: '😄' },
]

const MOOD_OPTIONS: { value: Mood; label: string; emoji: string }[] = [
  { value: 'focused',    label: 'Fokus', emoji: '😊' },
  { value: 'distracted', label: 'Distraksi', emoji: '😵' },
  { value: 'fussy',      label: 'Rewel', emoji: '😤' },
]

function guessMealType(): MealType {
  const h = new Date().getHours()
  if (h < 11) return 'breakfast'
  if (h < 16) return 'lunch'
  return 'dinner'
}

function todayDate() {
  return new Date().toISOString().split('T')[0]
}

export function MealJournalModal({ childId, habitLogId, onDone }: MealJournalModalProps) {
  const [portion, setPortion] = useState<Portion | null>(null)
  const [mood, setMood] = useState<Mood | null>(null)
  const [food, setFood] = useState('')
  const [notes, setNotes] = useState('')
  const [duration, setDuration] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!portion || !mood) return
    setSaving(true)
    try {
      await fetch('/api/meal-journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id: childId,
          habit_log_id: habitLogId,
          date: todayDate(),
          meal_type: guessMealType(),
          portion,
          mood,
          food_description: food || null,
          notes: notes || null,
          duration_minutes: duration ? Number(duration) : null,
        }),
      })
    } finally {
      setSaving(false)
      onDone()
    }
  }

  const canSave = !!portion && !!mood

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={onDone}>
      <div
        className="bg-white w-full rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        <h2 className="text-xl font-bold text-gray-900 mb-1">📔 Jurnal Makan</h2>
        <p className="text-sm text-gray-400 mb-6">Catatan ini akan disimpan untuk data dokter</p>

        {/* Porsi */}
        <div className="mb-5">
          <p className="text-sm font-semibold text-gray-600 mb-2">Berapa banyak yang dimakan?</p>
          <div className="grid grid-cols-3 gap-2">
            {PORTION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPortion(opt.value)}
                className={`flex flex-col items-center py-3 rounded-2xl border-2 transition-all ${
                  portion === opt.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-100 bg-gray-50'
                }`}
              >
                <span className="text-3xl mb-1">{opt.emoji}</span>
                <span className={`text-sm font-semibold ${portion === opt.value ? 'text-blue-600' : 'text-gray-600'}`}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Mood */}
        <div className="mb-5">
          <p className="text-sm font-semibold text-gray-600 mb-2">Bagaimana kondisi saat makan?</p>
          <div className="grid grid-cols-3 gap-2">
            {MOOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMood(opt.value)}
                className={`flex flex-col items-center py-3 rounded-2xl border-2 transition-all ${
                  mood === opt.value
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-100 bg-gray-50'
                }`}
              >
                <span className="text-3xl mb-1">{opt.emoji}</span>
                <span className={`text-sm font-semibold ${mood === opt.value ? 'text-purple-600' : 'text-gray-600'}`}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Makanan */}
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-600 mb-2">Makanan apa? <span className="text-gray-400 font-normal">(opsional)</span></p>
          <input
            type="text"
            value={food}
            onChange={(e) => setFood(e.target.value)}
            placeholder="cth: nasi + ayam + sayur"
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-gray-800 text-sm placeholder:text-gray-300 focus:outline-none focus:border-blue-400"
          />
        </div>

        {/* Durasi */}
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-600 mb-2">Berapa menit makan? <span className="text-gray-400 font-normal">(opsional)</span></p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="cth: 20"
              min={1}
              max={120}
              className="w-32 px-4 py-3 rounded-2xl border border-gray-200 text-gray-800 text-sm focus:outline-none focus:border-blue-400"
            />
            <span className="text-sm text-gray-400">menit</span>
          </div>
        </div>

        {/* Catatan */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-gray-600 mb-2">Catatan tambahan <span className="text-gray-400 font-normal">(opsional)</span></p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="cth: makan sambil lari-lari, tidak mau sayur hari ini..."
            rows={3}
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-gray-800 text-sm placeholder:text-gray-300 focus:outline-none focus:border-blue-400 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onDone}
            className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-500 font-semibold text-base"
          >
            Lewati
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
  )
}
