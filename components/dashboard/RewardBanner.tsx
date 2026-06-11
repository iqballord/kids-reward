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
  // Filter reward yang relevan untuk anak ini (shared + per anak)
  const relevant = rewards.filter((r) => r.childId === null || r.childId === childId)
  if (relevant.length === 0) return null

  // Urutkan: yang sudah bisa ditukar dulu, lalu yang paling dekat
  const sorted = [...relevant].sort((a, b) => {
    const aDone = totalTickets >= a.ticketCost
    const bDone = totalTickets >= b.ticketCost
    if (aDone && !bDone) return -1
    if (!aDone && bDone) return 1
    return (a.ticketCost - totalTickets) - (b.ticketCost - totalTickets)
  })

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {sorted.map((reward) => {
        const canRedeem = totalTickets >= reward.ticketCost
        const needed = reward.ticketCost - totalTickets

        return (
          <div
            key={reward.id}
            className={`flex-shrink-0 flex flex-col items-center gap-2 px-5 py-3 rounded-2xl border-2 transition-all duration-500 ${
              canRedeem
                ? 'border-amber-400 bg-amber-950/40'
                : 'border-white/10 bg-white/5'
            }`}
          >
            <span className="text-5xl leading-none">{reward.icon}</span>
            <p className={`text-base font-bold text-center ${canRedeem ? 'text-amber-300' : 'text-white/70'}`}>
              {reward.name}
            </p>
            {canRedeem ? (
              <span className="text-sm font-black text-amber-400 bg-amber-400/20 px-3 py-1 rounded-full">
                ✓ Bisa ditukar!
              </span>
            ) : (
              <span className="text-sm text-white/40">
                🎫 {needed} tiket lagi
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
