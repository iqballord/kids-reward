'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { calcAge } from '@/lib/date'

const AVATARS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🐮', '🐸']

type ChildInput = { name: string; dob: string; avatarUrl: string }

export default function OnboardingPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()

  // Kalau belum login, kirim ke sign-in
  // Kalau sudah punya family, kirim ke /app
  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) { router.replace('/sign-in'); return }

    fetch('/api/family/me')
      .then(r => r.json())
      .then(data => { if (data.familyId) router.replace('/app') })
      .catch(() => {})
  }, [isLoaded, isSignedIn, router])
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [familyName, setFamilyName] = useState('')
  const [childrenData, setChildrenData] = useState<ChildInput[]>([
    { name: '', dob: '', avatarUrl: '🐶' },
  ])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [familySlug, setFamilySlug] = useState('')

  function addChild() {
    if (childrenData.length >= 4) return
    setChildrenData(prev => [...prev, { name: '', dob: '', avatarUrl: AVATARS[prev.length] }])
  }

  function updateChild(index: number, field: keyof ChildInput, value: string) {
    setChildrenData(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c))
  }

  function removeChild(index: number) {
    if (childrenData.length <= 1) return
    setChildrenData(prev => prev.filter((_, i) => i !== index))
  }

  const step1Valid = familyName.trim().length >= 2
  const step2Valid = childrenData.every(c => c.name.trim() && !!c.dob)

  async function handleSubmit() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyName,
          childrenData: childrenData.map(c => ({
            name: c.name,
            dateOfBirth: c.dob,
            avatarUrl: c.avatarUrl,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Terjadi kesalahan'); return }
      setFamilySlug(data.familySlug)
      setStep(3)
    } finally {
      setSaving(false)
    }
  }

  const dashboardUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/dashboard/${familySlug}`
    : `/dashboard/${familySlug}`

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-5xl mb-3">🌟</p>
          <h1 className="text-2xl font-bold text-gray-900">Setup Keluarga</h1>
          {step < 3 && (
            <div className="flex justify-center gap-2 mt-4">
              {[1, 2].map(s => (
                <div key={s} className={`h-1.5 w-12 rounded-full transition-all ${step >= s ? 'bg-blue-500' : 'bg-gray-200'}`} />
              ))}
            </div>
          )}
        </div>

        {/* Step 1: Nama keluarga */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Nama keluarga kamu</p>
              <input
                type="text"
                value={familyName}
                onChange={e => setFamilyName(e.target.value)}
                placeholder="cth: Keluarga Iqbal"
                autoFocus
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-gray-800 focus:outline-none focus:border-blue-400"
              />
              <p className="text-xs text-gray-400 mt-1.5">Ini akan tampil di TV Dashboard</p>
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!step1Valid}
              className={`w-full py-3.5 rounded-2xl font-semibold text-base transition-all ${
                step1Valid ? 'bg-blue-500 text-white active:scale-95' : 'bg-gray-100 text-gray-300'
              }`}
            >
              Lanjut →
            </button>
          </div>
        )}

        {/* Step 2: Data anak */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-gray-700">Data anak</p>

            {childrenData.map((child, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-600">Anak {i + 1}</p>
                  {childrenData.length > 1 && (
                    <button onClick={() => removeChild(i)} className="text-xs text-red-400">Hapus</button>
                  )}
                </div>

                {/* Avatar */}
                <div className="flex flex-wrap gap-2">
                  {AVATARS.map(a => (
                    <button
                      key={a}
                      onClick={() => updateChild(i, 'avatarUrl', a)}
                      className={`text-2xl p-1.5 rounded-xl border-2 transition-all ${
                        child.avatarUrl === a ? 'border-blue-400 bg-blue-50' : 'border-transparent'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={child.name}
                  onChange={e => updateChild(i, 'name', e.target.value)}
                  placeholder="Nama anak"
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
                />
                <div>
                  <p className="text-xs text-gray-400 mb-1">Tanggal lahir</p>
                  <input
                    type="date"
                    value={child.dob}
                    onChange={e => updateChild(i, 'dob', e.target.value)}
                    max={new Date().toISOString().slice(0, 10)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
                  />
                  {child.dob && (
                    <p className="text-xs text-gray-400 mt-1">{calcAge(child.dob)} tahun</p>
                  )}
                </div>
              </div>
            ))}

            {childrenData.length < 4 && (
              <button
                onClick={addChild}
                className="w-full py-2.5 rounded-2xl border-2 border-dashed border-gray-200 text-sm text-gray-400 font-medium"
              >
                + Tambah anak lain
              </button>
            )}

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-500 font-semibold"
              >
                ← Kembali
              </button>
              <button
                onClick={handleSubmit}
                disabled={!step2Valid || saving}
                className={`flex-1 py-3 rounded-2xl font-semibold transition-all ${
                  step2Valid && !saving ? 'bg-blue-500 text-white active:scale-95' : 'bg-gray-100 text-gray-300'
                }`}
              >
                {saving ? 'Menyimpan...' : 'Selesai ✓'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Done — tampil kode TV Dashboard */}
        {step === 3 && (
          <div className="space-y-5 text-center">
            <div>
              <p className="text-5xl mb-3">🎉</p>
              <h2 className="text-xl font-bold text-gray-900">Keluarga siap!</h2>
              <p className="text-sm text-gray-500 mt-1">Satu langkah lagi — setup TV Dashboard</p>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 text-left">
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
                Kode TV Dashboard
              </p>
              <p className="text-3xl font-black text-blue-600 tracking-widest mb-1">{familySlug}</p>
              <p className="text-xs text-blue-400">
                Buka TV → ketik <strong>habittracker.app/dashboard</strong> → masukkan kode ini
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-left">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Atau langsung bookmark URL ini di TV
              </p>
              <p className="text-sm font-mono text-gray-600 break-all">{dashboardUrl}</p>
            </div>

            <button
              onClick={() => router.replace('/app')}
              className="w-full py-3.5 rounded-2xl bg-blue-500 text-white font-semibold text-base active:scale-95"
            >
              Mulai tracking →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
