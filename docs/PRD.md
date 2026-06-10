# PRD: Kids Habit Tracker
**Date**: 2026-06-11
**Author**: Iqbal
**Status**: Draft
**Version**: 1.0

---

## 1. Executive Summary

### Problem Statement
Orang tua dengan anak usia 3–6 tahun kesulitan membangun konsistensi kebiasaan harian anak (makan, sikat gigi, tidur, dll.) tanpa harus mengingatkan berulang kali setiap hari. Solusi reward chart fisik sudah pernah dicoba tapi gagal karena inkonsistensi pencatatan orang tua, bukan karena anaknya tidak mau.

### Proposed Solution
Web app dua-surface: (1) Parent app di HP untuk input habit selesai dalam <5 detik, dan (2) TV Dashboard yang ditampilkan di layar utama rumah sebagai anchor visual sepanjang hari. Dilengkapi sistem tiket digital yang bisa ditukar reward fisik yang didefinisikan orang tua, jurnal makan per sesi untuk data dokter, dan hourglass visual ambient saat sesi makan berlangsung.

### Business Impact
- Mengurangi frekuensi orang tua mengingatkan anak → less friction dalam rumah tangga
- Membangun data kesehatan anak yang terstruktur untuk konsultasi dokter
- Menciptakan motivasi intrinsik anak melalui gamifikasi yang terasa nyata

### Success Metrics
| Metric | Target (4 minggu) |
|--------|-------------------|
| % habit harian yang diselesaikan | ≥70% per minggu |
| Frekuensi orang tua nag anak | Turun ≥50% |
| Konsistensi input orang tua | ≥80% hari dalam sebulan |
| Data jurnal makan tersedia untuk dokter | 100% sesi tercatat |

---

## 2. Problem Definition

### 2.1 Customer Problem

**Who**: Orang tua (ayah/ibu) dengan anak usia 3–6 tahun, tinggal bersama.

**What**:
- Anak usia 3 tahun sulit memulai dan menyelesaikan sesi makan — distraksi, lari-lari, tidak fokus sejak awal
- Habit lain (sikat gigi, tidur, beresin mainan) juga sering "bolong" tanpa diingatkan
- Orang tua sudah pernah mencoba reward chart fisik tapi gagal karena tidak konsisten mencatat

**When**:
- Setiap sesi makan (3x sehari) → problem paling akut
- Rutin pagi dan malam (sikat gigi, tidur) → problem frekuensi tinggi
- Transisi aktivitas sore (beresin mainan, mandi) → problem secondary

**Where**:
- Di rumah, terutama ruang makan dan ruang utama
- TV di ruang utama sebagai focal point keluarga

**Why (root cause)**:
- Anak usia 3–6 tahun belum memiliki self-regulation yang cukup
- Tidak ada "anchor visual" yang terlihat sepanjang hari sebagai pengingat
- Orang tua kelelahan → inkonsistensi reward chart → anak tidak percaya reward akan datang
- Timer besar/countdown terasa intimidatif → anak resist bukan engage

**Impact jika tidak diselesaikan**:
- Waktu dan energi orang tua terkuras untuk nagging
- Anak tidak membangun habit loop yang sehat sejak dini
- Data perilaku makan anak tidak terdokumentasi → dokter tidak punya baseline

### 2.2 Konteks Pengguna

- Anak 1: usia 3 tahun — belum bisa baca, butuh visual sepenuhnya, belum bisa input sendiri
- Anak 2: usia 6 tahun — belum bisa baca lancar, butuh visual, mulai bisa lebih mandiri
- Primary user yang input: kedua orang tua bergantian
- Display utama: TV di ruang keluarga via laptop + HDMI/browser

---

## 3. Solution Overview

### 3.1 Arsitektur Dua Surface

```
┌──────────────────────────┐     sync     ┌────────────────────────────┐
│   PARENT APP (mobile web) │ ──────────► │   TV DASHBOARD (browser)   │
│                           │             │                            │
│ • Tap habit selesai       │             │ • Side-by-side per anak    │
│ • Input jurnal makan      │             │ • Hourglass sesi makan     │
│ • Kelola habit & reward   │             │ • Progress bintang/tiket   │
│ • Export data dokter      │             │ • Animasi celebrasi        │
│ • Lihat history           │             │ • Always-on display        │
└──────────────────────────┘             └────────────────────────────┘
```

### 3.2 In Scope (MVP)

| Fitur | Prioritas | Keterangan |
|-------|-----------|------------|
| Preloaded habit list per anak | P0 | Default habits per usia, bisa dikustomisasi |
| Parent input: 1-tap centang habit | P0 | Dari HP, <5 detik per habit |
| TV Dashboard side-by-side | P0 | Progress kedua anak terlihat bersamaan |
| Hourglass ambient timer makan | P0 | Visual non-intimidatif, 30 menit |
| Jurnal makan per sesi | P0 | Porsi, mood, makanan, catatan bebas |
| Sistem tiket digital | P0 | Akumulasi per hari dan total |
| Reward definition oleh orang tua | P0 | "X tiket = reward Y" yang bisa diset sendiri |
| History per anak + export PDF/CSV | P0 | Filter by date range untuk dokter |
| Animasi celebrasi | P1 | Saat semua habit hari ini selesai |
| Reminder notifikasi ke HP | P1 | Push notif jadwal habit |
| Weekly summary digest | P2 | Ringkasan mingguan untuk orang tua |

### 3.3 Out of Scope (MVP)

- Login/auth kompleks — cukup PIN sederhana atau no-auth (private URL)
- Anak input sendiri — tidak reliable untuk usia 3 tahun
- Multi-household / multi-device sync real-time
- Social features (berbagi progress ke keluarga besar)
- Integrasi dengan aplikasi kesehatan pihak ketiga

### 3.4 MVP Definition

**Core yang harus jalan sebelum dipakai:**
1. Orang tua bisa centang habit selesai dari HP
2. TV Dashboard update otomatis dan terlihat jelas dari jarak 3 meter
3. Hourglass muncul saat sesi makan dimulai
4. Jurnal makan bisa diisi dan tersimpan
5. Tiket terakumulasi dan bisa dilihat

**Definition of done:** Bisa dipakai satu keluarga selama 7 hari tanpa bug kritis.

---

## 4. User Stories & Requirements

### 4.1 User Stories

**Sebagai orang tua:**

```
US-001: Catat habit selesai
Sebagai orang tua,
saya ingin mencentang habit anak selesai dalam satu tap dari HP saya,
agar saya tidak perlu membuka banyak menu saat sedang sibuk.

Acceptance Criteria:
- [ ] List habit hari ini muncul di home screen parent app
- [ ] Satu tap mengubah status habit menjadi "selesai"
- [ ] TV Dashboard update dalam <3 detik setelah tap
- [ ] Tiket otomatis bertambah sesuai nilai habit

US-002: Input jurnal makan
Sebagai orang tua,
saya ingin mencatat detail sesi makan anak setiap kali selesai makan,
agar saya punya data konkret untuk dibawa ke dokter.

Acceptance Criteria:
- [ ] Form jurnal muncul saat habit "makan" di-tap selesai
- [ ] Field: porsi (sedikit/setengah/habis), mood (fokus/distraksi/rewel), makanan apa, catatan bebas
- [ ] Catatan tersimpan dengan timestamp otomatis
- [ ] Bisa skip jurnal (optional, bukan mandatory)

US-003: Export data untuk dokter
Sebagai orang tua,
saya ingin mengexport history habit dan jurnal makan dalam format PDF atau CSV,
agar dokter bisa melihat pola perilaku anak selama periode tertentu.

Acceptance Criteria:
- [ ] Filter by anak dan date range
- [ ] Export mencakup: habit completion rate, jurnal makan lengkap
- [ ] Format PDF readable, CSV importable ke spreadsheet
- [ ] Export tersedia dalam <10 detik

US-004: Set reward rules
Sebagai orang tua,
saya ingin mendefinisikan reward apa yang bisa ditukar dengan jumlah tiket tertentu,
agar reward terasa personal dan bermakna bagi anak saya.

Acceptance Criteria:
- [ ] Bisa tambah/edit/hapus reward (nama reward + jumlah tiket yang dibutuhkan)
- [ ] Reward ditampilkan di TV Dashboard sebagai motivasi
- [ ] Orang tua bisa "redeem" tiket saat reward diberikan
```

**Sebagai anak (dimediasi orang tua):**

```
US-005: Lihat progress di TV
Sebagai anak,
saya ingin melihat progress habit saya di TV,
agar saya tahu seberapa dekat saya dengan reward.

Acceptance Criteria:
- [ ] Nama dan avatar/foto anak terlihat jelas dari jarak 3 meter
- [ ] Progress hari ini: habit yang sudah selesai vs belum
- [ ] Total tiket yang dimiliki terlihat prominent
- [ ] Side-by-side dengan saudara (sibling motivation)

US-006: Hourglass saat makan
Sebagai anak,
saya ingin melihat hourglass yang bergerak saat sesi makan,
agar saya tahu waktu makan masih berlangsung tanpa merasa dikejar countdown.

Acceptance Criteria:
- [ ] Hourglass animasi mengalir selama 30 menit (durasi configurable)
- [ ] Visual ambient, tidak mendominasi layar
- [ ] Tidak ada angka atau countdown yang terlihat
- [ ] Berubah warna/animasi saat waktu hampir habis (subtle)
```

### 4.2 Functional Requirements

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| FR-01 | Sistem menyimpan daftar habit per anak dengan jadwal waktu (pagi/siang/malam) | P0 |
| FR-02 | Orang tua bisa centang habit selesai dari mobile browser | P0 |
| FR-03 | TV Dashboard auto-refresh saat ada update | P0 |
| FR-04 | Hourglass timer bisa dimulai manual oleh orang tua untuk sesi makan | P0 |
| FR-05 | Jurnal makan tersimpan dengan metadata lengkap per sesi | P0 |
| FR-06 | Tiket terakumulasi per hari dan total, tidak bisa negatif | P0 |
| FR-07 | Orang tua bisa redeem tiket untuk reward yang sudah didefinisikan | P0 |
| FR-08 | History bisa difilter per anak dan rentang tanggal | P0 |
| FR-09 | Export data ke PDF dan CSV | P0 |
| FR-10 | Preloaded habit set untuk usia 3 tahun dan 6 tahun | P0 |
| FR-11 | Animasi celebrasi di TV saat semua habit hari ini selesai | P1 |
| FR-12 | Notifikasi reminder ke HP sesuai jadwal habit | P1 |

### 4.3 Non-Functional Requirements

- **Performance**: TV Dashboard refresh <3 detik setelah parent input
- **Usability**: Parent bisa centang habit dalam <5 detik tanpa scroll
- **Reliability**: Data jurnal tidak boleh hilang (persistent storage)
- **Display**: TV Dashboard readable dari jarak 3 meter di layar 40"+
- **Compatibility**: Berjalan di Chrome/Safari modern, mobile + desktop
- **Data retention**: Semua data tersimpan minimum 2 tahun

---

## 5. Design & UX Principles

### 5.1 Design Principles

1. **Zero friction untuk orang tua** — setiap interaksi di parent app harus bisa dilakukan satu tangan, saat kelelahan, dalam gelap
2. **Ambient, bukan alarm** — TV dashboard harus terasa seperti dekorasi rumah yang informatif, bukan dashboard monitoring
3. **Visual-first untuk anak** — tidak ada teks penting, semua informasi harus bisa dipahami dari gambar/ikon/warna
4. **Jujur dan konsisten** — reward system harus predictable agar anak percaya; jangan ada mechanic yang bisa membingungkan

### 5.2 TV Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│  Selasa, 11 Juni 2026                        🌙 Malam   │
├───────────────────────────┬─────────────────────────────┤
│  [NAMA ANAK 1] • 3 thn   │  [NAMA ANAK 2] • 6 thn     │
│                           │                             │
│  ☀️ Makan pagi    ✅      │  ☀️ Makan pagi    ✅        │
│  🦷 Sikat gigi    ✅      │  🦷 Sikat gigi    ✅        │
│  🌙 Makan malam   ⏳      │  🌙 Makan malam   ⏳        │
│  🧸 Beresin mainan ❌     │  🎒 Siapkan tas   ✅        │
│                           │                             │
│  ⭐ Tiket hari ini: 2/4   │  ⭐ Tiket hari ini: 3/4    │
│  🎫 Total tiket: 12       │  🎫 Total tiket: 18         │
│                           │                             │
│  [HOURGLASS - jika makan] │                             │
└───────────────────────────┴─────────────────────────────┘
│  Reward berikutnya: 🍦 Es krim (5 tiket lagi)           │
└─────────────────────────────────────────────────────────┘
```

### 5.3 Parent App Flow

```
Home (habit list hari ini)
├── Tap habit → Selesai ✅ + tiket bertambah
│   └── [Jika habit "makan"] → Modal jurnal makan (optional, bisa skip)
│       ├── Porsi: [Sedikit] [Setengah] [Habis]
│       ├── Mood: [Fokus] [Distraksi] [Rewel]  
│       ├── Makanan: (text input)
│       └── Catatan: (text area, optional)
├── Start hourglass → Pilih anak → Hourglass muncul di TV
├── Settings
│   ├── Kelola habit per anak
│   ├── Set reward rules
│   └── Lihat/export history
```

---

## 6. Preloaded Habit Sets

### Usia 3 Tahun
| Habit | Ikon | Waktu | Tiket |
|-------|------|-------|-------|
| Makan pagi habis | 🍳 | Pagi | 2 |
| Sikat gigi pagi | 🦷 | Pagi | 1 |
| Tidur siang | 😴 | Siang | 2 |
| Makan siang habis | 🍱 | Siang | 2 |
| Beresin mainan | 🧸 | Sore | 1 |
| Mandi sore | 🛁 | Sore | 1 |
| Makan malam habis | 🍽️ | Malam | 2 |
| Sikat gigi malam | 🦷 | Malam | 1 |
| Tidur tepat waktu | 🌙 | Malam | 2 |

### Usia 6 Tahun
| Habit | Ikon | Waktu | Tiket |
|-------|------|-------|-------|
| Makan pagi habis | 🍳 | Pagi | 2 |
| Sikat gigi pagi | 🦷 | Pagi | 1 |
| Makan siang habis | 🍱 | Siang | 2 |
| Screen-free / baca buku | 📚 | Sore | 2 |
| Beresin mainan | 🧸 | Sore | 1 |
| Mandi sore | 🛁 | Sore | 1 |
| Siapkan tas sekolah | 🎒 | Malam | 2 |
| Makan malam habis | 🍽️ | Malam | 2 |
| Sikat gigi malam | 🦷 | Malam | 1 |
| Tidur tepat waktu | 🌙 | Malam | 2 |

---

## 7. Data Model (Ringkasan)

```
Child
├── id, name, age, avatar

Habit
├── id, child_id, name, icon, schedule (morning/afternoon/evening), tickets_value
├── is_active, is_preloaded

HabitLog
├── id, habit_id, child_id, date, completed_at
├── tickets_earned

MealJournal
├── id, child_id, habit_log_id, date, meal_type (breakfast/lunch/dinner)
├── portion (little/half/all), mood (focused/distracted/fussy)
├── food_description, notes, created_at

TicketTransaction
├── id, child_id, type (earned/redeemed), amount, reason, created_at

Reward
├── id, child_id, name, ticket_cost, is_active
```

---

## 8. Risks & Mitigations

| Risiko | Probabilitas | Dampak | Mitigasi |
|--------|-------------|--------|----------|
| Orang tua lupa input habit di hari sibuk | Tinggi | Tinggi | Input flow <5 detik; reminder notifikasi |
| TV Dashboard tidak auto-refresh (browser throttle) | Sedang | Sedang | Polling setiap 5 detik atau WebSocket sederhana |
| Anak bosan dengan reward yang sama | Sedang | Tinggi | Orang tua bisa update reward list kapan saja |
| Data jurnal makan hilang (browser storage) | Rendah | Tinggi | Server-side persistence, bukan localStorage |
| Hourglass tidak terlihat jelas di TV besar | Rendah | Sedang | Test di layar 40"+ sebelum launch |

---

## 9. Timeline MVP

| Milestone | Target | Deliverables |
|-----------|--------|--------------|
| Setup & data model | Minggu 1 | DB schema, API skeleton, auth dasar |
| Parent app core | Minggu 1-2 | Habit list, 1-tap input, jurnal makan |
| TV Dashboard | Minggu 2 | Side-by-side view, auto-refresh, hourglass |
| Reward & tiket system | Minggu 3 | Akumulasi tiket, reward definition, redeem |
| History & export | Minggu 3-4 | Filter, PDF export, CSV export |
| Polish & testing | Minggu 4 | Bug fix, TV readability test, 7-day family test |

---

## 10. Open Questions

1. Apakah tiket bisa "expired" (reset mingguan) atau terus terakumulasi tanpa batas?
2. Apakah kedua orang tua perlu login terpisah, atau cukup shared PIN/URL?
3. Apakah hourglass bisa di-pause jika anak perlu istirahat sebentar saat makan?
4. Format export PDF untuk dokter — apakah perlu template khusus atau free-form?
5. Apakah habit bisa dinonaktifkan sementara (misal: libur sekolah)?

---

## Appendix

### Discovery Summary
- **Method**: Product discovery conversation dengan orang tua (single user, personal use)
- **Key insight #1**: Reward chart fisik gagal bukan karena anak tidak mau, tapi karena orang tua tidak konsisten mencatat → solusi harus minimize friction orang tua
- **Key insight #2**: Timer besar/countdown intimidatif untuk anak → hourglass ambient lebih tepat
- **Key insight #3**: Data jurnal makan punya nilai sekunder sebagai medical record untuk dokter
- **Key insight #4**: TV sebagai shared screen menciptakan sibling motivation tanpa intervensi verbal orang tua

### Assumption yang Belum Divalidasi
- A1: TV dashboard sebagai motivasi pasif cukup tanpa verbal prompt orang tua
- A2: Orang tua akan konsisten input meski kelelahan jika friction sangat rendah
- A3: Tiket digital terasa cukup "nyata" bagi anak usia 3 tahun
