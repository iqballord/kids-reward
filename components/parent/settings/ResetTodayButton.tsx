'use client'

import { useState } from 'react'

export function ResetTodayButton({ onReset }: { onReset: () => void }) {
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleReset() {
    setLoading(true)
    await fetch('/api/reset-today', { method: 'POST' })
    setLoading(false)
    setConfirm(false)
    onReset()
  }

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="w-full mb-5 py-3 rounded-2xl border border-orange-200 text-orange-500 text-sm font-medium bg-orange-50"
      >
        🔄 Reset habit & tiket hari ini
      </button>
    )
  }

  return (
    <div className="mb-5 bg-orange-50 border border-orange-200 rounded-2xl p-4">
      <p className="text-sm font-semibold text-orange-700 mb-1">Reset semua data hari ini?</p>
      <p className="text-xs text-orange-400 mb-3">Semua habit yang sudah dicentang dan tiket yang diperoleh hari ini akan dihapus.</p>
      <div className="flex gap-2">
        <button onClick={() => setConfirm(false)} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-500 text-sm font-semibold">Batal</button>
        <button onClick={handleReset} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold disabled:opacity-50">
          {loading ? 'Mereset...' : 'Ya, reset'}
        </button>
      </div>
    </div>
  )
}
