import { pgTable, uuid, text, integer, boolean, timestamp, date } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const children = pgTable('children', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  age: integer('age').notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const habits = pgTable('habits', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id').notNull().references(() => children.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  schedule: text('schedule').notNull(), // 'morning' | 'afternoon' | 'evening'
  ticketsValue: integer('tickets_value').notNull().default(1),
  isActive: boolean('is_active').notNull().default(true),
  isMeal: boolean('is_meal').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const habitLogs = pgTable('habit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  habitId: uuid('habit_id').notNull().references(() => habits.id, { onDelete: 'cascade' }),
  childId: uuid('child_id').notNull().references(() => children.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  ticketsEarned: integer('tickets_earned').notNull(),
})

export const mealJournals = pgTable('meal_journals', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id').notNull().references(() => children.id, { onDelete: 'cascade' }),
  habitLogId: uuid('habit_log_id').references(() => habitLogs.id, { onDelete: 'set null' }),
  date: date('date').notNull(),
  mealType: text('meal_type').notNull(), // 'breakfast' | 'lunch' | 'dinner'
  portion: text('portion').notNull(),    // 'little' | 'half' | 'all'
  mood: text('mood').notNull(),          // 'focused' | 'distracted' | 'fussy'
  foodDescription: text('food_description'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const ticketTransactions = pgTable('ticket_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id').notNull().references(() => children.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'earned' | 'redeemed'
  amount: integer('amount').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const rewards = pgTable('rewards', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id').references(() => children.id, { onDelete: 'cascade' }), // null = semua anak
  name: text('name').notNull(),
  icon: text('icon').notNull().default('🎁'),
  ticketCost: integer('ticket_cost').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const hourglassSessions = pgTable('hourglass_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id').notNull().references(() => children.id, { onDelete: 'cascade' }),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  durationS: integer('duration_s').notNull().default(1800),
  pausedAt: timestamp('paused_at', { withTimezone: true }),
  totalPausedS: integer('total_paused_s').notNull().default(0),
  endedAt: timestamp('ended_at', { withTimezone: true }),
})

// Relations
export const childrenRelations = relations(children, ({ many }) => ({
  habits: many(habits),
  habitLogs: many(habitLogs),
  mealJournals: many(mealJournals),
  ticketTransactions: many(ticketTransactions),
  rewards: many(rewards),
  hourglassSessions: many(hourglassSessions),
}))

export const habitsRelations = relations(habits, ({ one, many }) => ({
  child: one(children, { fields: [habits.childId], references: [children.id] }),
  habitLogs: many(habitLogs),
}))

export const habitLogsRelations = relations(habitLogs, ({ one }) => ({
  habit: one(habits, { fields: [habitLogs.habitId], references: [habits.id] }),
  child: one(children, { fields: [habitLogs.childId], references: [children.id] }),
  mealJournal: one(mealJournals, { fields: [habitLogs.id], references: [mealJournals.habitLogId] }),
}))
