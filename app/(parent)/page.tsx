'use client'

import { useEffect, useState, useCallback } from 'react'
import { ChildSection } from '@/components/parent/ChildSection'
import { MealJournalModal } from '@/components/parent/MealJournalModal'
import type { TodayData } from '@/lib/types'

interface PendingJournal {
  childId: string
  habitLogId: string
}

export default function HomePage() {
  const [data, setData] = useState<TodayData[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingJournal, setPendingJournal] = useState<PendingJournal | null>(null)

  const fetchToday = useCallback(async () => {
    const res = await fetch('/api/habits/today')
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchToday()

    // Refetch saat tab kembali aktif — tangkap kasus browser tidur semalam
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') fetchToday()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [fetchToday])

  function handleHabitComplete(
    childId: string,
    habitId: string,
    showJournal: boolean,
    habitLogId: string
  ) {
    // Optimistic update
    setData((prev) =>
      prev.map((d) => {
        if (d.child.id !== childId) return d
        const updateHabits = (list: typeof d.habits.morning) =>
          list.map((h) =>
            h.id === habitId
              ? { ...h, completedAt: new Date().toISOString(), logId: habitLogId }
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

    fetchToday()

    if (showJournal) {
      setPendingJournal({ childId, habitLogId })
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

      {pendingJournal && (
        <MealJournalModal
          childId={pendingJournal.childId}
          habitLogId={pendingJournal.habitLogId}
          onDone={() => setPendingJournal(null)}
        />
      )}
    </div>
  )
}
