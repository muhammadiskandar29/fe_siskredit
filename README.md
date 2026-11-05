# SPK Kelayakan Kredit Koperasi Karyawan Al-Azhar BSD (Metode SMART)
## Fullstack Next.js (Node.js + React + Prisma ORM) — Siap Deploy ke Vercel

Aplikasi Sistem Penunjang Keputusan (SPK) Pemberian Pinjaman Koperasi Konsumen Karyawan Perguruan Al-Azhar BSD menggunakan metode **SMART (Simple Multi-Attribute Rating Technique)**. Dibangun dengan arsitektur **Fullstack Node.js Monolith** (Frontend & Backend dalam 1 proyek) yang dirancang khusus untuk kemudahan hosting di **Vercel** dan integrasi **Vercel Postgres**.

---

## 🚀 Fitur Utama Sistem

1. **Multi-Level User Role (3 Peran Pengguna):**
   - **Anggota (Pemohon):** Pengajuan pinjaman daring, pelacakan status berkas *real-time*, unduh e-SK Surat Keputusan persetujuan resmi, dan jadwal angsuran bulanan.
   - **Petugas Simpan Pinjam (Admin/Verifikator):** Verifikasi berkas, validasi batas sisa THP (40%–60%), manajemen master kriteria $C_1 - C_5$ & sub-kriteria, kalkulasi otomatis skor utilitas & perangkingan SMART, serta konfirmasi pembayaran cicilan.
   - **Ketua Koperasi (Approver):** Penelaahan daftar rekomendasi SMART, otorisasi persetujuan digital (*1-Click Digital Approval*), penerbitan e-SK QR Code resmi, dan konfirmasi pencairan dana transfer rekening Muamalat.
2. **Laboratorium Riset SPK (Simulasi Penelitian):**
   - Panel khusus pengujian simulasi pembobotan alternatif baru ($A_1, A_2, \dots$) tanpa mengganggu database operasional nyata.
3. **Pemberitahuan Realtime (Notification Dropdown):**
   - Notifikasi alur pengajuan, jadwal angsuran, dan persetujuan secara otomatis ke akun masing-masing pengguna.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5
- **Frontend UI:** React 19, Tailwind CSS 4, Lucide React
- **Backend API:** Next.js Route Handlers (Node.js Serverless)
- **Database ORM:** Prisma ORM 6
- **Database Target:** Vercel Postgres / Neon / PostgreSQL Cloud (Gratis)
- **Authentication:** JWT (JsonWebToken) & Bcrypt Password Hashing

---

## 👤 Akun Bawaan (Default Seed Accounts)

| Peran / Aktor | Email Login | Password Default |
| :--- | :--- | :--- |
| **Petugas Simpin (Admin)** | `petugas.simpin@alazhar.org` | `password` |
| **Ketua Koperasi (Approver)** | `ketua.koperasi@alazhar.org` | `password` |
| **Anggota (Pemohon A1)** | `achmad.sobari@alazhar.org` | `password` |
| **Anggota (Pemohon A2)** | `moh.ridwan@alazhar.org` | `password` |
| **Anggota (Pemohon A3)** | `fitriyanti@alazhar.org` | `password` |

---

## 💻 Cara Menjalankan di Komputer Lokal

1. **Masuk ke folder proyek:**
   ```bash
   cd spk-koperasi
   ```

2. **Salin file konfigurasi environment:**
   ```bash
   cp .env.example .env
   ```

3. **Inisialisasi Skema Database (Prisma):**
   ```bash
   npm run db:push
   ```

4. **Isi Data Awal (Seeder):**
   ```bash
   npm run db:seed
   ```

5. **Jalankan Web Server Lokal:**
   ```bash
   npm run dev
   ```
   Buka peramban di: `http://localhost:3000`

---

## ☁️ Panduan Lengkap Deploy ke Vercel

### Langkah 1: Simpan ke GitHub
1. Buat repositori baru di [GitHub](https://github.com/new) (misal: `spk-koperasi`).
2. Di terminal folder `spk-koperasi`, jalankan:
   ```bash
   git add .
   git commit -m "feat: inisialisasi SPK Koperasi Fullstack Node.js Next.js"
   git branch -M main
   git remote add origin https://github.com/USERNAME_KAMU/spk-koperasi.git
   git push -u origin main
   ```

### Langkah 2: Hubungkan ke Vercel
1. Buka [Vercel Dashboard](https://vercel.com/dashboard) dan klik **Add New... $\rightarrow$ Project**.
2. Pilih repository `spk-koperasi` dari akun GitHub kamu, lalu klik **Import**.
3. Di bagian **Environment Variables**, tambahkan:
   - `JWT_SECRET`: `spk-koperasi-secret-key-2026-alazhar-bsd`
4. Klik tombol **Deploy** dan tunggu 1 menit hingga selesai.

### Langkah 3: Sambungkan Database Gratis Vercel Postgres
1. Di dashboard proyek kamu di Vercel, buka tab **Storage**.
2. Klik **Create Database $\rightarrow$ Postgres $\rightarrow$ Continue**.
3. Pilih region terdekat (misal: `Singapore (sin1)`), klik **Create**.
4. Di bagian **Connect to Project**, pilih proyek `spk-koperasi` kamu.
5. Vercel secara otomatis akan menginjeksi environment variables:
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`

### Langkah 4: Sinkronisasi Tabel & Data Awal di Cloud
Di komputer lokal kamu:
1. Di Vercel tab **Storage $\rightarrow$ Quickstart $\rightarrow$ .env.local**, salin variabel koneksi `POSTGRES_PRISMA_URL` dan `POSTGRES_URL_NON_POOLING` ke file `.env` di komputermu.
2. Jalankan perintah migrasi & seed ke cloud:
   ```bash
   npm run db:push
   npm run db:seed
   ```
3. Selesai! Web aplikasi kamu kini **100% aktif dan dapat diakses publik dari mana saja** via link Vercel kamu (misal: `https://spk-koperasi.vercel.app`).
