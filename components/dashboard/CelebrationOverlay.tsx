'use client'

import { useEffect, useState } from 'react'

interface Props {
  childName: string
  onDone: () => void
}

const EMOJIS = ['🎉', '⭐', '🌟', '✨', '🎊', '🏆', '🎈', '💫']

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a)
}

type Particle = {
  id: number
  emoji: string
  left: number
  delay: number
  duration: number
  size: number
}

export function CelebrationOverlay({ childName, onDone }: Props) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const p: Particle[] = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      left: randomBetween(5, 95),
      delay: randomBetween(0, 1.5),
      duration: randomBetween(2.5, 4.5),
      size: randomBetween(2, 5),
    }))
    setParticles(p)

    // Auto dismiss setelah 6 detik
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 500)
    }, 6000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.95) 100%)' }}
      onClick={() => { setVisible(false); setTimeout(onDone, 500) }}
    >
      {/* Partikel */}
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute top-0 pointer-events-none animate-bounce"
          style={{
            left: `${p.left}%`,
            fontSize: `${p.size}rem`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            animationTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        >
          {p.emoji}
        </div>
      ))}

      {/* Pesan utama */}
      <div className="text-center px-12 select-none">
        <p className="text-8xl mb-6 animate-bounce">🏆</p>
        <h1 className="text-6xl font-black text-white mb-4 leading-tight">
          Hebat, {childName}!
        </h1>
        <p className="text-3xl text-green-400 font-bold mb-3">
          Semua habit selesai hari ini!
        </p>
        <p className="text-xl text-white/40 mt-6">
          Tap untuk melanjutkan
        </p>
      </div>
    </div>
  )
}
