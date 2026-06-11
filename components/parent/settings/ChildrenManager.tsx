'use client'

import { useState } from 'react'

interface Habit {
  id: string
  name: string
  icon: string
  schedule: string
  ticketsValue: number
  isActive: boolean
  isMeal: boolean
  sortOrder: number
}

interface Child {
  id: string
  name: string
  age: number
}

interface ChildrenManagerProps {
  children: Child[]
  habitsByChild: Record<string, Habit[]>
  onChanged: () => void
}

const SCHEDULE_OPTIONS = [
  { value: 'morning',   label: '☀️ Pagi' },
  { value: 'afternoon', label: '🌤️ Siang & Sore' },
  { value: 'evening',   label: '🌙 Malam' },
]

const COMMON_ICONS = ['🍳','🍱','🍽️','🦷','😴','🧸','🛁','🌙','📚','🎒','🏃','🧹','💊','🥛','🍎']

const SCHEDULE_LABELS: Record<string, string> = {
  morning: '☀️ Pagi',
  afternoon: '🌤️ Siang & Sore',
  evening: '🌙 Malam',
}

function EditChildForm({ child, onSave, onCancel }: {
  child: Child
  onSave: (name: string, age: number) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(child.name)
  const [age, setAge] = useState(String(child.age))

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-3">
      <p className="text-sm font-semibold text-blue-700 mb-3">Edit profil anak</p>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nama anak"
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm mb-2 focus:outline-none focus:border-blue-400"
      />
      <input
        type="number"
        value={age}
        onChange={(e) => setAge(e.target.value)}
        placeholder="Usia"
        min={1}
        max={18}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm mb-3 focus:outline-none focus:border-blue-400"
      />
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-500 text-sm font-semibold">Batal</button>
        <button
          onClick={() => onSave(name, Number(age))}
          disabled={!name.trim() || !age}
          className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold disabled:opacity-40"
        >
          Simpan
        </button>
      </div>
    </div>
  )
}

function AddHabitForm({ childId, onSave, onCancel }: {
  childId: string
  onSave: () => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('⭐')
  const [schedule, setSchedule] = useState('morning')
  const [tickets, setTickets] = useState('1')
  const [isMeal, setIsMeal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [customIcon, setCustomIcon] = useState('')

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    await fetch(`/api/children/${childId}/habits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        icon: customIcon || icon,
        schedule,
        tickets_value: Number(tickets) || 1,
        is_meal: isMeal,
      }),
    })
    setSaving(false)
    onSave()
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mt-2">
      <p className="text-sm font-semibold text-green-700 mb-3">Habit baru</p>

      {/* Icon picker */}
      <p className="text-xs text-gray-500 mb-1.5">Pilih ikon</p>
      <div className="flex flex-wrap gap-2 mb-2">
        {COMMON_ICONS.map((e) => (
          <button
            key={e}
            onClick={() => { setIcon(e); setCustomIcon('') }}
            className={`text-2xl p-1.5 rounded-xl border-2 transition-all ${icon === e && !customIcon ? 'border-green-400 bg-green-100' : 'border-transparent'}`}
          >
            {e}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={customIcon}
        onChange={(e) => setCustomIcon(e.target.value)}
        placeholder="Atau ketik emoji lain..."
        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm mb-3 focus:outline-none focus:border-green-400"
        maxLength={4}
      />

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nama habit (cth: Minum susu)"
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm mb-2 focus:outline-none focus:border-green-400"
      />

      <div className="flex gap-2 mb-2">
        <select
          value={schedule}
          onChange={(e) => setSchedule(e.target.value)}
          className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-green-400"
        >
          {SCHEDULE_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 bg-white">
          <span className="text-amber-500 text-sm">🎫</span>
          <input
            type="number"
            value={tickets}
            onChange={(e) => setTickets(e.target.value)}
            min={1}
            max={10}
            className="w-10 text-sm text-center focus:outline-none"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 mb-3 cursor-pointer">
        <input
          type="checkbox"
          checked={isMeal}
          onChange={(e) => setIsMeal(e.target.checked)}
          className="w-4 h-4 accent-green-500"
        />
        <span className="text-sm text-gray-600">Ini habit makan (tampilkan jurnal)</span>
      </label>

      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-500 text-sm font-semibold">Batal</button>
        <button
          onClick={handleSave}
          disabled={!name.trim() || saving}
          className="flex-1 py-2.5 rounded-xl bg-green-500 text-white text-sm font-semibold disabled:opacity-40"
        >
          {saving ? 'Menyimpan...' : 'Tambah'}
        </button>
      </div>
    </div>
  )
}

export function ChildrenManager({ children, habitsByChild, onChanged }: ChildrenManagerProps) {
  const [editingChildId, setEditingChildId] = useState<string | null>(null)
  const [addingHabitForChild, setAddingHabitForChild] = useState<string | null>(null)
  const [expandedChild, setExpandedChild] = useState<string | null>(children[0]?.id ?? null)

  async function handleSaveChild(id: string, name: string, age: number) {
    await fetch(`/api/children/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, age }),
    })
    setEditingChildId(null)
    onChanged()
  }

  async function handleToggleHabit(habitId: string, isActive: boolean) {
    await fetch(`/api/habits/${habitId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !isActive }),
    })
    onChanged()
  }

  return (
    <div className="flex flex-col gap-4">
      {children.map((child) => {
        const habits = habitsByChild[child.id] ?? []
        const activeHabits = habits.filter((h) => h.isActive)
        const inactiveHabits = habits.filter((h) => !h.isActive)
        const isExpanded = expandedChild === child.id

        return (
          <div key={child.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            {/* Child header */}
            <button
              onClick={() => setExpandedChild(isExpanded ? null : child.id)}
              className="w-full flex items-center justify-between px-4 py-4 text-left"
            >
              <div>
                <p className="font-bold text-gray-900">{child.name}</p>
                <p className="text-sm text-gray-400">{child.age} tahun · {activeHabits.length} habit aktif</p>
              </div>
              <span className="text-gray-300 text-lg">{isExpanded ? '▲' : '▼'}</span>
            </button>

            {isExpanded && (
              <div className="border-t border-gray-100 px-4 pb-4">

                {/* Edit child */}
                {editingChildId === child.id ? (
                  <EditChildForm
                    child={child}
                    onSave={(name, age) => handleSaveChild(child.id, name, age)}
                    onCancel={() => setEditingChildId(null)}
                  />
                ) : (
                  <button
                    onClick={() => setEditingChildId(child.id)}
                    className="mt-3 mb-4 text-sm text-blue-500 font-medium"
                  >
                    ✏️ Edit nama & usia
                  </button>
                )}

                {/* Active habits */}
                {(['morning', 'afternoon', 'evening'] as const).map((schedule) => {
                  const items = activeHabits.filter((h) => h.schedule === schedule)
                  if (items.length === 0) return null
                  return (
                    <div key={schedule} className="mb-3">
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5">
                        {SCHEDULE_LABELS[schedule]}
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {items.map((habit) => (
                          <div key={habit.id} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl">
                            <span className="text-xl">{habit.icon}</span>
                            <span className="flex-1 text-sm font-medium text-gray-700">{habit.name}</span>
                            <span className="text-xs text-amber-500 font-semibold">🎫{habit.ticketsValue}</span>
                            <button
                              onClick={() => handleToggleHabit(habit.id, habit.isActive)}
                              className="text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-400 font-semibold"
                            >
                              Nonaktifkan
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}

                {/* Inactive habits */}
                {inactiveHabits.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-300 font-semibold uppercase tracking-wider mb-1.5">
                      Tidak aktif
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {inactiveHabits.map((habit) => (
                        <div key={habit.id} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50/50 rounded-xl opacity-50">
                          <span className="text-xl">{habit.icon}</span>
                          <span className="flex-1 text-sm font-medium text-gray-400 line-through">{habit.name}</span>
                          <button
                            onClick={() => handleToggleHabit(habit.id, habit.isActive)}
                            className="text-xs px-2.5 py-1 rounded-lg bg-green-50 text-green-500 font-semibold"
                          >
                            Aktifkan
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add habit */}
                {addingHabitForChild === child.id ? (
                  <AddHabitForm
                    childId={child.id}
                    onSave={() => { setAddingHabitForChild(null); onChanged() }}
                    onCancel={() => setAddingHabitForChild(null)}
                  />
                ) : (
                  <button
                    onClick={() => setAddingHabitForChild(child.id)}
                    className="w-full mt-2 py-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 text-sm font-medium"
                  >
                    + Tambah Habit
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
