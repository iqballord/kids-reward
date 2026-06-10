'use client'

import { useEffect, useState, useCallback } from 'react'
import { ChildPanel } from '@/components/dashboard/ChildPanel'
import type { TodayData } from '@/lib/types'
import type { HourglassState } from '@/lib/hourglass'

export default function DashboardPage() {
  const [data, setData] = useState<TodayData[]>([])
  const [hourglasses, setHourglasses] = useState<Record<string, HourglassState>>({})
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/habits/today')
      if (res.ok) {
        const json: TodayData[] = await res.json()
        setData(json)
        setLastUpdate(new Date())

        // Fetch hourglass state per anak
        const hgResults = await Promise.all(
          json.map(async (d) => {
            const r = await fetch(`/api/hourglass?child_id=${d.child.id}`)
            if (!r.ok) return null
            const { session } = await r.json()
            return session ? { childId: d.child.id, state: session as HourglassState } : null
          })
        )
        const hgMap: Record<string, HourglassState> = {}
        hgResults.forEach((item) => {
          if (item) hgMap[item.childId] = item.state
        })
        setHourglasses(hgMap)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    let fallbackInterval: ReturnType<typeof setInterval>
    const es = new EventSource('/api/events')

    es.addEventListener('habit_completed', () => fetchData())
    es.addEventListener('reward_redeemed', () => fetchData())

    es.addEventListener('hourglass_started', (e) => {
      const { childId } = JSON.parse(e.data)
      fetch(`/api/hourglass?child_id=${childId}`)
        .then((r) => r.json())
        .then(({ session }) => {
          if (session) setHourglasses((prev) => ({ ...prev, [childId]: session }))
        })
    })

    es.addEventListener('hourglass_paused', (e) => {
      const { childId } = JSON.parse(e.data)
      fetch(`/api/hourglass?child_id=${childId}`)
        .then((r) => r.json())
        .then(({ session }) => {
          if (session) setHourglasses((prev) => ({ ...prev, [childId]: session }))
        })
    })

    es.addEventListener('hourglass_resumed', (e) => {
      const { childId } = JSON.parse(e.data)
      fetch(`/api/hourglass?child_id=${childId}`)
        .then((r) => r.json())
        .then(({ session }) => {
          if (session) setHourglasses((prev) => ({ ...prev, [childId]: session }))
        })
    })

    es.addEventListener('hourglass_stopped', (e) => {
      const { childId } = JSON.parse(e.data)
      setHourglasses((prev) => {
        const next = { ...prev }
        delete next[childId]
        return next
      })
    })

    es.onerror = () => {
      fallbackInterval = setInterval(fetchData, 5000)
    }

    return () => {
      es.close()
      clearInterval(fallbackInterval)
    }
  }, [fetchData])

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const hour = new Date().getHours()
  const greeting = hour < 11 ? '☀️ Selamat Pagi' : hour < 15 ? '🌤️ Selamat Siang' : hour < 19 ? '🌅 Selamat Sore' : '🌙 Selamat Malam'

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-white/30 text-2xl">Memuat...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col p-8 gap-6">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">{greeting}</h1>
          <p className="text-white/30 text-lg capitalize mt-0.5">{today}</p>
        </div>
        <p className="text-white/20 text-sm">
          {lastUpdate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-6 min-h-0">
        {data.map((childData) => (
          <ChildPanel
            key={childData.child.id}
            data={childData}
            hourglass={hourglasses[childData.child.id] ?? null}
          />
        ))}
      </div>
    </div>
  )
}
