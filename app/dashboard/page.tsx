'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardEntryPage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const slug = code.trim().toLowerCase()
    if (!slug) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/dashboard/verify?slug=${slug}`)
      if (res.ok) {
        router.push(`/dashboard/${slug}`)
      } else {
        setError('Kode tidak ditemukan. Periksa kembali kode keluarga kamu.')
        inputRef.current?.focus()
      }
    } catch {
      setError('Terjadi kesalahan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-6xl mb-4">🌟</p>
          <h1 className="text-3xl font-black text-white">Habit Tracker</h1>
          <p className="text-white/40 mt-2">Masukkan kode keluarga untuk membuka dashboard</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            ref={inputRef}
            type="text"
            value={code}
            onChange={e => { setCode(e.target.value); setError('') }}
            placeholder="Kode keluarga"
            autoFocus
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="w-full px-5 py-4 rounded-2xl bg-white/10 border border-white/20 text-white text-center text-xl font-mono tracking-widest placeholder:text-white/20 focus:outline-none focus:border-white/50"
          />

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={!code.trim() || loading}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
              code.trim() && !loading
                ? 'bg-white text-gray-900 active:scale-95'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            {loading ? 'Memeriksa...' : 'Buka Dashboard →'}
          </button>
        </form>

        <p className="text-white/20 text-sm text-center mt-8">
          Belum punya kode?{' '}
          <a href="/sign-up" className="text-white/40 underline">Daftar di sini</a>
        </p>
      </div>
    </div>
  )
}
