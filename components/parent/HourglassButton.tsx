'use client'

import { useState, useEffect } from 'react'
import type { HourglassState } from '@/lib/hourglass'

interface HourglassButtonProps {
  childId: string
  childName: string
}

export function HourglassButton({ childId, childName }: HourglassButtonProps) {
  const [session, setSession] = useState<HourglassState | null>(null)
  const [loading, setLoading] = useState(false)

  async function fetchSession() {
    const res = await fetch(`/api/hourglass?child_id=${childId}`)
    if (res.ok) {
      const { session } = await res.json()
      setSession(session ?? null)
    }
  }

  useEffect(() => {
    fetchSession()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId])

  async function callAction(action: 'start' | 'pause' | 'resume' | 'stop') {
    setLoading(true)
    try {
      const res = await fetch('/api/hourglass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ child_id: childId, action, duration_s: 1800 }),
      })
      if (res.ok) {
        const { session } = await res.json()
        setSession(action === 'stop' ? null : session)
      }
    } finally {
      setLoading(false)
    }
  }

  const isActive = session && !session.isFinished
  const isPaused = session?.isPaused ?? false

  return (
    <div className="flex items-center gap-2">
      {!isActive ? (
        <button
          onClick={() => callAction('start')}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-orange-50 border-2 border-orange-200 text-orange-600 font-semibold text-sm active:scale-95 transition-all disabled:opacity-50"
        >
          <span className="text-lg">⏳</span>
          Mulai makan {childName}
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-orange-50 border border-orange-200">
            <span className={`text-base ${isPaused ? 'opacity-50' : 'animate-pulse'}`}>⏳</span>
            <span className="text-sm font-semibold text-orange-600">
              {isPaused ? 'Dijeda' : 'Makan berlangsung'}
            </span>
          </div>
          <button
            onClick={() => callAction(isPaused ? 'resume' : 'pause')}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold active:scale-95 transition-all disabled:opacity-50"
          >
            {isPaused ? '▶ Lanjut' : '⏸ Jeda'}
          </button>
          <button
            onClick={() => callAction('stop')}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-red-50 text-red-400 text-sm font-semibold active:scale-95 transition-all disabled:opacity-50"
          >
            ✕ Selesai
          </button>
        </div>
      )}
    </div>
  )
}
