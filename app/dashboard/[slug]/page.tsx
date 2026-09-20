'use client'

import { useEffect, useState, useCallback, use, useRef } from 'react'
import Link from 'next/link'
import { ChildPanel } from '@/components/dashboard/ChildPanel'
import { RewardBanner } from '@/components/dashboard/RewardBanner'
import { CelebrationOverlay } from '@/components/dashboard/CelebrationOverlay'
import { getPusherClient, familyChannel } from '@/lib/pusher'
import type { TodayData } from '@/lib/types'
import type { HourglassState } from '@/lib/hourglass'

interface RewardItem {
  id: string
  name: string
  icon: string
  ticketCost: number
  childId: string | null
}

function useRelativeTime(date: Date) {
  const [label, setLabel] = useState('')
  const [isStale, setIsStale] = useState(false)

  useEffect(() => {
    const update = () => {
      const diffS = Math.floor((Date.now() - date.getTime()) / 1000)
      setIsStale(diffS >= 300)
      if (diffS < 10) setLabel('Baru saja')
      else if (diffS < 60) setLabel(`${diffS} detik lalu`)
      else if (diffS < 3600) setLabel(`${Math.floor(diffS / 60)} menit lalu`)
      else setLabel(`${Math.floor(diffS / 3600)} jam lalu`)
    }
    update()
    const t = setInterval(update, 10000)
    return () => clearInterval(t)
  }, [date])

  return { label, isStale }
}

export default function DashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [data, setData] = useState<TodayData[]>([])
  const [rewards, setRewards] = useState<RewardItem[]>([])
  const [hourglasses, setHourglasses] = useState<Record<string, HourglassState>>({})
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [connected, setConnected] = useState(true)
  const [celebration, setCelebration] = useState<{ childId: string; childName: string } | null>(null)
  const celebratedToday = useState<Set<string>>(() => new Set())[0]
  const familyIdRef = useRef<string | null>(null)
  const { label: relativeTime, isStale } = useRelativeTime(lastUpdate)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/dashboard/${slug}`)
      if (res.status === 404) { setNotFound(true); return }
      if (!res.ok) return
      const json = await res.json()
      if (json.familyId) familyIdRef.current = json.familyId
      setData(json.todayData ?? [])
      setRewards(json.rewards ?? [])
      setHourglasses(json.hourglasses ?? {})
      setLastUpdate(new Date())
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    const wibDate = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
    let lastDate = wibDate()
    fetchData()

    const interval = setInterval(() => {
      const currentDate = wibDate()
      if (currentDate !== lastDate) { lastDate = currentDate; fetchData(); return }
      const hour = Number(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta', hour: 'numeric', hour12: false }))
      if (hour >= 6 && hour < 21) fetchData()
    }, 20000)
    return () => clearInterval(interval)
  }, [fetchData])

  useEffect(() => {
    const waitForFamilyId = setInterval(() => {
      const fid = familyIdRef.current
      if (!fid) return
      clearInterval(waitForFamilyId)

      const pusher = getPusherClient()

      pusher.connection.bind('connected', () => setConnected(true))
      pusher.connection.bind('disconnected', () => setConnected(false))
      pusher.connection.bind('unavailable', () => setConnected(false))
      // Pusher auto-reconnects by default; re-fetch data after reconnect
      pusher.connection.bind('connected', () => fetchData())

      const channel = pusher.subscribe(familyChannel(fid))

      channel.bind('habit_completed', (payload: { childId: string; allHabitsDone: boolean }) => {
        fetchData()
        if (payload.allHabitsDone && !celebratedToday.has(payload.childId)) {
          celebratedToday.add(payload.childId)
          setData(prev => {
            const child = prev.find(d => d.child.id === payload.childId)?.child
            if (child) setCelebration({ childId: child.id, childName: child.name })
            return prev
          })
        }
      })
      channel.bind('hourglass_started', () => fetchData())
      channel.bind('hourglass_paused', () => fetchData())
      channel.bind('hourglass_resumed', () => fetchData())
      channel.bind('hourglass_stopped', () => fetchData())
      channel.bind('reward_redeemed', () => fetchData())
      channel.bind('reset_today', () => fetchData())

      return () => {
        pusher.connection.unbind_all()
        channel.unbind_all()
        pusher.unsubscribe(familyChannel(fid))
        pusher.disconnect()
      }
    }, 100)

    return () => clearInterval(waitForFamilyId)
  }, [fetchData, celebratedToday])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6">
        <p className="text-7xl animate-pulse">⭐</p>
        <p className="text-white/50 text-3xl font-bold tracking-wide">Habit Tracker</p>
        <p className="text-white/20 text-xl">Memuat data keluarga...</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
        <p className="text-6xl">🔍</p>
        <p className="text-white/60 text-3xl font-semibold">Kode tidak ditemukan</p>
        <p className="text-white/30 text-xl">Periksa kembali kode keluarga kamu</p>
        <Link href="/dashboard" className="mt-4 px-6 py-3 bg-white/10 text-white rounded-2xl text-lg font-semibold">
          ← Coba kode lain
        </Link>
      </div>
    )
  }

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const hour = new Date().getHours()
  const greeting = hour < 11 ? '☀️ Selamat Pagi' : hour < 15 ? '🌤️ Selamat Siang' : hour < 19 ? '🌅 Selamat Sore' : '🌙 Selamat Malam'

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col p-8 gap-6">
      {celebration && (
        <CelebrationOverlay
          childName={celebration.childName}
          onDone={() => setCelebration(null)}
        />
      )}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">{greeting}</h1>
          <p className="text-white/30 text-lg capitalize mt-0.5">{today}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm ${isStale ? 'text-red-400' : 'text-white/20'}`}>
            {relativeTime}
          </span>
          <span
            title={connected ? 'Terhubung' : 'Terputus'}
            className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}
          />
        </div>
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

      <div className="grid grid-cols-2 gap-6 shrink-0">
        {data.map((childData) => (
          <RewardBanner
            key={childData.child.id}
            rewards={rewards}
            childId={childData.child.id}
            totalTickets={childData.totalTickets}
          />
        ))}
      </div>
    </div>
  )
}
