'use client'

import { useState, useEffect, useRef } from 'react'
import type { HabitWithStatus } from '@/lib/types'

const UNDO_SECONDS = 5

interface HabitCardProps {
  habit: HabitWithStatus
  childId: string
  onComplete: (habitId: string, habitLogId: string) => void
}

export function HabitCard({ habit, childId, onComplete }: HabitCardProps) {
  const [status, setStatus] = useState<'idle' | 'pending-undo' | 'saving' | 'done'>(
    habit.completedAt ? 'done' : 'idle'
  )
  const [countdown, setCountdown] = useState(UNDO_SECONDS)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  function handleTap() {
    if (status !== 'idle') return
    setStatus('pending-undo')
    setCountdown(UNDO_SECONDS)

    // Countdown display
    intervalRef.current = setInterval(() => {
      setCountdown((c) => c - 1)
    }, 1000)

    // Commit ke DB setelah 5 detik
    timerRef.current = setTimeout(() => {
      clearInterval(intervalRef.current!)
      commitToDb()
    }, UNDO_SECONDS * 1000)
  }

  function handleUndo() {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (intervalRef.current) clearInterval(intervalRef.current)
    setStatus('idle')
    setCountdown(UNDO_SECONDS)
  }

  async function commitToDb() {
    setStatus('saving')
    try {
      const res = await fetch(`/api/habits/${habit.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ child_id: childId }),
      })
      if (!res.ok) { setStatus('idle'); return }
      const data = await res.json()
      setStatus('done')
      onComplete(habit.id, data.habitLogId)
    } catch {
      setStatus('idle')
    }
  }

  // State: selesai permanen
  if (status === 'done') {
    return (
      <div className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-green-50 border-2 border-green-200 opacity-80">
        <span className="text-3xl leading-none">{habit.icon}</span>
        <span className="flex-1 text-base font-medium text-green-700 line-through decoration-green-400">
          {habit.name}
        </span>
        <span className="text-green-500 text-xl">✓</span>
      </div>
    )
  }

  // State: menunggu undo (5 detik)
  if (status === 'pending-undo') {
    const progress = ((UNDO_SECONDS - countdown) / UNDO_SECONDS) * 100

    return (
      <div className="w-full rounded-2xl border-2 border-amber-300 bg-amber-50 overflow-hidden">
        {/* Progress bar */}
        <div
          className="h-1 bg-amber-400 transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="text-3xl leading-none">{habit.icon}</span>
          <span className="flex-1 text-base font-medium text-amber-800">
            {habit.name}
          </span>
          <button
            onClick={handleUndo}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-200 text-amber-800 text-sm font-semibold active:scale-95 transition-transform"
          >
            Batal ({countdown})
          </button>
        </div>
      </div>
    )
  }

  // State: sedang simpan ke DB
  if (status === 'saving') {
    return (
      <div className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-white border-2 border-gray-100 opacity-60">
        <span className="text-3xl leading-none">{habit.icon}</span>
        <span className="flex-1 text-base font-medium text-gray-800">{habit.name}</span>
        <span className="text-gray-400 text-sm">Menyimpan...</span>
      </div>
    )
  }

  // State: idle
  return (
    <button
      onClick={handleTap}
      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-white border-2 border-gray-100 active:scale-95 shadow-sm transition-all duration-200 text-left"
    >
      <span className="text-3xl leading-none">{habit.icon}</span>
      <span className="flex-1 text-base font-medium text-gray-800">{habit.name}</span>
      <span className="text-amber-500 text-sm font-semibold shrink-0">🎫 {habit.ticketsValue}</span>
    </button>
  )
}
