# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # start dev server
npm run build        # production build
npm run lint         # ESLint
npm run db:generate  # generate Drizzle migrations
npm run db:push      # push schema to DB (no migration file)
npm run db:studio    # open Drizzle Studio
npm run db:seed      # seed DB via lib/db/seed.ts
```

## Environment Variables

Required in `.env.local`:
- `DATABASE_URL` — Neon pooled connection (used in `lib/db/index.ts`)
- `DATABASE_URL_UNPOOLED` — Neon direct connection (used by `drizzle-kit`)
- `PUSHER_APP_ID`, `PUSHER_SECRET`, `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER` — real-time events
- Clerk vars: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, plus sign-in/sign-up URL vars

## Architecture

**Two distinct UIs:**
1. **Parent app** (`app/(parent)/app/`) — mobile-first, Clerk-authenticated. Bottom nav: Habits, History, Meal Log, Settings. Wrapped by `app/(parent)/layout.tsx`.
2. **TV Dashboard** (`app/dashboard/[slug]/`) — public, no auth. Accessed by family `slug` (8-char hex). Displays all children's habits and hourglass timers in a fullscreen dark UI.

**Auth model:** Clerk handles authentication. All authenticated routes use `lib/family.ts` — `requireFamilyContext()` / `withFamily()` — to resolve the Clerk user → `family_members` → `families` join. The family's UUID scopes all data. Routes under `/app/api/dashboard/*` and `/api/events/*` are public (TV can call them unauthenticated).

**Real-time:** Pusher is used for live updates. Server triggers events on channel `family-{familyId}` (e.g. `habit_completed`, `hourglass_started`). The TV dashboard subscribes and re-fetches data on each event.

**Database:** PostgreSQL on Neon via Drizzle ORM (`lib/db/index.ts` uses `neon-http` driver). Schema is in `lib/db/schema.ts`. Key tables: `families`, `family_members`, `children`, `habits`, `habit_logs`, `meal_journals`, `ticket_transactions`, `rewards`, `hourglass_sessions`.

**Ticket economy:** Completing a habit inserts a `habit_logs` row and a `ticket_transactions` row (type `earned`). Redeeming a reward inserts a `ticket_transactions` row (type `redeemed`). Total tickets = `sum(amount)` across all transactions for a child.

**Timezone:** All "today" logic uses WIB (Asia/Jakarta) via `todayWIB()` in `lib/date.ts`. Dashboard date comparisons also use WIB.

**Hourglass:** Screen-time timer per child. State is computed from `hourglass_sessions` DB row in `lib/hourglass.ts` (`computeState()`). Pusher events keep the TV dashboard in sync without polling.

**Meal journal:** Separate from habits. Stored in `meal_journals` with clinical fields (portion, behavior arrays, context, location). Exportable as CSV (`/api/export`) and as PDF report (`/app/meal/report/preview`).

**Onboarding:** New users hit `/onboarding` which creates the `families` + `family_members` record and initial children/habits via `/api/onboarding`.
