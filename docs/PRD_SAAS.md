# PRD: Kids Habit Tracker — SaaS Multi-Family
**Date**: 2026-06-14
**Author**: Iqbal
**Status**: Draft
**Version**: 2.0
**Previous Version**: [PRD.md](./PRD.md) — single-family personal tool

---

## 1. Executive Summary

### Context

Versi 1.0 dibangun sebagai personal tool untuk satu keluarga. Setelah validasi konsep berhasil, produk akan di-share ke ~50 keluarga teman-teman builder. Ini adalah pivot dari **personal tool → SaaS product**.

### Problem Statement (diperluas)

Orang tua dengan anak usia 3–6 tahun kesulitan membangun konsistensi habit harian anak dan tidak punya data perilaku makan yang terstruktur untuk konsultasi dokter. Solusi yang ada di pasaran (habit tracker umum) tidak memiliki konteks klinis dan tidak dirancang untuk dinamika keluarga dengan anak kecil.

### Proposed Solution

Web app multi-tenant dengan dua surface per keluarga:
1. **Parent App** (mobile, requires login) — input habit, meal log, settings
2. **TV Dashboard** (public URL per keluarga) — always-on display, no login required

Setiap keluarga memiliki data yang sepenuhnya terisolasi. Auth via Clerk (email/Google). Realtime via Pusher WebSocket per family channel.

### Why Now

- V1 sudah validated di satu keluarga selama beberapa minggu
- Ada permintaan konkret dari teman-teman untuk mencoba
- Clerk + Pusher memungkinkan SaaS infrastructure dibangun dalam hitungan hari

---

## 2. Target Users

### Primary User: Orang Tua (Ayah/Ibu)

**Profil:**
- Anak usia 2–8 tahun
- Familiar dengan smartphone, tidak harus tech-savvy
- Punya TV di ruang keluarga
- Pernah mencoba reward chart fisik tapi gagal karena inkonsistensi

**Jobs to be done:**
- Bangun konsistensi habit anak tanpa nagging
- Punya data perilaku makan untuk dibawa ke dokter
- Bisa koordinasi dengan pasangan tanpa harus sync manual

### Secondary User: Dokter Anak

Tidak menggunakan app secara langsung, tapi menerima output (doctor report PDF/CSV) dari orang tua saat konsultasi.

---

## 3. Scope

### 3.1 In Scope — V2 (Multi-Family)

| Fitur | Prioritas | Keterangan |
|-------|-----------|------------|
| Multi-family auth via Clerk | P0 | Email + Google login |
| Family onboarding flow | P0 | Register → buat keluarga → tambah anak |
| Data isolation per family | P0 | Semua query filter by family_id |
| TV Dashboard per family URL | P0 | `/dashboard/[familySlug]` — public, no auth |
| Realtime via Pusher per family | P0 | Channel `dashboard-{familySlug}` |
| Invite co-parent | P1 | Kirim invite ke pasangan via email |
| Family settings (nama, slug) | P1 | Orang tua bisa set nama keluarga |
| Landing page | P1 | Halaman publik untuk onboarding baru |

### 3.2 Carried Over dari V1 (sudah ada)

- Habit tracking + TV Dashboard
- Sistem tiket & reward
- Meal journal + doctor report
- Export CSV
- Hourglass timer
- History habit

### 3.3 Out of Scope V2

- Mobile native app (iOS/Android)
- Billing / subscription (free semua dulu)
- Admin dashboard untuk builder
- Push notification ke HP
- Multi-language (Bahasa Indonesia only)

---

## 4. Architecture Decision

### 4.1 Auth: Clerk

**Alasan:**
- Free tier: 10,000 MAU — cukup untuk ratusan keluarga
- Zero UI yang perlu dibikin (login, register, forgot password sudah jadi)
- Middleware Next.js native
- Support email + Google login out of the box

**Flow:**
```
User buka app
    ↓
Belum login → Clerk login page (email / Google)
    ↓
Sudah login, belum punya keluarga → Onboarding
    ↓
Sudah punya keluarga → Parent App
```

### 4.2 Realtime: Pusher

**Alasan:**
- SSE (V1) hanya bekerja di single serverless instance — tidak reliable di Vercel
- Pusher free tier: 200k messages/hari, 100 concurrent connections — cukup untuk 50 keluarga
- Channel per family = data isolation di level realtime

**Channel design:**
```
Channel: "dashboard-{familySlug}"
Events:
├── habit_completed   { childId, habitId, totalTickets, allHabitsDone }
├── hourglass_started { childId, durationS, startedAt }
├── hourglass_stopped { childId }
└── reward_redeemed   { childId, rewardName, ticketsRemaining }
```

### 4.3 TV Dashboard: Public URL dengan Kode Keluarga

**Security model: Level 1.5 — random slug + entry point terpusat**

Slug bersifat random (8 karakter hex), bukan nama keluarga yang bisa di-guess:
```
/dashboard/x7k9m2p4   ← tidak bisa di-guess, hanya yang punya kode bisa akses
```

**Entry point: `/dashboard`**

Halaman publik yang meminta kode keluarga sebelum redirect ke dashboard yang sesuai:

```
┌─────────────────────────────┐
│                             │
│    🌟 Habit Tracker         │
│                             │
│  Masukkan kode keluarga     │
│  untuk membuka dashboard    │
│                             │
│  ┌─────────────────────┐    │
│  │  x7k9m2p4           │    │
│  └─────────────────────┘    │
│                             │
│  [Buka Dashboard]           │
│                             │
│  Belum punya kode?          │
│  Daftar di habittracker.app │
│                             │
└─────────────────────────────┘
```

**Flow setup TV (sekali saja):**
```
1. Orang tua dapat kode keluarga dari onboarding (misal: x7k9m2p4)
2. Buka TV → ketik /dashboard → input kode → redirect ke /dashboard/x7k9m2p4
3. Bookmark /dashboard/x7k9m2p4 di browser TV
4. Selanjutnya TV tinggal buka bookmark — tidak perlu ketik kode lagi
```

**Kenapa halaman, bukan popup:**
- TV layar besar — halaman lebih readable
- Bisa tampilkan instruksi dan link signup
- Clean UX tanpa modal overlay

**Security properties:**
- Slug random → tidak bisa di-guess
- Tanpa kode, `/dashboard` tidak menampilkan data apapun
- Data yang tampil (nama anak, progress habit, tiket) by design visible di ruang keluarga — bukan data sensitif
- Sama dengan model Google Docs "anyone with the link"

Slug di-generate saat onboarding:
```typescript
const slug = crypto.randomBytes(4).toString('hex') // → "x7k9m2p4"
```

---

## 5. Data Model

### 5.1 Tabel Baru

```sql
families
  id          uuid PK
  name        text NOT NULL          -- "Keluarga Iqbal"
  slug        text NOT NULL UNIQUE   -- "x7k9m2p4" (random 8 char hex, generated at onboarding)
  created_at  timestamptz DEFAULT now()

family_members
  id          uuid PK
  family_id   uuid FK → families.id
  user_id     text NOT NULL          -- Clerk user ID
  role        text NOT NULL          -- 'owner' | 'co-parent'
  joined_at   timestamptz DEFAULT now()
```

### 5.2 Tabel Existing — Tambah `family_id`

```sql
-- Semua tabel ini tambah kolom:
children          ADD COLUMN family_id uuid FK → families.id
-- habits, habitLogs, mealJournals, rewards, ticketTransactions, hourglassSessions
-- sudah terisolasi via child_id → children.family_id (tidak perlu tambah kolom)
```

### 5.3 Isolasi Data

```
Request masuk → Clerk session → user_id
    ↓
family_members WHERE user_id = ? → family_id
    ↓
Semua query: WHERE children.family_id = ?
    ↓
Data keluarga lain tidak bisa diakses
```

---

## 6. User Stories

### Onboarding

```
US-101: Register & buat keluarga
Sebagai orang tua baru,
saya ingin mendaftar dan langsung bisa setup keluarga saya,
agar bisa mulai tracking habit anak dalam <5 menit.

Acceptance Criteria:
- [ ] Bisa register via email atau Google (Clerk)
- [ ] Setelah register, diarahkan ke onboarding
- [ ] Onboarding: input nama keluarga → generate slug → tambah anak minimal 1
- [ ] Setelah onboarding selesai, masuk ke parent app
- [ ] Dapat instruksi cara buka TV Dashboard (URL + QR code)

US-102: Invite co-parent
Sebagai orang tua,
saya ingin mengundang pasangan saya untuk akses yang sama,
agar kami berdua bisa input habit dari HP masing-masing.

Acceptance Criteria:
- [ ] Input email pasangan di Settings
- [ ] Pasangan terima email invite
- [ ] Setelah accept, pasangan punya akses penuh ke data keluarga yang sama
- [ ] Maksimal 2 co-parent per keluarga (V2)
```

### TV Dashboard

```
US-103: Setup TV Dashboard via kode keluarga
Sebagai orang tua,
saya ingin bisa membuka TV Dashboard hanya dengan memasukkan kode keluarga,
agar TV tidak perlu login dan tidak pernah timeout.

Acceptance Criteria:
- [ ] Halaman /dashboard menampilkan form input kode keluarga
- [ ] Kode valid → redirect ke /dashboard/[slug]
- [ ] Kode tidak valid → pesan error "Kode tidak ditemukan"
- [ ] URL /dashboard/[slug] bisa diakses tanpa Clerk session
- [ ] Data yang tampil hanya milik keluarga dengan slug tersebut
- [ ] Realtime update via Pusher tanpa auth token
- [ ] Setelah setup, orang tua cukup bookmark /dashboard/[slug] di TV
```

### Parent App

```
US-104: Login dan langsung ke habit hari ini
Sebagai orang tua,
saya ingin setelah login langsung melihat habit anak hari ini,
tanpa harus pilih keluarga atau navigasi tambahan.

Acceptance Criteria:
- [ ] Setelah login, sistem tahu family_id dari session
- [ ] Home page langsung tampil habit hari ini untuk semua anak di keluarga itu
- [ ] Tidak ada step tambahan
```

---

## 7. Onboarding Flow

```
Landing page (/)
    ↓
"Mulai Gratis" → Clerk register (email / Google)
    ↓
[Baru pertama kali] → Onboarding wizard:
    Step 1: Nama keluarga → generate slug preview
    Step 2: Tambah anak (nama, usia, avatar emoji)
    Step 3: Done → tampil URL TV Dashboard + instruksi
    ↓
Parent App (/app)
```

**Returning user:**
```
/ → cek Clerk session
    ├── Belum login → Clerk login
    └── Sudah login → cek family_members
        ├── Belum punya keluarga → Onboarding
        └── Sudah → /app (parent app)
```

---

## 8. URL Structure

```
/                          → Landing page (public)
/login                     → Clerk login (redirect ke /app setelah login)
/onboarding                → Setup keluarga (first-time user)
/app                       → Parent app home (habit hari ini)
/app/history               → History habit
/app/meal                  → Meal log
/app/meal/report           → Doctor report
/app/settings              → Pengaturan keluarga, anak, reward
/dashboard                 → Entry point: form input kode keluarga
/dashboard/[familySlug]    → TV Dashboard (public, no auth, slug = random 8 char)
```

---

## 9. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Time to first habit log (new user) | <5 menit dari landing page |
| TV Dashboard load time | <2 detik |
| Realtime latency (parent tap → TV update) | <1 detik via Pusher |
| Data isolation | Zero data leakage antar keluarga |
| Uptime | Vercel + Neon SLA (~99.9%) |
| Auth security | Clerk handles — SOC2 compliant |

---

## 10. Migration Plan dari V1 → V2

Karena V1 sudah punya data (habits, children, dll):

1. Buat tabel `families` dan `family_members`
2. Insert satu row `families` untuk data existing (keluarga Iqbal)
3. Update semua `children` SET `family_id` = family Iqbal
4. Tambah Clerk — existing session (PIN cookie) di-replace
5. Deploy — test dengan akun Clerk pertama
6. Onboarding flow untuk user baru

Data existing tidak hilang — hanya ditambah konteks `family_id`.

---

## 11. Risks & Mitigations

| Risiko | Probabilitas | Dampak | Mitigasi |
|--------|-------------|--------|----------|
| Data leak antar keluarga | Rendah | Sangat tinggi | Semua API route validasi family_id dari Clerk session sebelum query |
| Slug collision | Rendah | Sedang | Auto-append angka jika slug sudah ada (keluarga-iqbal-2) |
| Pusher free tier limit | Sangat rendah | Sedang | 200k msg/hari >> kebutuhan 50 keluarga (~500 msg/hari) |
| User bingung onboarding | Sedang | Sedang | Onboarding wizard dengan progress indicator, tidak lebih dari 3 step |
| Co-parent invite tidak sampai | Sedang | Rendah | Clerk handle email delivery, fallback share URL manual |

---

## 12. Success Metrics V2

| Metric | Target (8 minggu setelah launch) |
|--------|----------------------------------|
| Keluarga yang selesai onboarding | ≥40 dari 50 yang diundang |
| Keluarga aktif (login ≥3x/minggu) | ≥60% |
| Rata-rata habit logged per keluarga/hari | ≥5 |
| Meal journal entries per keluarga/bulan | ≥20 |
| NPS dari teman-teman | ≥7/10 |

---

## 13. Timeline Eksekusi

| Fase | Scope | Estimasi |
|------|-------|----------|
| **Fase 1: Foundation** | Schema migration (family_id), Clerk setup, middleware | 2–3 hari |
| **Fase 2: Auth Flow** | Login, onboarding wizard, route protection | 2–3 hari |
| **Fase 3: Pusher** | Replace SSE → Pusher, channel per family | 1–2 hari |
| **Fase 4: TV Dashboard** | URL per family slug, public access | 1 hari |
| **Fase 5: Co-parent invite** | Invite flow via Clerk | 1–2 hari |
| **Fase 6: Landing page** | Marketing page + signup CTA | 1–2 hari |
| **Total** | | **~10–13 hari kerja** |

---

## 14. Open Questions

| # | Pertanyaan | Implikasi |
|---|------------|-----------|
| OQ-1 | Apakah ada batas jumlah anak per keluarga? | Tidak ada batasan untuk sekarang |
| OQ-2 | Apakah slug bisa diubah setelah dibuat? | Jika diubah, URL TV Dashboard lama tidak valid — perlu warning |
| OQ-3 | Apakah co-parent bisa hapus keluarga? | Hanya owner yang bisa hapus |
| OQ-4 | Bagaimana handle jika user register tapi belum selesai onboarding? | Middleware redirect ke /onboarding sampai family terbentuk |
| OQ-5 | Apakah perlu billing/pricing di V2? | Tidak — free semua, monetisasi dibahas di V3 |
