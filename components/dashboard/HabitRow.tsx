import type { HabitWithStatus } from '@/lib/types'

export function HabitRow({ habit }: { habit: HabitWithStatus }) {
  const done = !!habit.completedAt
  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-500 ${done ? 'bg-green-900/30' : 'bg-white/5'}`}>
      <span className="text-2xl leading-none">{habit.icon}</span>
      <span className={`flex-1 text-xl font-semibold ${done ? 'text-green-300 line-through decoration-green-500' : 'text-white'}`}>
        {habit.name}
      </span>
      {done
        ? <span className="text-green-400 text-2xl">✓</span>
        : <span className="text-amber-400 text-base font-bold">🎫{habit.ticketsValue}</span>
      }
    </div>
  )
}
