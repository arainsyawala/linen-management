# Implementation Plan
## Sistem Informasi Manajemen Alur Stok Linen Hotel
**Studi Kasus:** Hotel Green Star Park Simalungun  
**Teknologi:** Next.js (App Router), TypeScript, Tailwind CSS, Prisma, SQLite

---

### Phase 1: Project Initialization & Database Setup
- **Objective:** Inisialisasi proyek Next.js dengan App Router, Tailwind CSS, TypeScript, Prisma ORM, dan seed data master linen.
- **Deliverables:**
  - Proyek Next.js terkonfigurasi.
  - Skema Prisma (`schema.prisma`) dengan model User, LinenItem, Transaction, TransactionItem, ConditionLog, DailyOccupancy.
  - Script seed (`prisma/seed.ts`) untuk 3 user roles dan 6 master linen items.
- **Verification:** `npx prisma db seed` berhasil dijalankan tanpa error dan membuat file `dev.db`.

---

### Phase 2: Backend API & Business Logic Layer
- **Objective:** Membuat Next.js API Routes / Server Actions untuk memproses operasi CRUD dan aturan bisnis.
- **Deliverables:**
  - API / Actions untuk fetch & update Master Data Linen.
  - API / Actions untuk transaksi penyerahan (kotor -> laundry) & penerimaan (bersih -> housekeeping).
  - API / Actions untuk pencatatan log kondisi (Good, Stained, Damaged) dengan **otomatisasi pemotongan persediaan aktif saat Damaged**.
  - API / Actions untuk pencatatan okupansi kamar harian.
  - API / Actions untuk laporan sirkulasi & rekomendasi pengadaan.
- **Verification:** Unit verification / API testing untuk mutasi stok yang tepat saat transaksi dan kondisi afkir.

---

### Phase 3: Core UI Layout & Dashboard Utama
- **Objective:** Membuat tata letak responsif (desktop & mobile) dan Dashboard Utama.
- **Deliverables:**
  - Top Navigation & Sidebar responsif dengan **Role Switcher** (Admin Executive Housekeeper, Staf Housekeeping, Staf Laundry).
  - Stat KPI Cards: Stok Bersih di Gudang vs Sedang Dicuci di Laundry vs Terpasang di Kamar vs Total Afkir.
  - **Par Stock Health Indicator** (🟢 Hijau / 🟡 Kuning / 🔴 Merah).
  - **Quick Input Okupansi Kamar Harian** dengan kalkulator estimasi kebutuhan linen harian.
- **Verification:** Tampilan visual responsif & interaktif di layar mobile dan desktop.

---

### Phase 4: Modul Transaksi & Pencatatan Kondisi
- **Objective:** Mengembangkan UI transaksi harian dengan tombol kuantitas cepat dan pencatatan status linen.
- **Deliverables:**
  - Halaman Transaksi Masuk-Keluar dengan **Tombol Cepat (+1, +5, +10, -5)**.
  - Halaman Pencatatan Kondisi Linen (Good, Stained/Cuci Ulang, Damaged/Afkir).
  - Umpan balik visual saat stok afkir terpotong secara otomatis.
- **Verification:** Penguji dapat menambah/mengurangi stok dengan 1-click quick buttons dan melihat perubahan stok instan.

---

### Phase 5: Modul Pengadaan, Laporan Bulanan, Export & Polishing
- **Objective:** Mengembangkan modul pengadaan unit baru, rekapitulasi laporan bulanan, ekspor data, dan fitur cetak.
- **Deliverables:**
  - Halaman Rekomendasi Pengadaan Unit Baru (hitung selisih par stock & estimasi total anggaran biaya).
  - Halaman Laporan Bulanan (Tabel Sirkulasi & Tabel Kerugian Afkir).
  - Tombol **Cetak Laporan** (CSS `@media print`) dan **Ekspor CSV/Excel**.
  - Polish UI dengan animasi halus, indikator badge, dan tema modern yang mewah (Hotel Green Star Park palette).
- **Verification:** Laporan dapat didownload sebagai CSV/Excel dan layout cetak rapi. Build `npm run build` berhasil tanpa TypeScript error.
