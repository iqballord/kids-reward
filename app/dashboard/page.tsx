'use client'

import { useEffect, useState, useCallback } from 'react'
import { ChildPanel } from '@/components/dashboard/ChildPanel'
import { RewardBanner } from '@/components/dashboard/RewardBanner'
import type { TodayData } from '@/lib/types'
import type { HourglassState } from '@/lib/hourglass'

interface RewardItem {
  id: string
  name: string
  icon: string
  ticketCost: number
  childId: string | null
}

export default function DashboardPage() {
  const [data, setData] = useState<TodayData[]>([])
  const [rewards, setRewards] = useState<RewardItem[]>([])
  const [hourglasses, setHourglasses] = useState<Record<string, HourglassState>>({})
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchData = useCallback(async () => {
    try {
      const [habitsRes, rewardsRes] = await Promise.all([
        fetch('/api/habits/today'),
        fetch('/api/rewards'),
      ])
      if (habitsRes.ok) {
        const json: TodayData[] = await habitsRes.json()
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
      if (rewardsRes.ok) {
        const rd = await rewardsRes.json()
        setRewards(rd.rewards ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    // Polling setiap 3 detik — SSE tidak reliable di Vercel serverless
    // karena setiap request berjalan di instance berbeda
    const interval = setInterval(fetchData, 3000)
    return () => clearInterval(interval)
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
          <div key={childData.child.id} className="flex flex-col gap-4 min-h-0">
            <ChildPanel
              data={childData}
              hourglass={hourglasses[childData.child.id] ?? null}
            />
            <RewardBanner
              rewards={rewards}
              childId={childData.child.id}
              totalTickets={childData.totalTickets}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
