# Meal Log — Design Document

**Status:** In Discussion  
**Tanggal:** 2026-06-13  
**Konteks:** Ekspansi habit tracker ke arah clinical companion app untuk membantu orang tua anak dengan kesulitan makan berkonsultasi lebih efektif dengan dokter.

---

## Latar Belakang

### Problem Statement

Ketika konsultasi ke dokter anak, dokter menanyakan "kenapa tidak mau makan?" — tapi orang tua hanya bisa menjawab dari ingatan yang bias dan tidak lengkap. Hasilnya konsultasi tidak efektif karena dokter tidak punya data behavioral yang cukup.

Contoh nyata: anak makan banyak di rumah nenek tapi sedikit di rumah sendiri — variabel ini sering terlupakan dan tidak tersampaikan ke dokter.

### Tujuan

Menghasilkan meal log yang:
- Bisa diisi orang tua dalam **<1 menit per sesi makan**
- Menghasilkan data yang **bernilai klinis tinggi**
- Membantu dokter mengidentifikasi pattern: picky eating, sensory sensitivity, food refusal, mealtime behavior disorder, caregiver inconsistency, scheduling issues

---

## Arsitektur App

Meal journal berdiri **terpisah dan independen** dari habit tracker. Tidak ada koneksi otomatis antara habit "makan" selesai → trigger meal log. Orang tua membuka meal log secara eksplisit.

```
App (satu codebase)
├── /dashboard          → TV display, habit tracker (existing)
├── /parent             → Input habit selesai (existing)
├── /meal               → Meal journal — NEW section
│   ├── /meal/log       → Input log makan baru
│   ├── /meal/history   → Riwayat per anak
│   └── /meal/report    → Export untuk dokter (nanti)
└── /settings           → Profil anak, dll (existing)
```

Data anak (nama, profil) **shared** — tidak perlu input ulang. Fitur meal dan habit tidak saling referensi.

---

## Struktur Data Meal Log

Dirancang berdasarkan perspektif multidisiplin: dokter anak, ahli gizi anak, feeding therapist, occupational therapist, dan UX researcher.

### Tier 1 — Quick Log (wajib, ~20-25 detik)

**`meal_type`** — Jenis sesi makan
- Format: Dropdown
- Opsi: Sarapan / Makan siang / Makan malam / Snack
- Klinis: Membedakan makan utama vs snack penting untuk menilai apakah pola makan terstruktur. Anak yang skip makan utama tapi snack terus → masalah jadwal, bukan selera.

**`time`** — Waktu makan dimulai
- Format: Time picker (auto-fill waktu sekarang)
- Klinis: Jarak antar makan menentukan apakah anak benar-benar lapar. Snack terlalu dekat makan utama adalah penyebab paling umum food refusal yang tidak terdeteksi.

**`portion`** — Porsi yang dimakan
- Format: Skala visual 4 poin
- Opsi: Tidak mau / Sedikit (<¼) / Setengah / Habis
- Klinis: Proxy intake kalori tanpa harus timbang. Trend menurun 2 minggu = sinyal early intervention.

**`behavior_start`** — Perilaku di awal sesi makan
- Format: Multi-select checklist
- Opsi: Fokus & tenang / Distraksi (TV/gadget) / Rewel / Meludah / Gag/hampir muntah / Muntah / Lari-lari / Negosiasi

**`behavior_end`** — Perilaku di akhir sesi makan
- Format: Multi-select checklist (opsi sama dengan behavior_start)
- Klinis: Behavior yang berubah sepanjang sesi sangat diagnostik. Contoh: "10 menit pertama fokus, setelah itu lari-lari" → pattern kehilangan regulasi yang berbeda implikasi klinis-nya dari "rewel dari awal".

**`eaten_with`** — Siapa yang menemani makan
- Format: Dropdown + teks input jika "Lain-lain"
- Opsi: Orang tua / Nenek/Kakek / Pengasuh / Di sekolah / Lain-lain (input manual)
- Klinis: Variabel konteks paling sering jadi kunci tapi tidak pernah ditanyakan sistematis. "Makan sama nenek habis, sama orang tua tidak mau" → mengubah diagnosis sepenuhnya.

**`location`** — Lokasi makan
- Format: Dropdown + teks input jika "Lain-lain"
- Opsi: Rumah / Rumah nenek / Sekolah / Restoran / Lain-lain (input manual)
- Klinis: Lingkungan makan berpengaruh ke appetite dan behavior. Beda dari `eaten_with` — orang tua bisa makan bersama anak di restoran, atau nenek bisa datang ke rumah. Kombinasi kedua field memberikan konteks lengkap.

### Tier 2 — Detail (opsional, expand/collapse, +15-20 detik)

**`food_offered`** — Makanan yang disajikan
- Format: Teks bebas + flag "ada yang ditolak?" (checkbox)
- Klinis: Mendeteksi food selectivity pattern (hanya mau makanan putih, hanya mau tekstur crunchy) → tanda sensory-based feeding disorder.

**`duration_minutes`** — Durasi makan
- Format: Preset pilihan: <10 / 10-20 / 20-30 / 30-45 / >45 menit
- Klinis: >30 menit per makan utama adalah threshold klinis referral feeding therapy. Makan <5 menit juga diagnostik.

### Tier 3 — Catatan (selalu opsional)

**`pre_meal_context`** — Kondisi sebelum makan
- Format: Dropdown
- Opsi: Habis tidur siang / Habis main aktif / Habis sekolah / Sedang sakit / Normal
- Klinis: Status regulasi sebelum makan mempengaruhi appetite. "Selalu susah makan setelah sekolah" → sensory overload, bukan food refusal murni.

**`notes`** — Catatan bebas
- Format: Teks bebas
- Klinis: Menangkap observasi yang tidak masuk ke field mana pun tapi sering sangat diagnostik.

---

## Keputusan Desain: Behavior sebagai Dua Snapshot

### Masalah
Single multi-select behavior tidak cukup untuk menangkap behavior yang berubah sepanjang sesi. Contoh: "10 menit pertama fokus, setelah itu lari-lari keluar" — ini adalah behavior timeline, bukan snapshot.

### Solusi yang Dipilih: Dua Snapshot (Awal vs Akhir)

```
Awal makan:  [Fokus ✓] [Rewel] [Distraksi]
Akhir makan: [Fokus] [Rewel] [Lari-lari ✓]
```

Dokter bisa baca: "anak ini mulai baik tapi kehilangan regulasi setelah X menit" → pola klasik dengan implikasi klinis spesifik (sensory fatigue, boredom, porsi terlalu besar).

Korelasi dengan `duration_minutes` membuat narrative terbaca jelas:
- Durasi: 25 menit
- Awal: Fokus → Akhir: Lari-lari
- Porsi: Setengah

### Alternatif yang Tidak Dipilih
Opsi B (single multi-select + "berubah setelah X menit") — lebih simple tapi kurang presisi klinis.

---

## Yang Tidak Masuk ke Log Harian

| Field | Alasan |
|---|---|
| Berat badan / tinggi | Dicatat per kunjungan dokter, harian malah anxiety-inducing untuk orang tua |
| Kalori | Orang tua tidak bisa estimasi akurat, data tidak reliable |
| Suplemen/vitamin | Masuk section terpisah, bukan per-sesi |
| Foto makanan | Berguna tapi friction terlalu tinggi untuk konsistensi |

---

## Status Implementasi

- [x] Koneksi habit tracker → meal journal diputus
- [x] Schema database: kolom baru `behavior_start`, `behavior_end`, `eaten_with`, `eaten_with_other`, `location`, `location_other`, `food_offered`, `food_rejected`, `pre_meal_context` — kolom lama `mood`, `food_description`, `habit_log_id` dihapus
- [x] API `POST /api/meal-journal` diperbarui sesuai schema baru
- [x] API `GET /api/meal-journal?child_id=&from=&to=` ditambahkan untuk history
- [x] API `GET /api/children` ditambahkan
- [x] Bottom navigation parent app: tab Habit | Meal Log | Pengaturan
- [x] Halaman `/meal` — history per anak dengan tab switcher
- [x] Komponen `MealLogForm` — single scroll bottom sheet, Tier 1 wajib + Tier 2 accordion
- [ ] Doctor report / export PDF (fase berikutnya)
