'use client'

import { useState } from 'react'
import { HabitCard } from './HabitCard'
import { HourglassButton } from './HourglassButton'
import type { TodayData } from '@/lib/types'

const SCHEDULE_LABELS: Record<string, string> = {
  morning: '☀️ Pagi',
  afternoon: '🌤️ Siang & Sore',
  evening: '🌙 Malam',
}

interface ChildSectionProps {
  data: TodayData
  onHabitComplete: (childId: string, habitId: string, habitLogId: string) => void
}

export function ChildSection({ data, onHabitComplete }: ChildSectionProps) {
  const { child, habits, totalTickets } = data

  const totalHabits = Object.values(habits).flat().length
  const doneHabits = Object.values(habits).flat().filter((h) => h.completedAt).length
  const allDone = totalHabits > 0 && doneHabits === totalHabits

  return (
    <div className="mb-8">
      {/* Child header */}
      <div className={`rounded-2xl px-4 py-3 mb-4 flex items-center justify-between ${allDone ? 'bg-green-100' : 'bg-white border border-gray-100 shadow-sm'}`}>
        <div>
          <p className="font-bold text-lg text-gray-900">{child.name}</p>
          <p className="text-sm text-gray-500">{child.age} tahun · {doneHabits}/{totalHabits} selesai</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-amber-500">{totalTickets}</p>
          <p className="text-xs text-gray-400">total tiket 🎫</p>
        </div>
      </div>

      {/* Habits by schedule */}
      {(['morning', 'afternoon', 'evening'] as const).map((schedule) => {
        const scheduleHabits = habits[schedule]
        if (scheduleHabits.length === 0) return null
        return (
          <div key={schedule} className="mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
              {SCHEDULE_LABELS[schedule]}
            </p>
            <div className="flex flex-col gap-2">
              {scheduleHabits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  childId={child.id}
                  onComplete={(habitId, habitLogId) =>
                    onHabitComplete(child.id, habitId, habitLogId)
                  }
                />
              ))}
            </div>
          </div>
        )
      })}

      {allDone && (
        <div className="text-center py-4 text-green-600 font-semibold text-base">
          🎉 Semua habit selesai hari ini!
        </div>
      )}

      <HourglassButton childId={child.id} childName={child.name} />
    </div>
  )
}
