'use client'

import { useEffect, useState, useCallback } from 'react'
import { RewardManager } from '@/components/parent/settings/RewardManager'
import { ChildrenManager } from '@/components/parent/settings/ChildrenManager'

type Tab = 'children' | 'rewards'

interface Habit {
  id: string
  name: string
  icon: string
  schedule: string
  ticketsValue: number
  isActive: boolean
  isMeal: boolean
  showOnDashboard: boolean
  sortOrder: number
  childId: string
}

interface Child {
  id: string
  name: string
  age: number
}

interface SettingsData {
  children: (Child & { avatarUrl: string | null })[]
  habits: Habit[]
  rewards: {
    id: string
    name: string
    icon: string
    ticketCost: number
    childId: string | null
    isActive: boolean
  }[]
  ticketBalances: { childId: string; balance: number }[]
}

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('children')
  const [data, setData] = useState<SettingsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const [rewardsRes, habitsRes] = await Promise.all([
      fetch('/api/rewards'),
      fetch('/api/habits/all'),
    ])
    const rewardsData = await rewardsRes.json()
    const habitsData = await habitsRes.json()

    setData({
      children: rewardsData.children,
      habits: habitsData,
      rewards: rewardsData.rewards,
      ticketBalances: rewardsData.ticketBalances,
    })
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-400 text-sm">Memuat...</p>
      </div>
    )
  }

  const habitsByChild = data?.habits.reduce<Record<string, typeof data.habits>>((acc, h) => {
    if (!acc[h.childId]) acc[h.childId] = []
    acc[h.childId].push(h)
    return acc
  }, {}) ?? {}

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">⚙️ Pengaturan</h2>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-2xl">
        {([
          { key: 'children', label: '👶 Anak & Habit' },
          { key: 'rewards',  label: '🎁 Reward' },
        ] as { key: Tab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'children' && data && (
        <ChildrenManager
          children={data.children}
          habitsByChild={habitsByChild}
          onChanged={fetchData}
        />
      )}

      {tab === 'rewards' && data && (
        <RewardManager
          rewards={data.rewards}
          children={data.children}
          ticketBalances={data.ticketBalances}
          onRedeemed={fetchData}
          onChanged={fetchData}
        />
      )}
    </div>
  )
}
