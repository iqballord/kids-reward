'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { buildReport, trendArrow, trendColor, type ReportData } from '@/lib/report'
import type { Child } from '@/lib/types'
import type { MealJournalData } from '@/components/parent/MealLogForm'

type MealJournal = MealJournalData & { createdAt: string }

const EATEN_WITH_LABEL: Record<string, string> = {
  parents: 'Orang tua',
  grandparents: 'Nenek/Kakek',
  caregiver: 'Pengasuh',
  school: 'Di sekolah',
  other: 'Lain-lain',
}

const BEHAVIOR_LABEL: Record<string, string> = {
  focused: 'Fokus',
  distracted: 'Distraksi',
  fussy: 'Rewel',
  spitting: 'Meludah',
  gagging: 'Gag',
  vomiting: 'Muntah',
  running: 'Lari-lari',
  negotiating: 'Negosiasi',
}

const MEAL_TYPE_LABEL: Record<string, string> = {
  breakfast: 'Sarapan',
  lunch: 'Makan siang',
  dinner: 'Makan malam',
  snack: 'Snack',
}

const PORTION_LABEL: Record<string, string> = {
  none: 'Tidak mau',
  little: 'Sedikit',
  half: 'Setengah',
  all: 'Habis',
}

function formatDateID(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function fromToDefault() {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 29)
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  }
}

function ProgressBar({ pct, color = 'bg-blue-500' }: { pct: number; color?: string }) {
  return (
    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 text-center">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function ReportPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [childId, setChildId] = useState('')
  const [{ from, to }, setRange] = useState(fromToDefault)
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [showTable, setShowTable] = useState(false)
  const [downloading, setDownloading] = useState<'meal' | 'habit' | null>(null)

  async function handleExport(type: 'meal' | 'habit') {
    setDownloading(type)
    try {
      const url = `/api/export?child_id=${childId}&from=${from}&to=${to}&type=${type}`
      const res = await fetch(url)
      const blob = await res.blob()
      const filename = res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] ?? `export-${type}.csv`
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      a.click()
      URL.revokeObjectURL(a.href)
    } finally {
      setDownloading(null)
    }
  }

  useEffect(() => {
    fetch('/api/children')
      .then(r => r.json())
      .then((data: Child[]) => {
        setChildren(data)
        if (data.length > 0) setChildId(data[0].id)
      })
  }, [])

  const fetchReport = useCallback(async () => {
    if (!childId) return
    setLoading(true)
    const res = await fetch(`/api/meal-journal?child_id=${childId}&from=${from}&to=${to}`)
    if (res.ok) {
      const journals: MealJournal[] = await res.json()
      const child = children.find(c => c.id === childId)!
      setReport(buildReport(child, journals, from, to))
    }
    setLoading(false)
  }, [childId, from, to, children])

  useEffect(() => {
    if (childId && children.length > 0) fetchReport()
  }, [childId, children, fetchReport])

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 print:hidden">
        <h2 className="text-lg font-bold text-gray-900">Doctor Report</h2>
        <div className="flex gap-2">
          <Link
            href="/meal/report/preview"
            className="px-3 py-2 bg-gray-100 text-gray-600 text-sm font-semibold rounded-2xl"
          >
            👁️ Preview
          </Link>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-2xl active:scale-95 transition-transform"
          >
            🖨️ Cetak / PDF
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-3 mb-6 print:hidden">
        {children.length > 1 && (
          <div className="flex gap-2">
            {children.map(c => (
              <button
                key={c.id}
                onClick={() => setChildId(c.id)}
                className={`flex-1 py-2 rounded-2xl text-sm font-semibold border-2 transition-all ${
                  childId === c.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-100 bg-gray-50 text-gray-500'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <div className="flex-1">
            <p className="text-xs text-gray-400 mb-1">Dari</p>
            <input
              type="date"
              value={from}
              onChange={e => setRange(r => ({ ...r, from: e.target.value }))}
              className="w-full px-3 py-2 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-400 mb-1">Sampai</p>
            <input
              type="date"
              value={to}
              onChange={e => setRange(r => ({ ...r, to: e.target.value }))}
              className="w-full px-3 py-2 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>

        {/* Export buttons */}
        {childId && (
          <div className="bg-gray-50 rounded-2xl px-4 py-3">
            <p className="text-xs font-semibold text-gray-400 mb-2">Export CSV</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('meal')}
                disabled={!!downloading}
                className="flex-1 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {downloading === 'meal' ? 'Mengunduh...' : '⬇️ Jurnal Makan'}
              </button>
              <button
                onClick={() => handleExport('habit')}
                disabled={!!downloading}
                className="flex-1 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {downloading === 'habit' ? 'Mengunduh...' : '⬇️ Habit History'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Menggunakan periode yang dipilih di atas</p>
          </div>
        )}
      </div>

      {loading && (
        <p className="text-sm text-gray-400 text-center py-8">Memuat laporan...</p>
      )}

      {!loading && report && (
        <div className="space-y-5" id="report-content">

          {/* ── PRINT HEADER ── */}
          <div className="hidden print:block mb-6">
            <h1 className="text-xl font-bold text-gray-900">Laporan Perilaku Makan</h1>
            <p className="text-sm text-gray-600 mt-1">
              {report.child.name} · {report.child.age} tahun
            </p>
            <p className="text-sm text-gray-500">
              Periode: {formatDateID(report.from)} – {formatDateID(report.to)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Disiapkan oleh orang tua via Habit Tracker App</p>
          </div>

          {/* ── RINGKASAN ── */}
          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Ringkasan {formatDateID(report.from)} – {formatDateID(report.to)}
            </p>

            {report.overall.total === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 px-4 py-8 text-center">
                <p className="text-gray-400 text-sm">Tidak ada data di periode ini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <StatCard
                  label="Total sesi tercatat"
                  value={String(report.overall.total)}
                />
                <StatCard
                  label="Porsi baik (½ atau habis)"
                  value={`${report.overall.goodPortionPct}%`}
                  sub={`${report.overall.goodPortion} dari ${report.overall.total} sesi`}
                />
                <StatCard
                  label="Sesi dengan behavior sulit"
                  value={`${report.overall.negativeSessionsPct}%`}
                  sub={`${report.overall.negativeSessions} sesi`}
                />
                <StatCard
                  label="Rata-rata durasi makan"
                  value={report.overall.avgDuration ? `${report.overall.avgDuration} mnt` : '—'}
                />
              </div>
            )}
          </section>

          {/* ── TREND ── */}
          {report.overall.total > 0 && (
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Trend
              </p>

              {!report.hasTrend ? (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
                  <p className="text-sm text-amber-700">
                    Butuh minimal 2 minggu data untuk melihat trend. Lanjutkan mencatat ya!
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  {/* Header row */}
                  <div className="grid grid-cols-4 px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <p className="text-xs text-gray-400 col-span-2">Indikator</p>
                    <p className="text-xs text-gray-400 text-center">½ bulan 1</p>
                    <p className="text-xs text-gray-400 text-center">½ bulan 2</p>
                  </div>

                  {/* Porsi baik */}
                  {(() => {
                    const arrow = trendArrow(report.half1.goodPortionPct, report.half2.goodPortionPct)
                    return (
                      <div className="grid grid-cols-4 items-center px-4 py-3 border-b border-gray-50">
                        <p className="text-sm text-gray-700 col-span-2">Porsi baik</p>
                        <p className="text-sm font-semibold text-gray-800 text-center">{report.half1.goodPortionPct}%</p>
                        <p className={`text-sm font-bold text-center ${trendColor(arrow)}`}>
                          {report.half2.goodPortionPct}% {arrow}
                        </p>
                      </div>
                    )
                  })()}

                  {/* Behavior sulit */}
                  {(() => {
                    const arrow = trendArrow(report.half1.negativeSessionsPct, report.half2.negativeSessionsPct, false)
                    return (
                      <div className="grid grid-cols-4 items-center px-4 py-3 border-b border-gray-50">
                        <p className="text-sm text-gray-700 col-span-2">Behavior sulit</p>
                        <p className="text-sm font-semibold text-gray-800 text-center">{report.half1.negativeSessionsPct}%</p>
                        <p className={`text-sm font-bold text-center ${trendColor(arrow)}`}>
                          {report.half2.negativeSessionsPct}% {arrow}
                        </p>
                      </div>
                    )
                  })()}

                  {/* Durasi */}
                  {report.half1.avgDuration && report.half2.avgDuration && (() => {
                    const arrow = trendArrow(report.half1.avgDuration, report.half2.avgDuration, false)
                    return (
                      <div className="grid grid-cols-4 items-center px-4 py-3">
                        <p className="text-sm text-gray-700 col-span-2">Rata-rata durasi</p>
                        <p className="text-sm font-semibold text-gray-800 text-center">{report.half1.avgDuration} mnt</p>
                        <p className={`text-sm font-bold text-center ${trendColor(arrow)}`}>
                          {report.half2.avgDuration} mnt {arrow}
                        </p>
                      </div>
                    )
                  })()}
                </div>
              )}
            </section>
          )}

          {/* ── PATTERN CAREGIVER ── */}
          {report.topEatenWith.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Pola per Pendamping Makan
              </p>
              <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 space-y-3">
                {report.topEatenWith.map(({ key, goodPct, total }) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-700">
                        {EATEN_WITH_LABEL[key] ?? key}
                      </p>
                      <p className="text-sm font-bold text-gray-800">{goodPct}%
                        <span className="text-xs font-normal text-gray-400 ml-1">({total}x)</span>
                      </p>
                    </div>
                    <ProgressBar
                      pct={goodPct}
                      color={goodPct >= 60 ? 'bg-green-400' : goodPct >= 40 ? 'bg-amber-400' : 'bg-red-400'}
                    />
                  </div>
                ))}
                <p className="text-xs text-gray-400 pt-1">% sesi dengan porsi ½ atau habis</p>
              </div>
            </section>
          )}

          {/* ── BEHAVIOR FREQUENCY ── */}
          {report.behaviorFrequency.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Behavior yang Paling Sering Muncul
              </p>
              <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 space-y-3">
                {report.behaviorFrequency.slice(0, 6).map(({ behavior, count }) => {
                  const max = report.behaviorFrequency[0].count
                  const isNegative = ['fussy', 'running', 'gagging', 'vomiting', 'spitting', 'negotiating'].includes(behavior)
                  return (
                    <div key={behavior}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-700">
                          {BEHAVIOR_LABEL[behavior] ?? behavior}
                        </p>
                        <p className="text-sm font-bold text-gray-800">{count}x</p>
                      </div>
                      <ProgressBar
                        pct={(count / max) * 100}
                        color={isNegative ? 'bg-orange-400' : 'bg-green-400'}
                      />
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* ── MEAL TYPE BREAKDOWN ── */}
          {report.mealTypeBreakdown.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Pola per Jenis Makan
              </p>
              <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 space-y-3">
                {report.mealTypeBreakdown.map(({ type, goodPct, total }) => (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-700">
                        {MEAL_TYPE_LABEL[type] ?? type}
                      </p>
                      <p className="text-sm font-bold text-gray-800">{goodPct}%
                        <span className="text-xs font-normal text-gray-400 ml-1">({total}x)</span>
                      </p>
                    </div>
                    <ProgressBar
                      pct={goodPct}
                      color={goodPct >= 60 ? 'bg-green-400' : goodPct >= 40 ? 'bg-amber-400' : 'bg-red-400'}
                    />
                  </div>
                ))}
                <p className="text-xs text-gray-400 pt-1">% sesi dengan porsi ½ atau habis</p>
              </div>
            </section>
          )}

          {/* ── LOG DETAIL ── */}
          {report.journals.length > 0 && (
            <section>
              <button
                onClick={() => setShowTable(!showTable)}
                className="w-full flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 print:hidden"
              >
                <span>Log Detail ({report.journals.length} sesi)</span>
                <span>{showTable ? '▲' : '▼'}</span>
              </button>

              {/* Always visible on print */}
              <div className={showTable ? 'block' : 'hidden print:block'}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 hidden print:block">
                  Log Detail ({report.journals.length} sesi)
                </p>
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="px-3 py-2 text-left text-gray-400 font-semibold">Tanggal</th>
                          <th className="px-3 py-2 text-left text-gray-400 font-semibold">Sesi</th>
                          <th className="px-3 py-2 text-left text-gray-400 font-semibold">Porsi</th>
                          <th className="px-3 py-2 text-left text-gray-400 font-semibold">Sama</th>
                          <th className="px-3 py-2 text-left text-gray-400 font-semibold">Behavior akhir</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...report.journals].reverse().map(j => (
                          <tr key={j.id} className="border-b border-gray-50 last:border-0">
                            <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                              {new Date(j.date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                              {j.startTime && <span className="text-gray-400 ml-1">{j.startTime.slice(0, 5)}</span>}
                            </td>
                            <td className="px-3 py-2 text-gray-600">{MEAL_TYPE_LABEL[j.mealType] ?? j.mealType}</td>
                            <td className="px-3 py-2 text-gray-600">{PORTION_LABEL[j.portion] ?? j.portion}</td>
                            <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                              {EATEN_WITH_LABEL[j.eatenWith] ?? j.eatenWith}
                              {j.eatenWithOther ? ` (${j.eatenWithOther})` : ''}
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              {j.behaviorEnd.map(b => BEHAVIOR_LABEL[b] ?? b).join(', ') || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Print footer */}
          <div className="hidden print:block pt-4 border-t border-gray-200 text-xs text-gray-400">
            <p>Laporan ini dibuat dari catatan harian orang tua. Data bersifat observasional dan tidak menggantikan pemeriksaan klinis.</p>
          </div>
        </div>
      )}
    </div>
  )
}
