import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database for SPK Koperasi SMART Al-Azhar BSD...');
  const passwordHash = await bcrypt.hash('password', 10);

  // 1. Seed Users
  const petugas = await prisma.user.upsert({
    where: { email: 'petugas.simpin@alazhar.org' },
    update: {},
    create: {
      nik: 'SIMPIN001',
      name: 'Koordinator Simpan Pinjam',
      email: 'petugas.simpin@alazhar.org',
      password: passwordHash,
      role: 'petugas_simpin',
      unit_kerja: 'LAKHAR',
      status_pegawai: 'TETAP',
      masa_kerja_tahun: 10,
      no_hp: '081288997766',
    },
  });

  const ketua = await prisma.user.upsert({
    where: { email: 'ketua.koperasi@alazhar.org' },
    update: {},
    create: {
      nik: 'KETUA001',
      name: 'Arrizal Muhaemin Yunus, M.Pd',
      email: 'ketua.koperasi@alazhar.org',
      password: passwordHash,
      role: 'ketua_koperasi',
      unit_kerja: 'LAKHAR',
      status_pegawai: 'TETAP',
      masa_kerja_tahun: 15,
      no_hp: '081199887766',
    },
  });

  const membersData = [
    {
      nik: '3209071808830004',
      name: 'Achmad Sobari',
      email: 'achmad.sobari@alazhar.org',
      unit_kerja: 'LAKHAR',
      status_pegawai: 'TETAP',
      masa_kerja_tahun: 6,
      no_hp: '081282999885',
      no_rekening_muamalat: '3910000280',
      nama_rekening: 'Achmad Sobari',
      simpanan_wajib: 5500000,
      sisa_thp_persen: 55.0,
    },
    {
      nik: '3209071905880002',
      name: 'Moh Ridwan',
      email: 'moh.ridwan@alazhar.org',
      unit_kerja: 'Luar Biasa',
      status_pegawai: 'KONTRAK',
      masa_kerja_tahun: 2,
      no_hp: '081377889900',
      no_rekening_muamalat: '3910000281',
      nama_rekening: 'Moh Ridwan',
      simpanan_wajib: 3200000,
      sisa_thp_persen: 45.0,
    },
    {
      nik: '3209072401920001',
      name: 'Fitriyanti',
      email: 'fitriyanti@alazhar.org',
      unit_kerja: 'Unit SD',
      status_pegawai: 'TETAP',
      masa_kerja_tahun: 4,
      no_hp: '081233445566',
      no_rekening_muamalat: '3910000282',
      nama_rekening: 'Fitriyanti',
      simpanan_wajib: 6000000,
      sisa_thp_persen: 52.0,
    },
    {
      nik: '3209071203870005',
      name: 'Ahmad NurHayadi',
      email: 'ahmad.nurhayadi@alazhar.org',
      unit_kerja: 'Unit Metland',
      status_pegawai: 'KONTRAK',
      masa_kerja_tahun: 3,
      no_hp: '081399001122',
      no_rekening_muamalat: '3910000283',
      nama_rekening: 'Ahmad NurHayadi',
      simpanan_wajib: 2000000,
      sisa_thp_persen: 42.0,
    },
    {
      nik: '3209070908800003',
      name: 'Dedi Hidayat',
      email: 'dedi.hidayat@alazhar.org',
      unit_kerja: 'Unit SD',
      status_pegawai: 'TETAP',
      masa_kerja_tahun: 12,
      no_hp: '081255667788',
      no_rekening_muamalat: '3910000284',
      nama_rekening: 'Dedi Hidayat',
      simpanan_wajib: 7500000,
      sisa_thp_persen: 48.0,
    },
  ];

  const createdMembers: any[] = [];
  for (const m of membersData) {
    const user = await prisma.user.upsert({
      where: { email: m.email },
      update: {},
      create: {
        ...m,
        password: passwordHash,
        role: 'anggota',
      },
    });
    createdMembers.push(user);
  }

  // 2. Seed Criteria and Sub-Criteria
  const criteriaData = [
    {
      code: 'C1',
      name: 'Sisa Take Home Pay (THP)',
      type: 'benefit',
      weight: 30,
      normalized_weight: 0.3,
      order_num: 1,
      sub: [
        { label: 'Sisa THP >= 60%', score: 100, order_num: 1 },
        { label: 'Sisa THP 50% - 59%', score: 75, order_num: 2 },
        { label: 'Sisa THP 40% - 49%', score: 50, order_num: 3 },
        { label: 'Sisa THP < 40%', score: 25, order_num: 4 },
      ],
    },
    {
      code: 'C2',
      name: 'Jumlah Simpanan Wajib',
      type: 'benefit',
      weight: 20,
      normalized_weight: 0.2,
      order_num: 2,
      sub: [
        { label: 'Simpanan > Rp 5.000.000', score: 100, order_num: 1 },
        { label: 'Simpanan Rp 3.000.000 - Rp 5.000.000', score: 75, order_num: 2 },
        { label: 'Simpanan Rp 1.000.000 - Rp 2.999.999', score: 50, order_num: 3 },
        { label: 'Simpanan < Rp 1.000.000', score: 25, order_num: 4 },
      ],
    },
    {
      code: 'C3',
      name: 'Masa Kerja & Status Pegawai',
      type: 'benefit',
      weight: 20,
      normalized_weight: 0.2,
      order_num: 3,
      sub: [
        { label: 'Pegawai Tetap > 5 Tahun', score: 100, order_num: 1 },
        { label: 'Pegawai Tetap 1 - 5 Tahun', score: 75, order_num: 2 },
        { label: 'Pegawai Kontrak > 2 Tahun', score: 50, order_num: 3 },
        { label: 'Pegawai Kontrak <= 2 Tahun', score: 25, order_num: 4 },
      ],
    },
    {
      code: 'C4',
      name: 'Riwayat Pinjaman Sebelumnya',
      type: 'benefit',
      weight: 15,
      normalized_weight: 0.15,
      order_num: 4,
      sub: [
        { label: 'Sangat Lancar / Tidak Pernah Nunggak', score: 100, order_num: 1 },
        { label: 'Pernah Meminjam & Lunas Tepat Waktu', score: 75, order_num: 2 },
        { label: 'Anggota Baru / Belum Ada Riwayat', score: 50, order_num: 3 },
        { label: 'Pernah Ada Penyesuaian Tenor', score: 25, order_num: 4 },
      ],
    },
    {
      code: 'C5',
      name: 'Jumlah Pengajuan Pinjaman',
      type: 'cost',
      weight: 15,
      normalized_weight: 0.15,
      order_num: 5,
      sub: [
        { label: '<= Rp 5.000.000', score: 25, order_num: 1 },
        { label: 'Rp 5.000.001 - Rp 10.000.000', score: 50, order_num: 2 },
        { label: 'Rp 10.000.001 - Rp 15.000.000', score: 75, order_num: 3 },
        { label: 'Rp 15.000.001 - Rp 20.000.000', score: 100, order_num: 4 },
      ],
    },
  ];

  for (const c of criteriaData) {
    const criterion = await prisma.criterion.upsert({
      where: { code: c.code },
      update: {
        name: c.name,
        type: c.type,
        weight: c.weight,
        normalized_weight: c.normalized_weight,
        order_num: c.order_num,
      },
      create: {
        code: c.code,
        name: c.name,
        type: c.type,
        weight: c.weight,
        normalized_weight: c.normalized_weight,
        order_num: c.order_num,
      },
    });

    for (const s of c.sub) {
      await prisma.subCriterion.create({
        data: {
          criterion_id: criterion.id,
          label: s.label,
          score: s.score,
          order_num: s.order_num,
        },
      });
    }
  }

  // 3. Seed Sample Loan Application (Achmad Sobari)
  const sobari = createdMembers[0];
  const sampleLoan = await prisma.loanApplication.upsert({
    where: { nomor_pengajuan: 'PINJ-202603-001' },
    update: {},
    create: {
      user_id: sobari.id,
      nomor_pengajuan: 'PINJ-202603-001',
      nominal_pengajuan: 15000000,
      tenor_bulan: 12,
      tujuan_pinjaman: 'Biaya Pendidikan & Renovasi Rumah',
      sisa_thp_persen: 55.0,
      simpanan_wajib: 5500000,
      status_pegawai: 'TETAP',
      masa_kerja_tahun: 6,
      riwayat_pinjaman: 'Sangat Lancar / Lunas Tepat Waktu',
      status: 'approved',
      verification_token: 'KOPKAR-SOBARI-2026-0001',
      catat_verifikasi: 'Berkas dan batas sisa THP memenuhi ketentuan SOP',
      catat_approval: 'Disetujui penuh oleh Ketua Koperasi',
      approved_at: new Date(),
    },
  });

  // SMART Evaluation for sampleLoan (A1)
  await prisma.smartEvaluation.upsert({
    where: { loan_application_id: sampleLoan.id },
    update: {},
    create: {
      loan_application_id: sampleLoan.id,
      alternative_code: 'A1',
      candidate_name: sobari.name,
      candidate_nik: sobari.nik,
      candidate_unit: sobari.unit_kerja,
      candidate_plafon: 15000000,
      val_c1: 75,
      val_c2: 100,
      val_c3: 100,
      val_c4: 100,
      val_c5: 75,
      utility_c1: 66.67,
      utility_c2: 100,
      utility_c3: 100,
      utility_c4: 100,
      utility_c5: 33.33,
      final_score: 80.0,
      rank: 1,
      recommendation: 'Sangat Layak (Disetujui Penuh)',
      calculated_at: new Date(),
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
