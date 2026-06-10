'use client'

import { useState } from 'react'
import type { HabitWithStatus } from '@/lib/types'

interface HabitCardProps {
  habit: HabitWithStatus
  childId: string
  onComplete: (habitId: string, showJournal: boolean) => void
}

export function HabitCard({ habit, childId, onComplete }: HabitCardProps) {
  const [loading, setLoading] = useState(false)
  const done = !!habit.completedAt

  async function handleTap() {
    if (done || loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/habits/${habit.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ child_id: childId }),
      })
      if (!res.ok) return
      const data = await res.json()
      onComplete(habit.id, data.showJournal)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleTap}
      disabled={done || loading}
      className={`
        w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl
        transition-all duration-200 text-left
        ${done
          ? 'bg-green-50 border-2 border-green-200 opacity-80'
          : 'bg-white border-2 border-gray-100 active:scale-95 shadow-sm'
        }
        ${loading ? 'opacity-60' : ''}
      `}
    >
      <span className="text-3xl leading-none">{habit.icon}</span>
      <span className={`flex-1 text-base font-medium ${done ? 'text-green-700 line-through decoration-green-400' : 'text-gray-800'}`}>
        {habit.name}
      </span>
      <span className="flex items-center gap-1 text-sm font-semibold shrink-0">
        {done ? (
          <span className="text-green-500 text-xl">✓</span>
        ) : loading ? (
          <span className="text-gray-400 animate-spin text-lg">⏳</span>
        ) : (
          <span className="text-amber-500">🎫 {habit.ticketsValue}</span>
        )}
      </span>
    </button>
  )
}
