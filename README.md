# Sistem Informasi Manajemen Alur Stok Linen Hotel

### Studi Kasus: Hotel & Resort Green Star Park Simalungun

Aplikasi web modern berbasis **Next.js (App Router)** dan **TypeScript** yang dirancang khusus untuk mendigitalkan, mengontrol, dan memantau seluruh siklus peredaran inventaris linen di **Hotel Green Star Park Simalungun**—mulai dari gudang bersih (_clean storage_), penataan di kamar hotel & villa, pencucian di laundry, hingga rekonsiliasi serah terima dan pencatatan linen afkir (_condemned_).

Proyek ini dikembangkan sebagai pemenuhan **Capstone Project / Tugas Akhir Perkuliahan**, dengan menitikberatkan pada integritas data, pencegahan _asset loss_, akuntabilitas serah terima antar-departemen, serta kenyamanan antarmuka bagi staf operasional lapangan (_mobile-first_).

---

## 📌 Daftar Isi

1. [Latar Belakang & Masalah](#-latar-belakang--masalah)
2. [Fitur Unggulan Sistem](#-fitur-unggulan-sistem)
3. [Tumpukan Teknologi (Tech Stack)](#-tumpukan-teknologi-tech-stack)
4. [Hak Akses & Pengguna (User Roles)](#-hak-akses--pengguna-user-roles)
5. [Panduan Alur Penggunaan (User Workflow)](#-panduan-alur-penggunaan-user-workflow)
6. [Panduan Instalasi & Menjalankan Aplikasi](#-panduan-instalasi--menjalankan-aplikasi)
7. [Akun Uji Coba Default (Demo Accounts)](#-akun-uji-coba-default-demo-accounts)
8. [Struktur Direktori Proyek](#-struktur-direktori-proyek)

---

## 🏨 Latar Belakang & Masalah

Pada industri perhotelan dan resort, linen (seperti sprei, sarung bantal, selimut duvet, hingga handuk mandi) merupakan aset sirkulasi bernilai tinggi yang bergerak dinamis setiap hari. Di Hotel Green Star Park, sirkulasi linen mencakup dua tipe akomodasi utama: **kamar hotel** dan **unit villa**, serta dua divisi operasional: **Housekeeping** dan **Laundry**.

Sebelum adanya sistem ini, operasional menghadapi beberapa kendala krusial:

- **Selisih Hitung Tanpa Jejak Audit**: Jumlah linen kotor yang dikirim sering kali berbeda dengan yang diterima di laundry tanpa ada bukti verifikasi formal.
- **Ketiadaan Status Transit**: Linen yang sedang dalam perjalanan tidak tercatat posisinya, memicu saling tuduh jika terjadi kehilangan barang.
- **Keterlambatan Deteksi Stok Kritis (_Par Stock Depletion_)**: Penurunan stok akibat pencucian bertumpuk atau linen rusak terlambat disadari, berisiko mengganggu kesiapan kamar untuk tamu baru.
- **Pencatatan Afkir Manual**: Kerugian akibat linen robek (_damaged_) atau bernoda permanen (_stained_) tidak terkalkulasi secara otomatis ke dalam anggaran pengadaan.

**Solusi yang Dihadirkan**: Sistem ini menerapkan mekanisme **Transit Stock**, **Two-Way Handover Verification & Dispute Resolution**, **Real-Time Notification Badge**, serta **Par Stock Health Monitoring** untuk memastikan seluruh aset linen hotel terpantau secara transparan dan akuntabel.

---

## ✨ Fitur Unggulan Sistem

### 1. Dashboard Utama & Indikator Kesehatan Par Stock

- **Real-Time KPI Cards**: Menampilkan jumlah stok di 5 titik sekaligus: Gudang Bersih (_Clean_), Sedang Dicuci (_Laundry_), Terpasang di Kamar (_In-Room_), Terpasang di Villa (_In-Villa_), dan Rusak/Afkir (_Condemned_).
- **Par Stock Health Indicator**: Visualisasi otomatis status kelayakan kuota linen dengan 3 tingkatan:
  - 🟢 **Aman**: Stok aktif $\ge$ Target Par Stock.
  - 🟡 **Peringatan**: Stok aktif 80% - 99% dari Target Par Stock.
  - 🔴 **Kritis**: Stok aktif $<$ 80% (di bawah batas minimum peringatan).
- **Kalkulator Okupansi Harian**: Form input jumlah kamar hotel dan villa terisi yang langsung menghitung proyeksi kebutuhan unit linen per item berdasarkan standar hotel.

### 2. Transaksi Sirkulasi Linen Multi-Rute

- Mendukung 5 rute distribusi linen resmi:
  1. `Kamar Hotel -> Laundry` (Pengiriman linen kotor hotel)
  2. `Villa -> Laundry` (Pengiriman linen kotor villa)
  3. `Laundry -> Gudang Bersih` (Pengiriman linen bersih dari laundry ke gudang housekeeping)
  4. `Gudang Bersih -> Kamar Hotel` (Distribusi internal penataan kamar hotel)
  5. `Gudang Bersih -> Villa` (Distribusi internal penataan villa)
- **Quick Count Buttons**: Tombol kuantitas cepat (+1, +5, +10, -5) yang memudahkan staf saat bekerja menggunakan smartphone atau tablet di lapangan.
- Validasi stok real-time langsung di sisi server untuk mencegah _negative stock_.

### 3. Verifikasi Serah Terima & Penyelesaian Selisih (Handover & Dispute)

- **Konsep Transit Stock**: Saat pengirim membuat transaksi antar-divisi, linen tidak langsung masuk ke stok penerima, melainkan dialihkan sementara ke `transitStock`.
- **Penerimaan Barang**: Penerima mencocokkan jumlah fisik yang datang di menu **Serah Terima**:
  - **Jumlah Cocok**: Klik **"Terima Barang"**, status transaksi berubah menjadi `ACCEPTED`, dan stok berpindah dari transit ke lokasi tujuan secara otomatis.
  - **Terdapat Selisih**: Penerima dapat mengedit kuantitas yang diterima dan wajib mengisi catatan selisih (_dispute notes_). Transaksi berstatus `DISPUTED`.
- **Penyelesaian Selisih (_Dispute Resolution_)**:
  - Pihak pengirim atau Admin dapat meninjau sengketa di tab "Menunggu Konfirmasi".
  - **Setujui Selisih**: Mengakui kuantitas baru penerima; sisa barang yang hilang/tertinggal dikembalikan ke stok asal.
  - **Batal Total**: Membatalkan transaksi dan mengembalikan seluruh barang transit ke stok awal pengirim.
- **Badge Notifikasi Menu**: Indikator angka hijau limau cerah (_lime pill badge_) di menu navigasi "Serah Terima" yang diperbarui secara otomatis via polling berkala.

### 4. Pencatatan Kondisi Linen & Otomasi Pemotongan Afkir

- Staf dapat mendata kondisi linen:
  - `GOOD` (Kondisi baik/normal).
  - `STAINED` (Bernoda/perlu penanganan cuci ulang khusus).
  - `DAMAGED` (Rusak robek/afkir permanen).
- **Otomatisasi Aset**: Jika kondisi `DAMAGED` dilaporkan, sistem secara otomatis memotong stok gudang dan total aset hotel, serta menambahkannya ke `condemnedStock`.

### 5. Rekomendasi Pengadaan & Estimasi Anggaran

- Menghitung secara otomatis selisih kekurangan stok terhadap target kuota ideal (_par stock target_).
- Menampilkan rincian kebutuhan per item beserta estimasi total anggaran biaya penggantian dalam Rupiah (`Defisit × Harga Satuan`).

### 6. Laporan Bulanan, Cetak & Ekspor CSV

- Rekapitulasi distribusi sirkulasi linen aktif per item.
- Rekapitulasi nilai kerugian finansial akibat linen afkir.
- Fitur **Ekspor CSV** untuk pengolahan lebih lanjut di spreadsheet/Excel.
- Fitur **Cetak Laporan** teroptimasi format cetak (`@media print`) yang bersih tanpa elemen navigasi.

### 7. Riwayat Transaksi & Audit Log

- Menelusuri seluruh riwayat sirkulasi dan log kondisi barang.
- Dilengkapi filter pencarian teks (_live search_), filter rentang tanggal (_start/end date_), pagination server-side, dan pengaturan batas per halaman.

### 8. Manajemen Akun Pengguna

- Admin dapat mendaftarkan staf baru dengan peran yang sesuai langsung dari dashboard web.

### 9. Keunggulan Desain UI/UX

- **Centered Loading Animation**: Seluruh tombol aksi/submit memiliki animasi spinner terpusat di tengah tombol tanpa pergeseran dimensi tombol (_zero layout shift_).
- **Dark / Light Mode**: Mendukung peralihan tema terang dan gelap sesuai kenyamanan pengguna.
- **Responsif Sepenuhnya**: Layout desktop menggunakan sidebar tetap, sedangkan mobile menggunakan panel drawer geser (_slide-over sheet_).

---

## 🛠 Tumpukan Teknologi (Tech Stack)

| Kategori         | Teknologi                                                                   | Deskripsi                                                           |
| ---------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **Framework**    | [Next.js 16 (App Router)](https://nextjs.org/)                              | Framework React fullstack dengan Server Components & Server Actions |
| **Bahasa**       | [TypeScript](https://www.typescriptlang.org/)                               | Pengetikan statis untuk keandalan dan keamanan kode                 |
| **Library UI**   | [React 19](https://react.dev/)                                              | Library antarmuka komponen                                          |
| **Styling**      | [Tailwind CSS v4](https://tailwindcss.com/)                                 | Utilitas styling modern dan performan                               |
| **Komponen UI**  | [@base-ui/react](https://base-ui.com/), [Lucide React](https://lucide.dev/) | Komponen basis headless yang aksesibel dan kumpulan ikon            |
| **Notifikasi**   | [Sonner](https://sonner.emilkowal.ski/)                                     | Toast notification pop-up interaktif                                |
| **Database ORM** | [Prisma ORM v5](https://www.prisma.io/)                                     | Pemodelan skema, migrasi, dan type-safe database client             |
| **Basis Data**   | [PostgreSQL (Supabase)](https://supabase.com/)                              | Database relasional tangguh untuk cloud deployment                  |
| **Autentikasi**  | [NextAuth.js v4](https://next-auth.js.org/)                                 | Autentikasi berbasis JWT session dengan proteksi credentials        |
| **Kriptografi**  | [bcryptjs](https://github.com/dcodeIO/bcrypt.js)                            | Hashing kata sandi berstandar industri                              |

---

## 👥 Hak Akses & Pengguna (User Roles)

Sistem membedakan hak akses pengguna menjadi tiga peran:

```mermaid
graph TD
    User([Pengguna Login]) --> CheckRole{Role Pengguna}

    CheckRole -->|ADMIN_EXECUTIVE_HOUSEKEEPER| Admin[Admin / Executive Housekeeper]
    CheckRole -->|STAF_HOUSEKEEPING| HK[Staf Housekeeping]
    CheckRole -->|STAF_LAUNDRY| LD[Staf Laundry]

    Admin --> F1[Semua Modul & Dashboard]
    Admin --> F2[Pengadaan & Laporan Bulanan]
    Admin --> F3[Kelola Pengguna & Histori]
    Admin --> F4[Penyelesaian Selisih / Dispute]

    HK --> H1[Dashboard KPI]
    HK --> H2[Kirim Linen Kotor Hotel/Villa ke Laundry]
    HK --> H3[Terima Linen Bersih di Gudang]
    HK --> H4[Pelaporan Kondisi Linen di Kamar]

    LD --> L1[Dashboard KPI]
    LD --> L2[Terima Linen Kotor Masuk]
    LD --> L3[Kirim Linen Bersih ke Gudang]
    LD --> L4[Pelaporan Kondisi Cuci / Rewash]
```

1. **Admin / Executive Housekeeper (`ADMIN_EXECUTIVE_HOUSEKEEPER`)**:
   - Memiliki kendali penuh atas sistem.
   - Mengatur parameter okupansi kamar dan villa harian.
   - Mengakses rekomendasi pengadaan unit baru dan estimasi anggaran.
   - Mengunduh dan mencetak laporan sirkulasi serta kerugian aset bulanan.
   - Menyelesaikan semua perselisihan serah terima (_dispute override_).
   - Menambah dan mengelola akun staf.
2. **Staf Housekeeping (`STAF_HOUSEKEEPING`)**:
   - Membuat pengiriman linen kotor dari kamar hotel atau villa ke laundry.
   - Melakukan verifikasi dan serah terima linen bersih yang dikirim dari laundry ke gudang.
   - Melakukan distribusi penataan linen bersih ke kamar hotel & villa.
   - Mencatat kondisi linen (rusak/kotor) saat proses _room makeup_.
3. **Staf Laundry (`STAF_LAUNDRY`)**:
   - Melakukan verifikasi dan menerima linen kotor yang diserahkan dari housekeeping.
   - Mengirimkan linen yang telah selesai dicuci ke gudang housekeeping.
   - Mencatat status kondisi linen saat proses pencucian (misal: _stained_ untuk dicuci ulang).

---

## 🚀 Panduan Alur Penggunaan (User Workflow)

### Skenario Operasional Harian:

```mermaid
sequenceDiagram
    autonumber
    actor HK as Staf Housekeeping
    actor LD as Staf Laundry
    actor AD as Admin / Executive

    Note over HK,LD: 1. Penyerahan Linen Kotor
    HK->>HK: Buat Transaksi (Hotel/Villa -> Laundry)
    Note over HK: Stok dipotong, masuk transitStock
    LD-->>LD: Muncul Notifikasi Badge di menu "Serah Terima"

    Note over LD: 2. Pengecekan Fisik di Laundry
    alt Jumlah Sesuai
        LD->>LD: Klik "Terima Barang"
        Note over LD: Status ACCEPTED, masuk laundryStock
    else Jumlah Kurang / Selisih
        LD->>LD: Ubah Qty Diterima, isi Catatan Selisih
        LD->>LD: Klik "Konfirmasi Revisi"
        Note over LD: Status DISPUTED
        HK-->>HK: Transaksi masuk tab "Menunggu Konfirmasi"
        HK->>HK: Klik "Setujui Selisih" atau "Batal Total"
    end

    Note over LD,HK: 3. Pengembalian Linen Bersih
    LD->>LD: Buat Transaksi (Laundry -> Gudang Bersih)
    HK->>HK: Verifikasi di menu Serah Terima -> "Terima Barang"

    Note over AD: 4. Evaluasi & Pengawasan
    AD->>AD: Pantau Par Stock Health & Daily Occupancy
    AD->>AD: Buka Rekomendasi Pengadaan & Unduh Laporan CSV
```

---

## 💻 Panduan Instalasi & Menjalankan Aplikasi

### 1. Prasyarat Sistem

- [Node.js](https://nodejs.org/) versi 18.18.0 atau lebih baru.
- Database PostgreSQL (dapat menggunakan instance lokal atau cloud seperti [Supabase](https://supabase.com/)).
- Git.

### 2. Kloning Repositori

```bash
git clone https://github.com/arainsyawala/linen-management.git
cd linen-management
```

### 3. Instalasi Dependensi

```bash
npm install
```

### 4. Konfigurasi Environment Variables

Buat berkas `.env` di direktori utama (_root directory_) proyek:

```env
# URL Koneksi PostgreSQL (contoh Supabase)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Konfigurasi NextAuth
NEXTAUTH_SECRET="buat_string_rahasia_acak_minimal_32_karakter"
NEXTAUTH_URL="http://localhost:3000"
```

### 5. Sinkronisasi Database & Seeding Data

Jalankan perintah berikut untuk menginisialisasi skema tabel dan mengisi data awal (_users_ & master linen):

```bash
# Sinkronkan skema Prisma ke database
npx prisma db push

# Generate client Prisma
npx prisma generate

# Jalankan script seed data awal
npx prisma db seed
```

### 6. Menjalankan Server Pengembangan

```bash
npm run dev
```

Buka peramban (_browser_) Anda dan akses: **`http://localhost:3000`**

### 7. Membangun untuk Produksi (_Production Build_)

```bash
npm run build
npm run start
```

---

## 🔑 Akun Uji Coba Default (Demo Accounts)

Data awal hasil _seeding_ menyediakan akun siap pakai untuk menguji seluruh skenario alur kerja:

| Peran (Role)          | Alamat Email                 | Kata Sandi    | Deskripsi Penggunaan                                                         |
| --------------------- | ---------------------------- | ------------- | ---------------------------------------------------------------------------- |
| **Admin / Executive** | `admin@greenstar.com`        | `password123` | Akses penuh seluruh modul, pengadaan, histori, kelola staf, & laporan.       |
| **Staf Housekeeping** | `housekeeping@greenstar.com` | `password123` | Akses transaksi kamar/villa, serah terima linen bersih, pelaporan kondisi.   |
| **Staf Laundry**      | `laundry@greenstar.com`      | `password123` | Akses serah terima linen kotor, pengiriman linen bersih, penanganan selisih. |

---

## 📁 Struktur Direktori Proyek

```text
linen-management/
├── prisma/
│   ├── schema.prisma            # Skema definisi model database Prisma
│   └── seed.ts                  # Skrip seed user & master data linen
├── public/                      # Berkas aset statis (ikon, logo)
├── src/
│   ├── app/                     # Next.js App Router (Halaman & Server Actions)
│   │   ├── actions.ts           # Server Actions (Mutasi DB, Transaksi, Audit, Polling)
│   │   ├── layout.tsx           # Root Layout (ThemeProvider & AuthProvider)
│   │   ├── page.tsx             # Halaman Dashboard Utama & Okupansi
│   │   ├── condition/           # Modul Pencatatan Kondisi Linen
│   │   ├── handover/            # Modul Serah Terima & Verifikasi Selisih
│   │   ├── history/             # Modul Riwayat Transaksi & Audit Filter
│   │   ├── login/               # Halaman Masuk (NextAuth Credentials)
│   │   ├── procurement/         # Modul Rekomendasi Pengadaan & Anggaran
│   │   ├── reports/             # Modul Laporan Bulanan & Ekspor CSV
│   │   ├── transactions/        # Modul Form Transaksi Sirkulasi
│   │   └── users/               # Modul Pendaftaran Pengguna (Admin Only)
│   ├── components/              # Komponen antarmuka yang dapat digunakan ulang
│   │   ├── AppShell.tsx         # Sidebar navigasi, drawer mobile & badge notifikasi
│   │   ├── AuthProvider.tsx     # SessionProvider NextAuth
│   │   ├── OccupancySubmitButton.tsx # Tombol form occupancy dengan loading state
│   │   ├── ThemeProvider.tsx    # Provider tema Next-Themes
│   │   ├── ThemeToggle.tsx      # Tombol ganti tema (Dark/Light)
│   │   └── ui/                  # Komponen UI atomik (button, card, dialog, dll.)
│   └── lib/
│       ├── auth.ts              # Konfigurasi NextAuth (JWT callback, bcrypt check)
│       └── prisma.ts            # Inisialisasi Prisma Client singleton
├── ARCHITECTURE.md              # Dokumentasi arsitektur sistem & skema teknis
├── PRD.md                       # Product Requirement Document formal
└── README.md                    # Dokumentasi utama proyek

```
