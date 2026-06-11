export type Schedule = 'morning' | 'afternoon' | 'evening'

export interface Child {
  id: string
  name: string
  age: number
  avatarUrl: string | null
  createdAt?: string | Date
}

export interface Habit {
  id: string
  childId: string
  name: string
  icon: string
  schedule: Schedule
  ticketsValue: number
  isActive: boolean
  isMeal: boolean
  showOnDashboard: boolean
  sortOrder: number
}

export interface HabitWithStatus extends Habit {
  logId: string | null
  completedAt: string | null
  ticketsEarned: number | null
}

export interface TodayData {
  child: Child
  totalTickets: number
  habits: {
    morning: HabitWithStatus[]
    afternoon: HabitWithStatus[]
    evening: HabitWithStatus[]
  }
}

export interface CompleteHabitResponse {
  habitLogId: string
  ticketsEarned: number
  totalTickets: number
  showJournal: boolean
  allHabitsDone: boolean
}
