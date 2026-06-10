'use client'

import { useEffect, useState, useCallback } from 'react'
import { RewardManager } from '@/components/parent/settings/RewardManager'

interface RewardsData {
  rewards: {
    id: string
    name: string
    ticketCost: number
    childId: string | null
    isActive: boolean
  }[]
  children: { id: string; name: string; age: number }[]
  ticketBalances: { childId: string; balance: number }[]
}

export default function SettingsPage() {
  const [data, setData] = useState<RewardsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/rewards')
    if (res.ok) setData(await res.json())
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

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">🎁 Reward & Tiket</h2>
        <p className="text-sm text-gray-400 mt-1">Kelola reward yang bisa ditukar dengan tiket</p>
      </div>

      {data && (
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
