'use client'

interface Reward {
  id: string
  name: string
  icon: string
  ticketCost: number
  childId: string | null
}

interface RewardBannerProps {
  rewards: Reward[]
  childId: string
  totalTickets: number
}

export function RewardBanner({ rewards, childId, totalTickets }: RewardBannerProps) {
  const relevant = rewards.filter((r) => r.childId === null || r.childId === childId)
  if (relevant.length === 0) return null

  const sorted = [...relevant].sort((a, b) => {
    const aDone = totalTickets >= a.ticketCost
    const bDone = totalTickets >= b.ticketCost
    if (aDone && !bDone) return -1
    if (!aDone && bDone) return 1
    return (a.ticketCost - totalTickets) - (b.ticketCost - totalTickets)
  })

  return (
    <div className="flex gap-3 overflow-x-auto">
      {sorted.map((reward) => {
        const canRedeem = totalTickets >= reward.ticketCost
        const needed = reward.ticketCost - totalTickets

        return (
          <div
            key={reward.id}
            className={`flex-shrink-0 flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all duration-500 ${
              canRedeem
                ? 'border-amber-400 bg-amber-950/40'
                : 'border-white/10 bg-white/5'
            }`}
          >
            <span className="text-5xl leading-none">{reward.icon}</span>
            <div>
              <p className={`text-2xl font-bold leading-tight ${canRedeem ? 'text-amber-300' : 'text-white/70'}`}>
                {reward.name}
              </p>
              {canRedeem ? (
                <p className="text-xl font-black text-amber-400 mt-1">✓ Bisa ditukar!</p>
              ) : (
                <p className="text-2xl font-bold text-white/50 mt-1">🎫 {needed} tiket lagi</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
