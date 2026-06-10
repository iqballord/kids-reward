'use client'

import { useEffect, useState } from 'react'
import type { HourglassState } from '@/lib/hourglass'

interface TimerWidgetProps {
  state: HourglassState
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function HourglassWidget({ state: initialState }: TimerWidgetProps) {
  const [remainingS, setRemainingS] = useState(initialState.remainingS)
  const [isPaused, setIsPaused] = useState(initialState.isPaused)

  useEffect(() => {
    setRemainingS(initialState.remainingS)
    setIsPaused(initialState.isPaused)
    if (initialState.isPaused || initialState.isFinished) return

    const interval = setInterval(() => {
      setRemainingS((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(interval)
  }, [initialState])

  const progressPct = Math.min(100, ((initialState.durationS - remainingS) / initialState.durationS) * 100)

  // Warna berubah seiring waktu habis
  const isAlmostDone = remainingS < initialState.durationS * 0.15
  const isHalfway = remainingS < initialState.durationS * 0.4

  const ringColor = isAlmostDone ? '#f87171' : isHalfway ? '#fcd34d' : '#86efac'
  const circumference = 2 * Math.PI * 28 // r=28
  const strokeDashoffset = circumference * (1 - progressPct / 100)

  return (
    <div className={`flex flex-col items-center gap-1 transition-opacity ${isPaused ? 'opacity-50' : 'opacity-100'}`}>
      {/* Circular progress ring + timer di tengah */}
      <div className="relative w-20 h-20 flex items-center justify-center">
        <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
          {/* Track */}
          <circle cx="40" cy="40" r="28" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
          {/* Progress */}
          <circle
            cx="40" cy="40" r="28"
            fill="none"
            stroke={ringColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 1s ease' }}
          />
        </svg>
        {/* Waktu di tengah */}
        <span className={`absolute text-lg font-black tabular-nums ${isAlmostDone ? 'text-red-400' : isHalfway ? 'text-amber-300' : 'text-green-300'}`}>
          {formatTime(remainingS)}
        </span>
      </div>

      <span className="text-white/40 text-xs font-medium tracking-wider uppercase">
        {isPaused ? '⏸ Jeda' : '🍽️ Makan'}
      </span>
    </div>
  )
}
