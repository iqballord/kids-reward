'use client'

import { useState } from 'react'

const REWARD_ICONS = ['🎁','🍦','🍕','🍔','🎮','📺','🎢','🎠','🏖️','🎪','🧸','📚','🎨','🎭','🎬','🏆','⭐','🎉','🍭','🍫']

interface Reward {
  id: string
  name: string
  icon: string
  ticketCost: number
  childId: string | null
  isActive: boolean
}

interface Child {
  id: string
  name: string
}

interface TicketBalance {
  childId: string
  balance: number
}

interface RewardManagerProps {
  rewards: Reward[]
  children: Child[]
  ticketBalances: TicketBalance[]
  onRedeemed: () => void
  onChanged: () => void
}

export function RewardManager({ rewards, children, ticketBalances, onRedeemed, onChanged }: RewardManagerProps) {
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('🎁')
  const [newIconCustom, setNewIconCustom] = useState('')
  const [newCost, setNewCost] = useState('')
  const [newChildId, setNewChildId] = useState<string>('all')
  const [saving, setSaving] = useState(false)
  const [redeemingId, setRedeemingId] = useState<string | null>(null)
  const [redeemChildId, setRedeemChildId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetting, setResetting] = useState(false)

  async function handleReset() {
    setResetting(true)
    await fetch('/api/tickets/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    setResetting(false)
    setConfirmReset(false)
    onChanged()
  }

  function getBalance(childId: string) {
    return ticketBalances.find((b) => b.childId === childId)?.balance ?? 0
  }

  async function handleAdd() {
    if (!newName.trim() || !newCost) return
    setSaving(true)
    await fetch('/api/rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newName.trim(),
        icon: newIconCustom.trim() || newIcon,
        ticket_cost: Number(newCost),
        child_id: newChildId === 'all' ? null : newChildId,
      }),
    })
    setNewName('')
    setNewIcon('🎁')
    setNewIconCustom('')
    setNewCost('')
    setNewChildId('all')
    setShowAdd(false)
    setSaving(false)
    onChanged()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/rewards/${id}`, { method: 'DELETE' })
    onChanged()
  }

  async function handleRedeem(reward: Reward) {
    if (!redeemChildId) return
    setError(null)
    const res = await fetch(`/api/rewards/${reward.id}/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ child_id: redeemChildId }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Gagal menukar reward')
      return
    }
    setRedeemingId(null)
    setRedeemChildId('')
    onRedeemed()
    onChanged()
  }

  return (
    <div>
      {/* Saldo tiket per anak */}
      <div className="flex gap-3 mb-3">
        {children.map((child) => (
          <div key={child.id} className="flex-1 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">{child.name}</p>
            <p className="text-3xl font-black text-amber-500">{getBalance(child.id)}</p>
            <p className="text-xs text-gray-400">tiket 🎫</p>
          </div>
        ))}
      </div>

      {/* Reset tiket */}
      {!confirmReset ? (
        <button
          onClick={() => setConfirmReset(true)}
          className="w-full mb-6 py-2.5 rounded-2xl border border-red-100 text-red-400 text-sm font-medium"
        >
          🔄 Reset semua tiket ke 0
        </button>
      ) : (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-red-700 mb-1">Yakin reset semua tiket?</p>
          <p className="text-xs text-red-400 mb-3">Saldo semua anak akan menjadi 0. Tidak bisa dibatalkan.</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmReset(false)} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-500 text-sm font-semibold">Batal</button>
            <button onClick={handleReset} disabled={resetting} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold disabled:opacity-50">
              {resetting ? 'Mereset...' : 'Ya, reset'}
            </button>
          </div>
        </div>
      )}

      {/* Reward list */}
      <div className="flex flex-col gap-3 mb-4">
        {rewards.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-6">Belum ada reward. Tambah dulu!</p>
        )}
        {rewards.map((reward) => (
          <div key={reward.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <span className="text-3xl">{reward.icon ?? '🎁'}</span>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{reward.name}</p>
                <p className="text-sm text-amber-500 font-medium">🎫 {reward.ticketCost} tiket</p>
                {reward.childId && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    untuk {children.find((c) => c.id === reward.childId)?.name ?? '—'}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setRedeemingId(reward.id)
                    setRedeemChildId(children[0]?.id ?? '')
                    setError(null)
                  }}
                  className="px-3 py-1.5 rounded-xl bg-green-100 text-green-700 text-sm font-semibold"
                >
                  Tukar
                </button>
                <button
                  onClick={() => handleDelete(reward.id)}
                  className="px-3 py-1.5 rounded-xl bg-red-50 text-red-400 text-sm font-semibold"
                >
                  Hapus
                </button>
              </div>
            </div>

            {/* Redeem panel */}
            {redeemingId === reward.id && (
              <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                <p className="text-sm font-medium text-gray-600 mb-2">Tukar untuk siapa?</p>
                <div className="flex gap-2 mb-3">
                  {children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => setRedeemChildId(child.id)}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                        redeemChildId === child.id
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 bg-white text-gray-600'
                      }`}
                    >
                      {child.name}
                      <span className="block text-xs text-amber-500">{getBalance(child.id)} tiket</span>
                    </button>
                  ))}
                </div>
                {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setRedeemingId(null); setError(null) }}
                    className="flex-1 py-2.5 rounded-xl bg-gray-200 text-gray-600 text-sm font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => handleRedeem(reward)}
                    disabled={getBalance(redeemChildId) < reward.ticketCost}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      getBalance(redeemChildId) >= reward.ticketCost
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-300'
                    }`}
                  >
                    Konfirmasi
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tambah reward */}
      {showAdd ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="font-semibold text-gray-800 mb-3">Reward baru</p>

          {/* Icon picker */}
          <p className="text-xs text-gray-500 mb-1.5">Pilih ikon</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {REWARD_ICONS.map((e) => (
              <button
                key={e}
                onClick={() => { setNewIcon(e); setNewIconCustom('') }}
                className={`text-2xl p-1.5 rounded-xl border-2 transition-all ${newIcon === e && !newIconCustom ? 'border-blue-400 bg-blue-50' : 'border-transparent'}`}
              >
                {e}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={newIconCustom}
            onChange={(e) => setNewIconCustom(e.target.value)}
            placeholder="Atau ketik emoji lain..."
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm mb-3 focus:outline-none focus:border-blue-400"
            maxLength={4}
          />

          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nama reward (cth: Es krim)"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm mb-2 focus:outline-none focus:border-blue-400"
          />
          <input
            type="number"
            value={newCost}
            onChange={(e) => setNewCost(e.target.value)}
            placeholder="Jumlah tiket"
            min={1}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm mb-2 focus:outline-none focus:border-blue-400"
          />
          <select
            value={newChildId}
            onChange={(e) => setNewChildId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm mb-3 focus:outline-none focus:border-blue-400 bg-white"
          >
            <option value="all">Untuk semua anak</option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdd(false)}
              className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-500 font-semibold text-sm"
            >
              Batal
            </button>
            <button
              onClick={handleAdd}
              disabled={!newName.trim() || !newCost || saving}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
                newName.trim() && newCost
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-300'
              }`}
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full py-3.5 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 font-medium text-sm"
        >
          + Tambah Reward
        </button>
      )}
    </div>
  )
}
