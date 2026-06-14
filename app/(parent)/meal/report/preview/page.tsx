'use client'

import { useMemo } from 'react'
import { buildReport, trendArrow, trendColor, type ReportData } from '@/lib/report'
import { generateDummyJournals } from '@/lib/dummy-report'

const EATEN_WITH_LABEL: Record<string, string> = {
  parents: 'Orang tua',
  grandparents: 'Nenek/Kakek',
  caregiver: 'Pengasuh',
  school: 'Di sekolah',
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

const DUMMY_CHILD = { id: 'dummy', name: 'Farhan', age: 3 }
const YEAR = 2026
const MONTH = 5 // Mei

function ProgressBar({ pct, color = 'bg-blue-500' }: { pct: number; color?: string }) {
  return (
    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden print:border print:border-gray-200">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{title}</p>
      {children}
    </section>
  )
}

export default function ReportPreviewPage() {
  const report = useMemo<ReportData>(() => {
    const journals = generateDummyJournals(DUMMY_CHILD.id, YEAR, MONTH)
    const from = `${YEAR}-${String(MONTH).padStart(2, '0')}-01`
    const to = `${YEAR}-${String(MONTH).padStart(2, '0')}-31`
    return buildReport(DUMMY_CHILD, journals, from, to)
  }, [])

  const { overall, half1, half2, hasTrend, topEatenWith, behaviorFrequency, mealTypeBreakdown, journals } = report

  return (
    <div className="max-w-lg mx-auto">

      {/* Toolbar — hanya layar */}
      <div className="flex items-center justify-between mb-5 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Preview Report</h2>
          <p className="text-xs text-gray-400">Data dummy — tidak tersimpan di database</p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-2xl active:scale-95"
        >
          🖨️ Cetak / PDF
        </button>
      </div>

      {/* ── KOP LAPORAN ── */}
      <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 mb-5 print:rounded-none print:border-0 print:border-b-2 print:border-gray-800 print:pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 print:text-2xl">Laporan Perilaku Makan</h1>
            <p className="text-sm text-gray-600 mt-0.5">
              <span className="font-semibold">{DUMMY_CHILD.name}</span> · {DUMMY_CHILD.age} tahun
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              Periode: 1 Mei 2026 – 31 Mei 2026
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Disiapkan oleh</p>
            <p className="text-sm font-semibold text-gray-700">Orang Tua</p>
            <p className="text-xs text-gray-400 mt-1">Dicetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 print:border-gray-300">
          <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2 print:bg-transparent print:text-gray-500 print:px-0">
            ⚠️ Ini adalah contoh laporan dengan data simulasi. Laporan nyata akan menggunakan data catatan orang tua.
          </p>
        </div>
      </div>

      {/* ── RINGKASAN ── */}
      <Section title="Ringkasan Bulan Ini">
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { label: 'Total sesi tercatat', value: String(overall.total), sub: 'selama 1 bulan' },
            { label: 'Porsi baik (½ atau habis)', value: `${overall.goodPortionPct}%`, sub: `${overall.goodPortion} dari ${overall.total} sesi` },
            { label: 'Sesi dengan behavior sulit', value: `${overall.negativeSessionsPct}%`, sub: `${overall.negativeSessions} sesi` },
            { label: 'Rata-rata durasi makan', value: overall.avgDuration ? `${overall.avgDuration} mnt` : '—', sub: 'per sesi' },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 px-4 py-3 text-center print:border print:border-gray-300">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── TREND ── */}
      <Section title="Trend (Paruh Pertama vs Paruh Kedua)">
        {!hasTrend ? (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
            <p className="text-sm text-amber-700">Data belum cukup untuk melihat trend.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden print:border-gray-300">
            <div className="grid grid-cols-4 px-4 py-2.5 bg-gray-50 border-b border-gray-100 print:bg-gray-100">
              <p className="text-xs font-bold text-gray-500 col-span-2">Indikator</p>
              <p className="text-xs font-bold text-gray-500 text-center">1–15 Mei</p>
              <p className="text-xs font-bold text-gray-500 text-center">16–31 Mei</p>
            </div>
            {[
              {
                label: 'Porsi baik',
                v1: `${half1.goodPortionPct}%`,
                v2: `${half2.goodPortionPct}%`,
                arrow: trendArrow(half1.goodPortionPct, half2.goodPortionPct),
              },
              {
                label: 'Behavior sulit',
                v1: `${half1.negativeSessionsPct}%`,
                v2: `${half2.negativeSessionsPct}%`,
                arrow: trendArrow(half1.negativeSessionsPct, half2.negativeSessionsPct, false),
              },
              ...(half1.avgDuration && half2.avgDuration ? [{
                label: 'Avg durasi',
                v1: `${half1.avgDuration} mnt`,
                v2: `${half2.avgDuration} mnt`,
                arrow: trendArrow(half1.avgDuration, half2.avgDuration, false),
              }] : []),
            ].map(({ label, v1, v2, arrow }, i, arr) => (
              <div key={label} className={`grid grid-cols-4 items-center px-4 py-3 ${i < arr.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <p className="text-sm text-gray-700 col-span-2">{label}</p>
                <p className="text-sm font-semibold text-gray-600 text-center">{v1}</p>
                <p className={`text-sm font-bold text-center ${trendColor(arrow)}`}>{v2} {arrow}</p>
              </div>
            ))}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-400">↑ membaik &nbsp;·&nbsp; ↓ memburuk &nbsp;·&nbsp; → tidak berubah signifikan</p>
            </div>
          </div>
        )}
      </Section>

      {/* ── POLA CAREGIVER ── */}
      <Section title="Pola per Pendamping Makan">
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-4 space-y-4 print:border-gray-300">
          {topEatenWith.map(({ key, goodPct, total }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm font-semibold text-gray-700">{EATEN_WITH_LABEL[key] ?? key}</p>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-800">{goodPct}%</span>
                  <span className="text-xs text-gray-400 ml-1.5">porsi baik · {total} sesi</span>
                </div>
              </div>
              <ProgressBar
                pct={goodPct}
                color={goodPct >= 65 ? 'bg-green-400' : goodPct >= 45 ? 'bg-amber-400' : 'bg-red-400'}
              />
            </div>
          ))}
          <p className="text-xs text-gray-400 pt-1 border-t border-gray-50">
            % sesi dengan porsi ½ atau habis per pendamping makan
          </p>
        </div>
      </Section>

      {/* ── POLA JENIS MAKAN ── */}
      <Section title="Pola per Waktu Makan">
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-4 space-y-4 print:border-gray-300">
          {mealTypeBreakdown.map(({ type, goodPct, total }) => (
            <div key={type}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm font-semibold text-gray-700">{MEAL_TYPE_LABEL[type] ?? type}</p>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-800">{goodPct}%</span>
                  <span className="text-xs text-gray-400 ml-1.5">porsi baik · {total} sesi</span>
                </div>
              </div>
              <ProgressBar
                pct={goodPct}
                color={goodPct >= 65 ? 'bg-green-400' : goodPct >= 45 ? 'bg-amber-400' : 'bg-red-400'}
              />
            </div>
          ))}
          <p className="text-xs text-gray-400 pt-1 border-t border-gray-50">
            % sesi dengan porsi ½ atau habis per waktu makan
          </p>
        </div>
      </Section>

      {/* ── BEHAVIOR FREQUENCY ── */}
      <Section title="Behavior yang Paling Sering Muncul">
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-4 space-y-4 print:border-gray-300">
          {behaviorFrequency.slice(0, 7).map(({ behavior, count }) => {
            const max = behaviorFrequency[0].count
            const isNeg = ['fussy', 'running', 'gagging', 'vomiting', 'spitting', 'negotiating'].includes(behavior)
            return (
              <div key={behavior}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isNeg ? 'bg-orange-400' : 'bg-green-400'}`} />
                    <p className="text-sm font-semibold text-gray-700">{BEHAVIOR_LABEL[behavior] ?? behavior}</p>
                  </div>
                  <span className="text-sm font-bold text-gray-800">{count}×</span>
                </div>
                <ProgressBar pct={(count / max) * 100} color={isNeg ? 'bg-orange-400' : 'bg-green-400'} />
              </div>
            )
          })}
          <p className="text-xs text-gray-400 pt-1 border-t border-gray-50">
            <span className="inline-block w-2 h-2 rounded-full bg-orange-400 mr-1" />behavior sulit &nbsp;·&nbsp;
            <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-1" />behavior positif
          </p>
        </div>
      </Section>

      {/* ── LOG DETAIL ── */}
      <Section title={`Log Detail (${journals.length} sesi)`}>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden print:border-gray-300">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 print:bg-gray-100">
                  {['Tanggal', 'Waktu', 'Sesi', 'Porsi', 'Sama', 'Behavior akhir', 'Makanan'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-gray-500 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...journals].reverse().map(j => (
                  <tr key={j.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 print:hover:bg-transparent">
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                      {new Date(j.date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-3 py-2 text-gray-500">{j.startTime?.slice(0, 5) ?? '—'}</td>
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{MEAL_TYPE_LABEL[j.mealType] ?? j.mealType}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`font-semibold ${
                        j.portion === 'all' ? 'text-green-600' :
                        j.portion === 'half' ? 'text-blue-600' :
                        j.portion === 'little' ? 'text-amber-600' : 'text-red-500'
                      }`}>
                        {PORTION_LABEL[j.portion] ?? j.portion}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                      {EATEN_WITH_LABEL[j.eatenWith] ?? j.eatenWith}
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {j.behaviorEnd.map(b => BEHAVIOR_LABEL[b] ?? b).join(', ') || '—'}
                    </td>
                    <td className="px-3 py-2 text-gray-500 max-w-[140px] truncate">{j.foodOffered ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* ── FOOTER ── */}
      <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-400 space-y-1">
        <p>Laporan ini dibuat dari catatan harian orang tua selama periode yang tertera.</p>
        <p>Data bersifat observasional dan tidak menggantikan pemeriksaan klinis oleh tenaga medis.</p>
        <p className="print:hidden text-amber-500">⚠️ Ini adalah data simulasi untuk demonstrasi.</p>
      </div>
    </div>
  )
}
