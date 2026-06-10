'use client'

import { useEffect, useState } from 'react'
import type { HourglassState } from '@/lib/hourglass'

interface HourglassWidgetProps {
  state: HourglassState
}

export function HourglassWidget({ state: initialState }: HourglassWidgetProps) {
  const [progressPct, setProgressPct] = useState(initialState.progressPct)
  const [isPaused, setIsPaused] = useState(initialState.isPaused)

  // Tick setiap detik untuk animasi smooth
  useEffect(() => {
    setProgressPct(initialState.progressPct)
    setIsPaused(initialState.isPaused)
    if (initialState.isPaused || initialState.isFinished) return

    const interval = setInterval(() => {
      setProgressPct((prev) => Math.min(100, prev + (100 / initialState.durationS)))
    }, 1000)

    return () => clearInterval(interval)
  }, [initialState])

  // Warna pasir: hijau → amber → merah saat hampir habis
  const sandColor = progressPct < 60
    ? '#86efac' // green-300
    : progressPct < 85
    ? '#fcd34d' // amber-300
    : '#f87171' // red-400

  // Pasir atas: mengecil seiring waktu
  const topSandHeight = Math.max(0, (1 - progressPct / 100) * 52)
  // Pasir bawah: membesar seiring waktu
  const bottomSandHeight = Math.max(0, (progressPct / 100) * 52)

  return (
    <div className={`flex flex-col items-center gap-2 ${isPaused ? 'opacity-50' : ''}`}>
      <svg
        width="80"
        height="130"
        viewBox="0 0 80 130"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={isPaused ? '' : 'drop-shadow-lg'}
      >
        {/* Frame luar hourglass */}
        <path
          d="M10 8 L70 8 L70 12 L45 58 L45 72 L70 118 L70 122 L10 122 L10 118 L35 72 L35 58 L10 12 Z"
          fill="rgba(255,255,255,0.08)"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="2"
        />

        {/* Pasir atas — mengecil dari bawah */}
        {topSandHeight > 0 && (
          <clipPath id="top-clip">
            <rect x="10" y="8" width="60" height="54" />
          </clipPath>
        )}
        {topSandHeight > 0 && (
          <rect
            x="10"
            y={62 - topSandHeight}
            width="60"
            height={topSandHeight}
            fill={sandColor}
            opacity="0.85"
            clipPath="url(#top-clip)"
            style={{ transition: 'height 1s linear, y 1s linear' }}
          />
        )}

        {/* Titik pasir jatuh di tengah (leher) */}
        {!isPaused && progressPct < 99 && (
          <circle cx="40" cy="67" r="2" fill={sandColor} opacity="0.9">
            <animate attributeName="cy" values="64;70;64" dur="0.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9;0.3;0.9" dur="0.8s" repeatCount="indefinite" />
          </circle>
        )}

        {/* Pasir bawah — membesar dari atas */}
        {bottomSandHeight > 0 && (
          <clipPath id="bottom-clip">
            <rect x="10" y="68" width="60" height="54" />
          </clipPath>
        )}
        {bottomSandHeight > 0 && (
          <rect
            x="10"
            y={122 - bottomSandHeight}
            width="60"
            height={bottomSandHeight}
            fill={sandColor}
            opacity="0.7"
            clipPath="url(#bottom-clip)"
            style={{ transition: 'height 1s linear, y 1s linear' }}
          />
        )}

        {/* Garis leher tengah */}
        <line x1="35" y1="58" x2="45" y2="58" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        <line x1="35" y1="72" x2="45" y2="72" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      </svg>

      {isPaused && (
        <span className="text-white/40 text-xs font-medium tracking-wider uppercase">Jeda</span>
      )}
    </div>
  )
}
