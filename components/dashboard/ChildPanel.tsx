import { HabitRow } from './HabitRow'
import { HourglassWidget } from './HourglassWidget'
import type { TodayData } from '@/lib/types'
import type { HourglassState } from '@/lib/hourglass'

const SCHEDULE_LABELS: Record<string, string> = {
  morning: '☀️ Pagi',
  afternoon: '🌤️ Siang & Sore',
  evening: '🌙 Malam',
}

interface ChildPanelProps {
  data: TodayData
  hourglass: HourglassState | null
}

export function ChildPanel({ data, hourglass }: ChildPanelProps) {
  const { child, habits, totalTickets } = data
  const allHabits = [...habits.morning, ...habits.afternoon, ...habits.evening]
  const doneCount = allHabits.filter((h) => h.completedAt).length
  const totalCount = allHabits.length
  const allDone = totalCount > 0 && doneCount === totalCount
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  return (
    <div className={`flex flex-col h-full rounded-3xl p-6 border-2 transition-all duration-700 ${allDone ? 'border-green-500 bg-green-950/40' : 'border-white/10 bg-white/5'}`}>
      {/* Header anak */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-4">
          <span className="text-6xl leading-none">{child.avatarUrl ?? '🐶'}</span>
          <div>
            <h2 className="text-4xl font-bold text-white">{child.name}</h2>
            <p className="text-white/50 text-lg mt-0.5">{child.age} tahun</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Hourglass ambient — tampil di pojok kanan atas panel jika aktif */}
          {hourglass && !hourglass.isFinished && (
            <HourglassWidget state={hourglass} />
          )}
          <div className="text-right">
            <p className="text-5xl font-black text-amber-400">{totalTickets}</p>
            <p className="text-white/40 text-sm">tiket 🎫</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex justify-between text-sm text-white/40 mb-1.5">
          <span>{doneCount} dari {totalCount} selesai</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-400 rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Habit list per schedule */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
        {doneCount === 0 && (
          <p className="text-white/20 text-base text-center py-6">Belum ada yang selesai...</p>
        )}
        {(['morning', 'afternoon', 'evening'] as const).map((schedule) => {
          const done = habits[schedule].filter((h) => h.completedAt)
          if (done.length === 0) return null
          return (
            <div key={schedule}>
              <p className="text-white/30 text-sm font-semibold uppercase tracking-widest mb-2 px-1">
                {SCHEDULE_LABELS[schedule]}
              </p>
              <div className="flex flex-col gap-1.5">
                {done.map((habit) => (
                  <HabitRow key={habit.id} habit={habit} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {allDone && (
        <div className="mt-4 text-center py-3 rounded-2xl bg-green-500/20 text-green-300 font-bold text-xl">
          🎉 Semua selesai!
        </div>
      )}
    </div>
  )
}
