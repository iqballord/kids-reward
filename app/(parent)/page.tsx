'use client'

import { useEffect, useState, useCallback } from 'react'
import { ChildSection } from '@/components/parent/ChildSection'
import type { TodayData } from '@/lib/types'

export default function HomePage() {
  const [data, setData] = useState<TodayData[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingJournal, setPendingJournal] = useState<{ childId: string; habitId: string } | null>(null)

  const fetchToday = useCallback(async () => {
    const res = await fetch('/api/habits/today')
    if (res.ok) {
      const json = await res.json()
      setData(json)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchToday()
  }, [fetchToday])

  function handleHabitComplete(childId: string, habitId: string, showJournal: boolean) {
    // Optimistic update: tandai habit sebagai selesai di UI
    setData((prev) =>
      prev.map((d) => {
        if (d.child.id !== childId) return d
        const updateHabits = (list: typeof d.habits.morning) =>
          list.map((h) =>
            h.id === habitId
              ? { ...h, completedAt: new Date().toISOString(), logId: 'pending' }
              : h
          )
        return {
          ...d,
          habits: {
            morning: updateHabits(d.habits.morning),
            afternoon: updateHabits(d.habits.afternoon),
            evening: updateHabits(d.habits.evening),
          },
        }
      })
    )

    // Refresh untuk dapat total tiket terbaru
    fetchToday()

    if (showJournal) {
      setPendingJournal({ childId, habitId })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-400 text-sm">Memuat...</p>
      </div>
    )
  }

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div>
      <p className="text-sm text-gray-400 mb-6 capitalize">{today}</p>

      {data.map((childData) => (
        <ChildSection
          key={childData.child.id}
          data={childData}
          onHabitComplete={handleHabitComplete}
        />
      ))}

      {/* Placeholder untuk MealJournalModal — akan diimplementasi di step selanjutnya */}
      {pendingJournal && (
        <div className="fixed inset-0 bg-black/40 flex items-end z-50">
          <div className="bg-white w-full rounded-t-3xl p-6">
            <p className="font-bold text-lg mb-2">📔 Jurnal Makan</p>
            <p className="text-gray-500 text-sm mb-4">Catat detail sesi makan (opsional)</p>
            <button
              onClick={() => setPendingJournal(null)}
              className="w-full py-3 rounded-xl bg-gray-100 text-gray-600 font-medium"
            >
              Lewati
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
