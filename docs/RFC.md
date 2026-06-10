# RFC: Kids Habit Tracker
**Date**: 2026-06-11
**Author**: Iqbal
**Status**: Draft
**Stack**: Next.js 15 · Tailwind CSS · Neon (Postgres) · Vercel

---

## 1. Overview

Web app dua-surface untuk tracking habit harian dua anak (3 & 6 tahun):
- **Parent App** — mobile-first, input habit selesai dalam <5 detik
- **TV Dashboard** — always-on browser display, side-by-side progress kedua anak

Referensi: [PRD.md](./PRD.md)

---

## 2. Tech Stack

| Layer | Pilihan | Alasan |
|-------|---------|--------|
| Framework | Next.js 15 (App Router) | Server Components + API Routes dalam satu repo |
| Styling | Tailwind CSS | Utility-first, cepat untuk UI sederhana |
| Database | Neon (Postgres serverless) | Gratis tier cukup, koneksi pooling otomatis |
| ORM | Drizzle ORM | Type-safe, ringan, cocok untuk Neon |
| Realtime | Server-Sent Events (SSE) | TV Dashboard auto-refresh tanpa library tambahan |
| Auth | PIN sederhana (cookie-based) | Tidak perlu akun; satu PIN untuk seluruh keluarga |
| Deploy | Vercel | Zero-config untuk Next.js, edge functions |
| Export | `@react-pdf/renderer` (PDF) + `papaparse` (CSV) | Keduanya client-side, tidak perlu server render |

---

## 3. Struktur Direktori

```
habit-tracker-kids/
├── app/
│   ├── (parent)/               # Route group: parent app (mobile)
│   │   ├── layout.tsx          # Mobile layout
│   │   ├── page.tsx            # Home: habit list hari ini
│   │   ├── history/
│   │   │   └── page.tsx        # History + export
│   │   └── settings/
│   │       └── page.tsx        # Kelola habit, reward, anak
│   ├── dashboard/              # TV Dashboard (fullscreen)
│   │   └── page.tsx
│   ├── api/
│   │   ├── habits/
│   │   │   ├── route.ts        # GET list habit, POST create
│   │   │   └── [id]/
│   │   │       └── complete/
│   │   │           └── route.ts # POST: centang habit selesai
│   │   ├── meal-journal/
│   │   │   └── route.ts        # POST: simpan jurnal makan
│   │   ├── hourglass/
│   │   │   └── route.ts        # POST: start/stop hourglass
│   │   ├── rewards/
│   │   │   └── route.ts        # GET/POST/PATCH rewards
│   │   │   └── [id]/redeem/
│   │   │       └── route.ts    # POST: redeem tiket
│   │   ├── tickets/
│   │   │   └── route.ts        # GET: saldo tiket per anak
│   │   ├── export/
│   │   │   └── route.ts        # GET: export data (CSV)
│   │   └── events/
│   │       └── route.ts        # GET: SSE stream untuk TV Dashboard
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── parent/
│   │   ├── HabitCard.tsx       # Kartu habit dengan tombol centang
│   │   ├── MealJournalModal.tsx # Modal form jurnal makan
│   │   └── HourglassButton.tsx # Tombol start hourglass di parent app
│   └── dashboard/
│       ├── ChildPanel.tsx      # Panel per anak di TV
│       ├── HabitRow.tsx        # Baris habit (ikon + nama + status)
│       ├── HourglassWidget.tsx # Animasi hourglass
│       ├── TicketCounter.tsx   # Penghitung tiket
│       └── CelebrationOverlay.tsx # Animasi semua habit selesai
├── lib/
│   ├── db/
│   │   ├── schema.ts           # Drizzle schema
│   │   ├── index.ts            # Drizzle client (Neon)
│   │   └── seed.ts             # Preloaded habits seed
│   ├── sse.ts                  # SSE event emitter (in-memory untuk single instance)
│   └── auth.ts                 # PIN check middleware
├── drizzle/
│   └── migrations/             # Drizzle migration files
├── drizzle.config.ts
└── .env.local                  # DATABASE_URL, APP_PIN
```

---

## 4. Database Schema

```sql
-- Drizzle schema (lib/db/schema.ts)

children
  id          uuid PK
  name        text NOT NULL
  age         int NOT NULL
  avatar_url  text
  created_at  timestamptz DEFAULT now()

habits
  id             uuid PK
  child_id       uuid FK → children.id
  name           text NOT NULL
  icon           text NOT NULL          -- emoji
  schedule       text NOT NULL          -- 'morning' | 'afternoon' | 'evening'
  tickets_value  int NOT NULL DEFAULT 1
  is_active      boolean DEFAULT true
  sort_order     int DEFAULT 0
  created_at     timestamptz DEFAULT now()

habit_logs
  id            uuid PK
  habit_id      uuid FK → habits.id
  child_id      uuid FK → children.id
  date          date NOT NULL           -- tanggal lokal (tanpa timezone)
  completed_at  timestamptz
  tickets_earned int NOT NULL

meal_journals
  id               uuid PK
  child_id         uuid FK → children.id
  habit_log_id     uuid FK → habit_logs.id  -- null jika jurnal manual
  date             date NOT NULL
  meal_type        text NOT NULL         -- 'breakfast' | 'lunch' | 'dinner'
  portion          text NOT NULL         -- 'little' | 'half' | 'all'
  mood             text NOT NULL         -- 'focused' | 'distracted' | 'fussy'
  food_description text
  notes            text
  created_at       timestamptz DEFAULT now()

ticket_transactions
  id          uuid PK
  child_id    uuid FK → children.id
  type        text NOT NULL             -- 'earned' | 'redeemed'
  amount      int NOT NULL
  reason      text
  created_at  timestamptz DEFAULT now()

rewards
  id           uuid PK
  child_id     uuid FK → children.id   -- null = berlaku untuk semua anak
  name         text NOT NULL
  ticket_cost  int NOT NULL
  is_active    boolean DEFAULT true
  created_at   timestamptz DEFAULT now()

hourglass_sessions
  id               uuid PK
  child_id         uuid FK → children.id
  started_at       timestamptz NOT NULL
  duration_s       int NOT NULL DEFAULT 1800  -- 30 menit
  paused_at        timestamptz                -- null = sedang berjalan
  total_paused_s   int NOT NULL DEFAULT 0     -- akumulasi detik saat di-pause
  ended_at         timestamptz                -- null = belum selesai
```

**Index penting:**
```sql
CREATE INDEX ON habit_logs (child_id, date);
CREATE INDEX ON meal_journals (child_id, date);
CREATE INDEX ON ticket_transactions (child_id, created_at);
```

---

## 5. API Routes

### `POST /api/habits/[id]/complete`
Mencentang habit selesai. Jika habit adalah tipe "meal", response menyertakan flag `show_journal: true` agar parent app menampilkan modal jurnal.

**Request:**
```json
{ "child_id": "uuid", "date": "2026-06-11" }
```

**Response:**
```json
{
  "habit_log_id": "uuid",
  "tickets_earned": 2,
  "total_tickets": 14,
  "show_journal": true,
  "all_habits_done": false
}
```

**Side effects:**
- Insert `habit_logs`
- Insert `ticket_transactions` (type: earned)
- Emit SSE event `habit_completed` ke semua listener

---

### `POST /api/meal-journal`
Simpan jurnal makan. Dipanggil setelah `complete` jika orang tua mengisi form.

**Request:**
```json
{
  "child_id": "uuid",
  "habit_log_id": "uuid",
  "date": "2026-06-11",
  "meal_type": "dinner",
  "portion": "half",
  "mood": "distracted",
  "food_description": "nasi + ayam",
  "notes": "makan sambil jalan terus"
}
```

---

### `POST /api/hourglass`
Start atau stop hourglass untuk satu anak. Dipakai parent app sebelum sesi makan dimulai.

**Request:**
```json
{ "child_id": "uuid", "action": "start" | "pause" | "resume" | "stop", "duration_s": 1800 }
```

**Logic pause/resume:**
- `pause`: set `paused_at = now()`
- `resume`: set `total_paused_s += (now() - paused_at)`, set `paused_at = null`
- Sisa waktu di client = `duration_s - (now() - started_at) + total_paused_s`

**Side effects:**
- Insert/update `hourglass_sessions`
- Emit SSE event `hourglass_started` atau `hourglass_stopped`

---

### `GET /api/events` — Server-Sent Events
TV Dashboard subscribe ke endpoint ini. Server mengirim event setiap ada update.

**Event types:**
```
event: habit_completed
data: { "child_id": "...", "habit_id": "...", "tickets_total": 14 }

event: hourglass_started
data: { "child_id": "...", "duration_s": 1800, "started_at": "..." }

event: hourglass_stopped
data: { "child_id": "..." }

event: reward_redeemed
data: { "child_id": "...", "reward_name": "...", "tickets_remaining": 4 }

event: all_habits_done
data: { "child_id": "..." }
```

**Catatan implementasi:** Karena Vercel serverless tidak mendukung persistent connections di Edge Runtime, gunakan `runtime = 'nodejs'` di route ini dan pastikan deploy tidak menggunakan Edge.

---

### `GET /api/export?child_id=&from=&to=&format=csv`
Export history. CSV di-generate server-side dan di-stream sebagai file download.

---

### `POST /api/rewards/[id]/redeem`
Kurangi tiket anak dan tandai reward sebagai ditukar.

**Request:**
```json
{ "child_id": "uuid" }
```

**Validasi:** Tolak jika saldo tiket < `ticket_cost`.

---

## 6. Realtime Strategy (SSE)

TV Dashboard perlu update dalam <3 detik setelah parent input. Dua opsi:

| Opsi | Pro | Kon |
|------|-----|-----|
| **SSE (pilihan ini)** | Tidak perlu library, native browser support, cukup untuk 1 household | Tidak work di multi-instance Vercel (perlu sticky routing atau external pub/sub) |
| WebSocket (Supabase Realtime) | Robust, work multi-instance | Menambah dependency |
| Polling setiap 3 detik | Paling simple | Kurang responsif, wasteful |

**Keputusan:** SSE dengan fallback polling setiap 5 detik. Untuk single household dengan 1 Vercel instance, SSE sudah cukup. Jika di masa depan perlu multi-device lebih robust, migrate ke Supabase Realtime.

**Implementasi SSE (lib/sse.ts):**
```typescript
// In-memory event emitter — works pada single serverless instance
// Untuk production multi-instance, ganti dengan Redis pub/sub
const clients = new Set<ReadableStreamController>()

export function emitEvent(type: string, data: object) {
  const message = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`
  clients.forEach(ctrl => {
    try { ctrl.enqueue(message) } catch { clients.delete(ctrl) }
  })
}
```

---

## 7. Auth

Karena ini personal family app, tidak perlu akun penuh. Cukup PIN tunggal.

**Flow:**
1. Pertama kali buka app → redirect ke `/pin`
2. Input PIN (4–6 digit, diset via env `APP_PIN`)
3. Set cookie `auth_token` (signed, 30 hari)
4. Middleware cek cookie di semua route kecuali `/pin` dan `/dashboard`

**TV Dashboard** tidak butuh PIN — URL `/dashboard` bisa diakses tanpa auth agar tidak perlu re-login di TV yang tidak punya keyboard.

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname === '/dashboard' || pathname.startsWith('/api/events')) {
    return NextResponse.next() // TV dashboard: no auth
  }
  // cek cookie untuk semua route lainnya
}
```

---

## 8. TV Dashboard — Refresh Strategy

```typescript
// app/dashboard/page.tsx — Client Component
'use client'

useEffect(() => {
  const es = new EventSource('/api/events')
  
  es.addEventListener('habit_completed', (e) => {
    const data = JSON.parse(e.data)
    updateChildState(data.child_id, data)
  })
  
  es.addEventListener('hourglass_started', (e) => {
    startHourglass(JSON.parse(e.data))
  })
  
  // Fallback: jika SSE disconnect, reload data tiap 5 detik
  es.onerror = () => {
    setInterval(fetchDashboardData, 5000)
  }
  
  return () => es.close()
}, [])
```

**TV-specific CSS considerations:**
- Font size minimum `text-3xl` untuk semua teks yang perlu terbaca dari 3 meter
- No hover states (TV tidak ada cursor)
- High contrast colors (background gelap untuk ruangan yang sering redup)
- `overflow: hidden` — pastikan tidak ada scrollbar di TV

---

## 9. Hourglass Component

Hourglass dirender sebagai SVG animasi CSS — tidak butuh library animasi.

```
Design spec:
- Container: 120x200px (di TV: 160x260px)
- Pasir mengalir dari atas ke bawah via clip-path animation
- Durasi animasi = durasi sesi makan (default 30 menit)
- Saat 80% waktu terpakai: pasir berubah warna amber → merah (subtle)
- Saat selesai: gentle pulse animation, tidak ada suara/alarm
```

State hourglass disimpan di DB (`hourglass_sessions`) agar jika browser TV refresh, bisa resume dari posisi yang tepat berdasarkan `started_at`.

---

## 10. Export

### CSV
Di-generate di API route dengan `papaparse`. Dua sheet dalam satu file tidak bisa di CSV murni, jadi export dalam dua file terpisah yang di-zip, atau satu CSV dengan semua kolom.

**Kolom CSV (meal journal):**
`date, child_name, meal_type, portion, mood, food_description, notes`

### PDF
Di-generate client-side dengan `@react-pdf/renderer`. Layout sederhana: header berisi nama anak + rentang tanggal, tabel jurnal makan, ringkasan habit completion rate per minggu.

```
Keputusan: PDF di client-side untuk menghindari server memory issue
dengan large datasets. Maksimal export 90 hari dalam satu request.
```

---

## 11. Environment Variables

```bash
# .env.local
DATABASE_URL=             # Neon connection string (pooled)
DATABASE_URL_UNPOOLED=    # Neon direct connection (untuk migrations)
APP_PIN=                  # 4-6 digit PIN keluarga
AUTH_SECRET=              # Random string untuk sign cookie
NEXT_PUBLIC_APP_URL=      # URL production (untuk SSE absolute URL)
```

---

## 12. Deployment

```
Vercel (free tier)
├── Production: main branch → auto deploy
├── Preview: setiap PR → preview URL
└── Environment variables: set di Vercel dashboard

Neon (free tier)
├── 1 project, 1 database
├── Connection pooling: gunakan pooled URL untuk app
└── Migrations: jalankan manual via `drizzle-kit push` atau CI step
```

**Drizzle migration workflow:**
```bash
# Development
npx drizzle-kit generate   # generate migration file
npx drizzle-kit push       # push langsung ke Neon (dev)

# Production
# Jalankan via npm script sebelum deploy, atau pakai Vercel build command:
# "build": "drizzle-kit push && next build"
```

---

## 13. Urutan Implementasi

Ikuti urutan ini untuk bisa test end-to-end secepat mungkin:

1. **Setup project** — `create-next-app`, install dependencies, koneksi Neon, Drizzle schema + seed
2. **Parent app home** — list habit hari ini, tombol centang (tanpa realtime dulu)
3. **TV Dashboard dasar** — tampil data statis dulu, layout side-by-side
4. **SSE realtime** — connect parent app ke TV Dashboard
5. **Jurnal makan** — modal form setelah centang habit makan
6. **Hourglass** — start dari parent app, tampil di TV
7. **Sistem tiket & reward** — akumulasi, redeem
8. **History & export** — halaman history, CSV, PDF
9. **Polish** — animasi celebrasi, PIN auth, TV CSS refinement

---

## 14. Dependencies

```json
{
  "dependencies": {
    "next": "^15",
    "react": "^19",
    "tailwindcss": "^4",
    "drizzle-orm": "latest",
    "@neondatabase/serverless": "latest",
    "@react-pdf/renderer": "^4",
    "papaparse": "^5",
    "date-fns": "^4"
  },
  "devDependencies": {
    "drizzle-kit": "latest",
    "@types/papaparse": "^5",
    "typescript": "^5"
  }
}
```

---

## 15. Open Questions (dari PRD, perlu keputusan sebelum implementasi)

| # | Pertanyaan | Implikasi |
|---|------------|-----------|
| OQ-1 | Tiket reset mingguan atau akumulasi selamanya? | **Akumulasi selamanya** — seperti tiket arcade, tidak pernah expired |
| OQ-2 | Hourglass bisa di-pause? | **Ya** — lihat update schema di bawah |
| OQ-3 | Satu PIN untuk semua, atau PIN per orang tua? | **1 PIN untuk semua** |
| OQ-4 | Habit bisa dinonaktifkan sementara (libur)? | **Ya** — `is_active` di schema sudah ada, expose di Settings UI |
