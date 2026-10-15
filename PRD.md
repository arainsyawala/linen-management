# Product Requirement Document (PRD)
## Sistem Informasi Manajemen Alur Stok Linen Hotel
**Studi Kasus:** Hotel & Resort Green Star Park Simalungun  
**Versi Dokumen:** 2.0.0 (Final Release)  
**Tahun Akademik:** 2026/2027 — Capstone Project / Tugas Akhir

---

## 1. Product Overview

Sistem Informasi Manajemen Alur Stok Linen Hotel Berbasis Web adalah platform terintegrasi yang dirancang khusus untuk memantau, mendokumentasikan, dan merekonsiliasi seluruh siklus pergerakan inventaris linen di **Hotel Green Star Park Simalungun**.

Sistem ini menjembatani koordinasi operasional antara divisi **Housekeeping** dan divisi **Laundry**, mengeliminasi pencatatan manual berbasis kertas, mencegah kehilangan barang tanpa jejak (*loss prevention*), serta memberikan visibilitas penuh bagi **Executive Housekeeper** terhadap kesehatan kuota persediaan (*par stock*), kondisi linen, dan estimasi biaya penggantian barang afkir (*condemned*).

---

## 2. Problem Statement & Business Opportunity

### 2.1. Permasalahan Utama
1. **Discrepancy (Selisih Hitung) Antar-Divisi**:
   Sering terjadi ketidakcocokan jumlah linen kotor yang dikirim staf housekeeping dengan jumlah yang diterima oleh staf laundry. Ketiadaan bukti serah terima formal memicu sengketa tanpa dasar pertanggungjawaban yang jelas.
2. **Ketiadaan Status Transit (*Blind Spot*)**:
   Ketika linen sedang diangkut antara kamar/villa dan laundry, barang tidak tercatat dalam sistem, menciptakan celah terjadinya kehilangan aset (*asset shrinkage*).
3. **Keterlambatan Deteksi Penurunan Stok (*Stockout Risk*)**:
   Manajemen sering terlambat mengetahui bahwa stok linen siap pakai di gudang telah berada di bawah ambang batas aman (*par stock*), yang berdampak pada keterlambatan kesiapan kamar tamu saat *peak season*.
4. **Kalkulasi Kerugian Aset Afkir Manual**:
   Linen yang rusak robek atau bernoda permanen sering kali hanya ditumpuk tanpa pencatatan finansial berkala, menyulitkan penyusunan proposal anggaran pengadaan baru.

### 2.2. Solusi yang Dihadirkan
Sistem menyediakan solusi digital komprehensif dengan:
* Mekanisme **Transit Stock** dan **Two-Way Handover Verification** (Serah Terima dengan toleransi deteksi selisih).
* Fitur **Dispute Resolution** untuk persetujuan selisih atau pembatalan transaksi secara transparan.
* **Notification Badge** real-time pada menu Serah Terima.
* Pemantauan **Par Stock Health Indicator** 3 tingkat (Aman, Peringatan, Kritis).
* **Kalkulator Okupansi Harian** (Hotel & Villa) dengan proyeksi kebutuhan unit linen harian.
* Otomasi pemotongan aset aktif saat pelaporan barang rusak (*condemned*).
* Modul **Rekomendasi Pengadaan & Estimasi Anggaran Biaya**.
* **Laporan Bulanan** dengan fitur Cetak (*Print*) dan Ekspor CSV.

---

## 3. Goals & Non-Goals

### Goals
* Menjamin transparansi status inventaris linen di 5 lokasi: Gudang Bersih (*Clean*), Sedang Dicuci (*Laundry*), Kamar Hotel (*In-Room*), Villa (*In-Villa*), dan Rusak/Afkir (*Condemned*).
* Memberikan kepastian akuntabilitas serah terima antar-departemen melalui alur konfirmasi dua pihak.
* Menyediakan antarmuka mobile-first yang intuitif bagi staf lapangan (dengan tombol cepat +1, +5, +10, -5).
* Menghitung secara otomatis kebutuhan pengadaan dan estimasi anggaran dalam Rupiah.
* Menyediakan laporan rekapitulasi yang siap dicetak dan diekspor ke format CSV.

### Non-Goals
* Sistem tidak menangani modul *point of sale* (POS) atau reservasi kamar tamu eksternal.
* Sistem tidak memproses transaksi pembayaran perbankan/finansial langsung ke supplier vendor (sistem hanya menghasilkan rekomendasi pengadaan dan estimasi anggaran).

---

## 4. User Personas & Permissions Matrix

| Modul / Fitur | Admin / Executive Housekeeper | Staf Housekeeping | Staf Laundry |
|---|:---:|:---:|:---:|
| **Dashboard KPI & Par Stock Health** | ✅ Lihat Semua | ✅ Lihat Semua | ✅ Lihat Semua |
| **Kalkulator Okupansi Harian (Set)** | ✅ Baca & Ubah | ❌ Hanya Baca | ❌ Hanya Baca |
| **Transaksi Sirkulasi Kotor (Hotel/Villa $\rightarrow$ Laundry)** | ✅ Buat & Lihat | ✅ Buat & Lihat | ❌ Tidak Berwenang |
| **Transaksi Sirkulasi Bersih (Laundry $\rightarrow$ Gudang)** | ✅ Buat & Lihat | ❌ Tidak Berwenang | ✅ Buat & Lihat |
| **Distribusi Bersih ke Kamar/Villa** | ✅ Buat & Lihat | ✅ Buat & Lihat | ❌ Tidak Berwenang |
| **Serah Terima & Verifikasi Fisik** | ✅ Semua Rute | ✅ Linen Bersih Masuk | ✅ Linen Kotor Masuk |
| **Penyelesaian Selisih (Dispute Resolution)** | ✅ Hak Override Penuh | ✅ Transaksi Miliknya | ✅ Transaksi Miliknya |
| **Badge Notifikasi Serah Terima** | ✅ Sesuai Tugas | ✅ Sesuai Tugas | ✅ Sesuai Tugas |
| **Pencatatan Kondisi (Good, Stained, Damaged)** | ✅ Buat & Lihat | ✅ Buat & Lihat | ✅ Buat & Lihat |
| **Rekomendasi Pengadaan & Anggaran** | ✅ Akses Penuh | ❌ Tidak Ada Akses | ❌ Tidak Ada Akses |
| **Laporan Bulanan, Cetak & Ekspor CSV** | ✅ Akses Penuh | ❌ Tidak Ada Akses | ❌ Tidak Ada Akses |
| **Riwayat Transaksi & Audit Log** | ✅ Akses Penuh | ❌ Tidak Ada Akses | ❌ Tidak Ada Akses |
| **Kelola Pengguna (Tambah Staf Baru)** | ✅ Akses Penuh | ❌ Tidak Ada Akses | ❌ Tidak Ada Akses |

---

## 5. Functional Requirements (FR)

### Modul 1: Dashboard Utama & Analisis
* **FR-001 [KPI Cards Ringkasan Stok]**: Sistem wajib menampilkan metrik jumlah unit linen secara real-time pada 5 titik penempatan: Gudang Bersih, Sedang Dicuci di Laundry, Terpasang di Kamar Hotel, Terpasang di Villa, dan Total Afkir.
* **FR-002 [Indikator Kesehatan Par Stock]**: Sistem wajib menampilkan status kesehatan stok aktif per item linen:
  * 🟢 **Aman**: Stok Aktif $\ge$ Target Par Stock.
  * 🟡 **Peringatan**: Stok Aktif berada pada rentang 80% hingga 99% dari Target Par Stock.
  * 🔴 **Kritis**: Stok Aktif $<$ 80% dari Target Par Stock (di bawah batas minimum peringatan).
* **FR-003 [Kalkulator Okupansi Harian]**:
  * Sistem menyediakan formulir input angka kamar hotel dan villa yang terisi.
  * Sistem wajib menghitung proyeksi kebutuhan unit linen per item secara otomatis berdasarkan rasio standar per kamar dan per villa (villa dihitung 2x standar kamar).

### Modul 2: Transaksi Sirkulasi & Serah Terima
* **FR-004 [Formulir Sirkulasi Multi-Rute]**:
  * Sistem mendukung pemilihan jenis transaksi resmi: `DIRTY_HOTEL_TO_LAUNDRY`, `DIRTY_VILLA_TO_LAUNDRY`, `LAUNDRY_TO_CLEAN`, `CLEAN_TO_HOTEL`, dan `CLEAN_TO_VILLA`.
  * Sistem wajib menyediakan tombol kuantitas cepat (+1, +5, +10, -5) untuk mempermudah staf mobile.
  * Sistem wajib memvalidasi kecukupan stok sumber sebelum transaksi diizinkan (*negative stock prevention*).
* **FR-005 [Penerapan Transit Stock]**:
  * Saat transaksi antar-divisi dibuat, stok sumber langsung dikurangi dan dipindahkan ke `transitStock`.
  * Status transaksi awal adalah `PENDING`.
* **FR-006 [Verifikasi Serah Terima Fisik]**:
  * Penerima memeriksa barang di menu "Serah Terima".
  * Jika jumlah cocok, penerima mengklik **"Terima Barang"**, status transaksi berubah menjadi `ACCEPTED`, dan stok dipindahkan dari transit ke lokasi penerima.
  * Jika ditemukan selisih, penerima mengubah kuantitas diterima dan wajib menyertakan catatan selisih (*dispute notes*). Status transaksi berubah menjadi `DISPUTED`.
* **FR-007 [Penyelesaian Sengketa / Dispute Resolution]**:
  * Pada transaksi `DISPUTED`, pihak pengirim atau Admin dapat memilih:
    * **Setujui Selisih**: Mengakui kuantitas baru yang diterima; sisa kuantitas dikembalikan ke stok asal pengirim. Status menjadi `ACCEPTED`.
    * **Batal Total**: Membatalkan serah terima dan mengembalikan seluruh barang transit ke stok awal pengirim. Status menjadi `REJECTED`.
* **FR-008 [Badge Notifikasi Real-Time]**:
  * Menu "Serah Terima" menampilkan badge melingkar hijau limau (*lime badge*) dengan angka yang menunjukkan total tugas verifikasi atau dispute yang menunggu tindakan dari role yang sedang aktif.
  * Angka notifikasi diperbarui otomatis secara berkala (polling setiap 15 detik) dan saat perpindahan rute halaman.

### Modul 3: Manajemen Kondisi & Afkir
* **FR-009 [Pelaporan Kondisi Linen]**:
  * Staf dapat mencatat kondisi linen: `GOOD`, `STAINED`, atau `DAMAGED`.
  * Jika kondisi `DAMAGED` (Afkir Permanen) dilaporkan, sistem secara otomatis memotong stok bersih gudang dan total aset hotel, serta menambahkannya ke `condemnedStock`.

### Modul 4: Pengadaan & Laporan
* **FR-010 [Rekomendasi Pengadaan & Anggaran]**:
  * Sistem secara otomatis menghitung defisit stok terhadap target ideal par stock:
    $$\text{Defisit} = \max(0, \text{Target Par Stock} - \text{Stok Aktif})$$
  * Menghitung estimasi total anggaran biaya penggantian dalam Rupiah (`Defisit × Harga Satuan`).
* **FR-011 [Laporan Rekapitulasi Bulanan & Ekspor]**:
  * Menyajikan tabel distribusi linen aktif dan tabel kerugian aset afkir.
  * Menyediakan fitur **Ekspor CSV** untuk pengolahan di spreadsheet.
  * Menyediakan fitur **Cetak Laporan** dengan tata letak rapi (*print-friendly stylesheet*).

### Modul 5: Riwayat, Keamanan & Pengguna
* **FR-012 [Riwayat Transaksi & Audit Log]**:
  * Menyediakan penelusuran riwayat sirkulasi dan log kondisi barang.
  * Dilengkapi filter pencarian teks (*live search*), filter rentang tanggal (*start/end date*), pagination server-side, dan pengaturan batas data per halaman.
* **FR-013 [Manajemen Pengguna]**:
  * Admin dapat mendaftarkan akun staf baru dengan nama, email, password terenkripsi, dan pemilihan role.
* **FR-014 [Autentikasi & Kontrol Sesi]**:
  * Autentikasi aman berbasis NextAuth Credentials Provider dengan enkripsi bcrypt.
  * Logout aman yang mengarahkan kembali ke halaman login domain asal.

---

## 6. Non-Functional Requirements (NFR)

* **NFR-001 [Keamanan & Integritas]**:
  * Setiap Server Action memvalidasi otorisasi sesi dan role pengguna.
  * Password disimpan dalam bentuk hash bcrypt (salt 10).
  * Penggunaan parameterized queries melalui Prisma ORM mencegah kerentanan SQL Injection.
* **NFR-002 [Konsistensi Data Transaksional]**:
  * Seluruh operasi multi-tabel dibungkus dalam transaksi ACID (`prisma.$transaction`) dengan proteksi timeout untuk mencegah deadlock dan race condition.
* **NFR-003 [Responsivitas & Desain Mobile-First]**:
  * Antarmuka dioptimalkan untuk perangkat layar sentuh staf lapangan dengan touch target minimal 44x44px.
  * Menggunakan drawer slide-over pada tampilan mobile dan sidebar tetap pada desktop.
* **NFR-004 [Kestabilan Antarmuka (No Layout Shift)]**:
  * Seluruh tombol submit/aksi menggunakan centered loading spinner yang mempertahankan lebar dan tinggi tombol asli saat status loading aktif.
* **NFR-005 [Aksesibilitas Visual]**:
  * Mendukung mode gelap (*dark mode*) dan mode terang (*light mode*) dengan kontras warna yang memenuhi standar WCAG 2.1 AA.
* **NFR-006 [Efisiensi & Waktu Respons]**:
  * Query penghitungan notifikasi serah terima dijalankan secara paralel (`Promise.all`) dengan eksekusi query $<$ 50ms.

---

## 7. Master Data Linen Standar Hotel

Berikut adalah konfigurasi master data linen awal yang digunakan dalam sistem Hotel Green Star Park:

| Nama Item Linen | Harga Satuan (Rp) | Target Par Stock | Batas Minimal Alert | Standar Kamar Hotel | Standar Unit Villa |
|---|---|---|---|---|---|
| **Duvet Cover** | Rp 150.000 | 150 unit | 50 unit | 1 unit | 2 unit |
| **Sheet / Sprei** | Rp 95.000 | 300 unit | 100 unit | 2 unit | 4 unit |
| **Pillow Case** | Rp 25.000 | 450 unit | 150 unit | 4 unit | 8 unit |
| **Bath Towel** | Rp 65.000 | 300 unit | 100 unit | 2 unit | 4 unit |
| **Face Towel** | Rp 20.000 | 250 unit | 80 unit | 2 unit | 4 unit |
| **Bath Mat** | Rp 35.000 | 120 unit | 40 unit | 1 unit | 2 unit |

---

## 8. Acceptance Criteria (Kriteria Keberhasilan)

1. Staf Housekeeping dapat mengirimkan linen kotor dan stok langsung tercatat mengambang di `transitStock`.
2. Staf Laundry menerima notifikasi badge angka di menu Serah Terima secara real-time tanpa perlu me-refresh halaman.
3. Selisih serah terima dapat dilaporkan dan diselesaikan secara terekam melalui opsi "Setujui Selisih" atau "Batal Total".
4. Pelaporan barang rusak (`DAMAGED`) secara otomatis mengurangi stok aktif dan total aset hotel tanpa intervensi manual.
5. Indikator Par Stock Health menampilkan status warna yang sesuai dengan rasio ketersediaan stok fisik.
6. Laporan bulanan dapat diekspor ke format CSV yang valid dan dapat dicetak rapi melalui dialog print peramban.
7. Aplikasi bebas dari error navigasi logout dan seluruh tombol aksi memiliki indikator loading terpusat yang mulus.
