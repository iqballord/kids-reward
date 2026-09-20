'use client'

import { useEffect, useState, useCallback } from 'react'
import { useClerk } from '@clerk/nextjs'
import { RewardManager } from '@/components/parent/settings/RewardManager'
import { ChildrenManager } from '@/components/parent/settings/ChildrenManager'
import { ResetTodayButton } from '@/components/parent/settings/ResetTodayButton'

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
  dateOfBirth: string
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
  const [familySlug, setFamilySlug] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const { signOut } = useClerk()

  const fetchData = useCallback(async () => {
    const [rewardsRes, habitsRes, familyRes] = await Promise.all([
      fetch('/api/rewards'),
      fetch('/api/habits/all'),
      fetch('/api/family/me'),
    ])
    const rewardsData = await rewardsRes.json()
    const habitsData = await habitsRes.json()
    const familyData = await familyRes.json()

    setData({
      children: rewardsData.children,
      habits: habitsData,
      rewards: rewardsData.rewards,
      ticketBalances: rewardsData.ticketBalances,
    })
    setFamilySlug(familyData.familySlug ?? null)
    setLoading(false)
  }, [])

  const dashboardUrl = familySlug
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard/${familySlug}`
    : null

  const handleCopy = async () => {
    if (!dashboardUrl) return
    await navigator.clipboard.writeText(dashboardUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
      <ResetTodayButton onReset={fetchData} />

      {/* Dashboard TV */}
      {familySlug && (
        <div className="mb-6 p-4 rounded-2xl bg-gray-950 border border-white/10">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3">📺 Dashboard TV</p>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-white/30 text-xs">Kode:</span>
            <span className="font-mono text-lg font-black text-white tracking-widest">{familySlug}</span>
          </div>
          <div className="flex gap-2">
            <a
              href={dashboardUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 rounded-xl bg-white/10 text-white text-sm font-semibold text-center active:scale-95 transition-transform"
            >
              Buka Dashboard →
            </a>
            <button
              onClick={handleCopy}
              className="px-4 py-2.5 rounded-xl bg-white/10 text-white text-sm font-semibold active:scale-95 transition-transform"
            >
              {copied ? '✓ Tersalin' : 'Salin Link'}
            </button>
          </div>
        </div>
      )}

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

      {/* Logout */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <button
          onClick={() => signOut({ redirectUrl: '/sign-in' })}
          className="w-full py-3 rounded-2xl bg-gray-100 text-gray-500 text-sm font-semibold active:scale-95 transition-transform"
        >
          Keluar
        </button>
      </div>
    </div>
  )
}
