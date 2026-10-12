# Product Requirement Document (PRD)
## Sistem Informasi Manajemen Alur Stok Linen Hotel
**Studi Kasus:** Hotel Green Star Park Simalungun  
**Versi:** 1.0.0  
**Tanggal:** 5 Oktober 2026  

---

### 1. Product Overview
Sistem Informasi Manajemen Alur Stok Linen Hotel Berbasis Web adalah aplikasi manajemen inventaris dan sirkulasi linen khusus yang dirancang untuk **Hotel Green Star Park Simalungun**. Aplikasi ini menghubungkan unit kerja Housekeeping dan Laundry untuk melacak keberadaan linen (stok bersih di gudang, sedang dicuci di laundry, terpasang di kamar), memantau kesehatan *par stock*, mencatat status linen rusak/afkir (condemned), menghitung estimasi pengadaan unit baru, serta menyajikan laporan bulanan yang dapat dicetak dan diekspor.

---

### 2. Problem Statement
- **Masalah Utama:** Ketidaksesuaian jumlah sirkulasi linen antara gudang housekeeping dan area laundry, hilangnya visibilitas stok linen terpasang di kamar, serta keterlambatan dalam mendeteksi stok di bawah batas aman (*par stock*).
- **Solusi:** Sistem digital real-time terintegrasi berbasis Next.js dengan tombol angka cepat untuk staf mobile, kalkulator okupansi kamar dinamis, otomatisasi pemotongan stok afkir, dan modul pengadaan unit baru.

---

### 3. Goals & Non-Goals
#### Goals:
- Menyajikan status sirkulasi linen real-time (Gudang, Laundry, Kamar).
- Indikator Par Stock Health tiga tingkat (Hijau, Kuning, Merah).
- Penginputan cepat sirkulasi linen mobile-friendly (+1, +5, +10, -5).
- Otomatisasi pemotongan persediaan aktif saat linen dinyatakan Damaged/Condemned (afkir) dan kalkulasi estimasi anggaran pengadaan baru.
- Laporan bulanan sirkulasi & kerugian afkir yang dapat dicetak dan diekspor (CSV/Excel).

#### Non-Goals:
- Integrasi ke sistem billing POS hotel eksternal.
- Pembayaran / pembelian langsung ke supplier (hanya rekomendasi pengadaan & anggaran).

---

### 4. Users and Roles
1. **ADMIN_EXECUTIVE_HOUSEKEEPER**
   - Hak akses penuh: Manajemen Master Data Linen, Dashboard Summary, Input Okupansi, Transaksi Sirkulasi, Log Kondisi, Rekomendasi Pengadaan, & Laporan Bulanan.
2. **STAF_HOUSEKEEPING**
   - Hak akses: Input sirkulasi kamar (penyerahan linen kotor ke laundry), penerimaan linen bersih, dan pelaporan linen rusak/afkir.
3. **STAF_LAUNDRY**
   - Hak akses: Input penerimaan linen kotor di laundry, pencatatan cuci selesai (bersih), dan penandaan cuci ulang (stained).

---

### 5. Functional Requirements
- **FR-001 [Dashboard]:** Menampilkan KPI real-time (Stok Clean di Gudang, Sedang Dicuci, Terpasang di Kamar, Total Afkir).
- **FR-002 [Dashboard Par Stock Health]:** Indikator warna dinamis:
  - 🟢 Hijau (Aman): Stok aktif >= Target Par Stock.
  - 🟡 Kuning (Peringatan): Stok aktif 80% - 99% dari Par Stock.
  - 🔴 Merah (Kritis): Stok aktif < Min Alert Threshold.
- **FR-003 [Dashboard Quick Occupancy]:** Form input cepat angka okupansi kamar harian yang menghitung proyeksi kebutuhan linen harian berdasarkan standar per kamar.
- **FR-004 [Transaksi Masuk-Keluar]:** Form penyerahan linen kotor ke laundry dan penyerahan linen bersih ke gudang dengan tombol kuantitas cepat (+1, +5, +10, -5).
- **FR-005 [Pencatatan Kondisi]:** Opsi status linen: *Good Condition*, *Stained* (Cuci Ulang), *Damaged/Condemned* (Afkir).
- **FR-006 [Otomatisasi Afkir]:** Jika status *Damaged/Condemned* dipilih, sistem otomatis memotong stok aktif dan menambahkan ke rekap afkir.
- **FR-007 [Rekomendasi Pengadaan]:** Menampilkan selisih stok afkir & kekurangan terhadap ideal par stock, beserta kalkulasi total estimasi biaya penggantian (Unit Price x Deficit).
- **FR-008 [Laporan Bulanan]:** Tabel rekap sirkulasi bulanan & kerugian linen afkir dengan fungsi Print dan Ekspor CSV/Excel.

---

### 6. Master Data Linen (Seed Initial)
1. **Duvet Cover** — Rp 150.000 / unit (Min Alert: 50)
2. **Sheet / Sprei** — Rp 95.000 / unit (Min Alert: 100)
3. **Pillow Case** — Rp 25.000 / unit (Min Alert: 150)
4. **Bath Towel** — Rp 65.000 / unit (Min Alert: 100)
5. **Face Towel** — Rp 20.000 / unit (Min Alert: 80)
6. **Bath Mat** — Rp 35.000 / unit (Min Alert: 40)

---

### 7. Non-Functional Requirements
- **Responsif:** Tampilan dioptimalkan untuk perangkat seluler staf (touch targets besar) dan layar desktop supervisor.
- **Kecepatan & Performa:** Transaksi tercatat instantly dengan update SQLite via Prisma ORM.
- **Keamanan & Role Switcher:** Kemampuan pergantian peran cepat (Role Switcher UI) untuk simulasi workflow antardivisi.
