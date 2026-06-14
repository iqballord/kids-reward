'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Child } from '@/lib/types'

type HabitLog = {
  id: string
  date: string
  completedAt: string | null
  ticketsEarned: number
  habitId: string
  habitName: string
  habitIcon: string
  habitSchedule: string
}

const SCHEDULE_LABEL: Record<string, string> = {
  morning: '☀️ Pagi',
  afternoon: '🌤️ Siang',
  evening: '🌙 Malam',
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function fromToDefault() {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 6)
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  }
}

export default function HistoryPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [activeChildId, setActiveChildId] = useState('')
  const [grouped, setGrouped] = useState<Record<string, HabitLog[]>>({})
  const [loading, setLoading] = useState(true)
  const [{ from, to }, setRange] = useState(fromToDefault)

  useEffect(() => {
    fetch('/api/children')
      .then(r => r.json())
      .then((data: Child[]) => {
        setChildren(data)
        if (data.length > 0) setActiveChildId(data[0].id)
      })
  }, [])

  const fetchHistory = useCallback(async () => {
    if (!activeChildId) return
    setLoading(true)
    const res = await fetch(`/api/habit-history?child_id=${activeChildId}&from=${from}&to=${to}`)
    if (res.ok) setGrouped(await res.json())
    setLoading(false)
  }, [activeChildId, from, to])

  useEffect(() => {
    if (activeChildId) fetchHistory()
  }, [activeChildId, fetchHistory])

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  // Hitung completion rate per hari
  function completionBadge(logs: HabitLog[]) {
    const count = logs.length
    if (count >= 8) return { label: `${count} habit`, color: 'bg-green-100 text-green-700' }
    if (count >= 5) return { label: `${count} habit`, color: 'bg-blue-100 text-blue-700' }
    return { label: `${count} habit`, color: 'bg-gray-100 text-gray-500' }
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-5">History Habit</h2>

      {/* Tab anak */}
      {children.length > 1 && (
        <div className="flex gap-2 mb-4">
          {children.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveChildId(c.id)}
              className={`flex-1 py-2 rounded-2xl text-sm font-semibold border-2 transition-all ${
                activeChildId === c.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-100 bg-gray-50 text-gray-500'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Date range */}
      <div className="flex gap-2 mb-5">
        <div className="flex-1">
          <p className="text-xs text-gray-400 mb-1">Dari</p>
          <input
            type="date"
            value={from}
            onChange={e => setRange(r => ({ ...r, from: e.target.value }))}
            className="w-full px-3 py-2 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
          />
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-400 mb-1">Sampai</p>
          <input
            type="date"
            value={to}
            onChange={e => setRange(r => ({ ...r, to: e.target.value }))}
            className="w-full px-3 py-2 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-8">Memuat...</p>
      ) : sortedDates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-500 text-sm">Tidak ada data di periode ini.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map(date => {
            const logs = grouped[date]
            const badge = completionBadge(logs)
            const bySchedule = logs.reduce<Record<string, HabitLog[]>>((acc, l) => {
              if (!acc[l.habitSchedule]) acc[l.habitSchedule] = []
              acc[l.habitSchedule].push(l)
              return acc
            }, {})
            const totalTickets = logs.reduce((s, l) => s + l.ticketsEarned, 0)

            return (
              <div key={date} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Date header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                  <p className="text-sm font-bold text-gray-800 capitalize">{formatDate(date)}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-500 font-semibold">+{totalTickets} 🎫</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>
                </div>

                {/* Habits by schedule */}
                <div className="px-4 py-3 space-y-3">
                  {(['morning', 'afternoon', 'evening'] as const).map(schedule => {
                    const scheduleLogs = bySchedule[schedule]
                    if (!scheduleLogs?.length) return null
                    return (
                      <div key={schedule}>
                        <p className="text-xs font-semibold text-gray-400 mb-1.5">
                          {SCHEDULE_LABEL[schedule]}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {scheduleLogs.map(log => (
                            <div
                              key={log.id}
                              className="flex items-center gap-1.5 bg-green-50 border border-green-100 rounded-xl px-2.5 py-1.5"
                            >
                              <span className="text-base leading-none">{log.habitIcon}</span>
                              <span className="text-xs font-medium text-green-800">{log.habitName}</span>
                              {log.completedAt && (
                                <span className="text-xs text-green-400">
                                  {new Date(log.completedAt).toLocaleTimeString('id-ID', {
                                    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
                                  })}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
