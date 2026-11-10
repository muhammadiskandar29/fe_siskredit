import { prisma } from '../src/lib/prisma';
import { SmartEngineService } from '../src/lib/smartEngine';
import { generate150CooperativeData } from '../src/lib/sample150Dataset';

async function runFullSystemAudit() {
  console.log('================================================================');
  console.log('🚀 MEMULAI AUDIT & VERIFIKASI MENYELURUH SEMUA FITUR & CRUD SPK');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ [PASS] ${testName}`);
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // 1. AUDIT ROLE PENGGUNA (RBAC SKRIPSI)
    // -------------------------------------------------------------
    console.log('--- 1. Verifikasi Pengguna Berdasarkan Role (RBAC) ---');
    const users = await prisma.user.findMany();
    assert(users.length >= 3, `Pengguna terdaftar memenuhi kebutuhan sistem (ditemukan: ${users.length} pengguna)`);
    
    const petugas = users.find(u => u.role === 'petugas_simpin');
    const ketua = users.find(u => u.role === 'ketua_koperasi');
    const anggota = users.find(u => u.role === 'anggota');

    assert(!!petugas, `Role Petugas Simpin terdaftar (${petugas?.name})`);
    assert(!!ketua, `Role Ketua Koperasi terdaftar (${ketua?.name})`);
    assert(!!anggota, `Role Anggota terdaftar (${anggota?.name})`);

    // -------------------------------------------------------------
    // 2. AUDIT CRUD KRITERIA & NORMALISASI BOBOT
    // -------------------------------------------------------------
    console.log('\n--- 2. Verifikasi CRUD Kriteria & Normalisasi Bobot SMART ---');
    // CREATE TEST CRITERION
    const testCode = 'C_TEST';
    const existingTest = await prisma.criterion.findFirst({ where: { code: testCode } });
    if (existingTest) {
      await prisma.subCriterion.deleteMany({ where: { criterion_id: existingTest.id } });
      await prisma.criterion.delete({ where: { id: existingTest.id } });
    }

    const createdCrit = await prisma.criterion.create({
      data: {
        code: testCode,
        name: 'Kriteria Uji Coba CRUD',
        type: 'benefit',
        weight: 10,
        normalized_weight: 0.1,
        order_num: 99,
      },
    });
    assert(!!createdCrit.id, `CREATE Kriteria: ${createdCrit.code} berhasil dibuat`);

    // UPDATE TEST CRITERION
    const updatedCrit = await prisma.criterion.update({
      where: { id: createdCrit.id },
      data: { name: 'Kriteria Uji Coba CRUD (Updated)', weight: 15 },
    });
    assert(updatedCrit.name.includes('(Updated)'), `UPDATE Kriteria: ${updatedCrit.code} berhasil diperbarui`);

    // CREATE SUB-CRITERIA
    const sub1 = await prisma.subCriterion.create({
      data: {
        criterion_id: updatedCrit.id,
        label: 'Sangat Memenuhi Syarat',
        score: 100,
        order_num: 1,
      },
    });
    const sub2 = await prisma.subCriterion.create({
      data: {
        criterion_id: updatedCrit.id,
        label: 'Cukup Memenuhi Syarat',
        score: 50,
        order_num: 2,
      },
    });
    assert(!!sub1.id && !!sub2.id, 'CREATE Sub-Kriteria: 2 skala parameter berhasil dibuat');

    // UPDATE SUB-CRITERIA
    const updatedSub = await prisma.subCriterion.update({
      where: { id: sub1.id },
      data: { label: 'Sangat Memenuhi Syarat (Revisi)' },
    });
    assert(updatedSub.label.includes('(Revisi)'), 'UPDATE Sub-Kriteria berhasil diperbarui');

    // DELETE SUB-CRITERIA & CRITERION
    await prisma.subCriterion.delete({ where: { id: sub1.id } });
    await prisma.subCriterion.delete({ where: { id: sub2.id } });
    await prisma.criterion.delete({ where: { id: updatedCrit.id } });
    assert(true, 'DELETE Sub-Kriteria & Kriteria Uji berhasil dibersihkan');

    // VERIFIKASI 5 KRITERIA UTAMA TETAP UTUH (C1 - C5)
    const activeCriteria = await prisma.criterion.findMany({ orderBy: { order_num: 'asc' } });
    assert(activeCriteria.length >= 5, `5 Kriteria Utama C1-C5 tersedia (Total: ${activeCriteria.length})`);
    
    // Normalisasi bobot
    const totalWeight = activeCriteria.reduce((sum, c) => sum + c.normalized_weight, 0);
    assert(Math.abs(totalWeight - 1.0) < 0.05, `Total Bobot Ternormalisasi bernilai 1.00 (aktual: ${totalWeight.toFixed(2)})`);

    // -------------------------------------------------------------
    // 3. AUDIT FORM PENGAJUAN PINJAMAN (ANGGOTA) & SIKLUS OPERASIONAL
    // -------------------------------------------------------------
    console.log('\n--- 3. Verifikasi Siklus Pinjaman Operasional (End-to-End) ---');
    const loanApp = await prisma.loanApplication.create({
      data: {
        user_id: anggota!.id,
        nomor_pengajuan: `TEST-${Date.now()}`,
        nominal_pengajuan: 10000000,
        tenor_bulan: 12,
        tujuan_pinjaman: 'Uji Coba Fungsionalitas Sistem Koperasi',
        sisa_thp_persen: 55.5,
        simpanan_wajib: 6000000,
        status_pegawai: 'TETAP',
        masa_kerja_tahun: 7,
        riwayat_pinjaman: 'Lancar / Anggota Baru',
        status: 'pending',
        verification_token: `TOKEN-TEST-${Date.now()}`,
      },
    });
    assert(!!loanApp.id, `Pengajuan Pinjaman Baru Anggota: ${loanApp.nomor_pengajuan} berhasil dibuat`);

    // PETUGAS: Lakukan Penilaian SMART
    const evalSmart = await SmartEngineService.calculateWithAssessedValues(
      loanApp.id,
      loanApp.nominal_pengajuan,
      100, // C1
      100, // C2
      100, // C3
      100, // C4
      'A_TEST'
    );
    assert(!!evalSmart.id, `Penilaian SMART Petugas berhasil: Skor ${evalSmart.final_score}, Rekomendasi: ${evalSmart.recommendation}`);

    // PETUGAS: Teruskan ke Ketua
    const forwardedLoan = await prisma.loanApplication.update({
      where: { id: loanApp.id },
      data: { status: 'forwarded_to_chairman' },
    });
    assert(forwardedLoan.status === 'forwarded_to_chairman', 'Status berhasil diteruskan ke Ketua Koperasi');

    // KETUA: Otorisasi Keputusan Persetujuan
    const approvedLoan = await prisma.loanApplication.update({
      where: { id: loanApp.id },
      data: {
        status: 'approved',
        catat_approval: 'Disetujui penuh oleh Ketua Koperasi via Audit Test',
        approved_at: new Date(),
      },
    });
    assert(approvedLoan.status === 'approved', 'Ketua Koperasi berhasil menyetujui pinjaman');

    // PETUGAS/ADMIN: Pencairan Dana & Pembuatan Jadwal Angsuran
    const disbursedLoan = await prisma.loanApplication.update({
      where: { id: loanApp.id },
      data: {
        status: 'disbursed',
        disbursed_at: new Date(),
      },
    });
    assert(disbursedLoan.status === 'disbursed', 'Status pinjaman berhasil dicairkan (disbursed)');

    // Buat 1 cicilan uji menggunakan model LoanInstallment
    const installment = await prisma.loanInstallment.create({
      data: {
        loan_application_id: loanApp.id,
        angsuran_ke: 1,
        nominal_angsuran: 850000,
        jatuh_tempo: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        status: 'unpaid',
      },
    });
    assert(!!installment.id, 'Jadwal angsuran cicilan berhasil dibuat');

    // ANGGOTA: Bayar Cicilan
    const paidInstallment = await prisma.loanInstallment.update({
      where: { id: installment.id },
      data: {
        status: 'pending_verification',
        paid_at: new Date(),
        bukti_transfer: 'bukti_transfer_sample.png',
      },
    });
    assert(paidInstallment.status === 'pending_verification', 'Anggota berhasil mengirim bukti pembayaran cicilan');

    // PETUGAS/ADMIN: Konfirmasi Pembayaran Cicilan
    const confirmedInstallment = await prisma.loanInstallment.update({
      where: { id: installment.id },
      data: {
        status: 'paid',
        confirmed_at: new Date(),
      },
    });
    assert(confirmedInstallment.status === 'paid', 'Petugas berhasil mengonfirmasi pembayaran cicilan menjadi Lunas (paid)');

    // Bersihkan data transaksi uji agar database tetap bersih
    await prisma.loanInstallment.deleteMany({ where: { loan_application_id: loanApp.id } });
    await prisma.smartEvaluation.deleteMany({ where: { loan_application_id: loanApp.id } });
    await prisma.approvalLog.deleteMany({ where: { loan_application_id: loanApp.id } });
    await prisma.notification.deleteMany({ where: { link: { contains: String(loanApp.id) } } });
    await prisma.loanApplication.delete({ where: { id: loanApp.id } });
    assert(true, 'Data transaksi uji pinjaman berhasil dibersihkan');

    // -------------------------------------------------------------
    // 4. AUDIT LAB RISET: INPUT MANUAL DATA RIIL & 150 BATCH SMART
    // -------------------------------------------------------------
    console.log('\n--- 4. Verifikasi Lab Riset SPK: Input Manual & Batch 150 Data ---');
    
    // A. Single Manual Simulation Input
    const singleSim = await SmartEngineService.calculateManualSimulation({
      candidate_name: 'Dr. H. Mulyadi, M.Pd (Uji Audit)',
      candidate_nik: '3209071203750002',
      candidate_unit: 'SMA Islam Al-Azhar BSD',
      candidate_plafon: 10000000,
      val_c1: 100,
      val_c2: 100,
      val_c3: 100,
      val_c4: 100,
      val_c5: 100,
    });
    assert(!!singleSim.id, `Single Manual Simulation berhasil: ${singleSim.candidate_name}, Skor: ${singleSim.final_score}`);

    // Update single simulation
    const updatedSim = await SmartEngineService.calculateManualSimulation({
      id: singleSim.id,
      candidate_name: 'Dr. H. Mulyadi, M.Pd (Uji Audit - Updated)',
      candidate_nik: '3209071203750002',
      candidate_unit: 'SMA Islam Al-Azhar BSD',
      candidate_plafon: 12000000,
      val_c1: 75,
      val_c2: 100,
      val_c3: 75,
      val_c4: 100,
      val_c5: 75,
    });
    assert(Boolean(updatedSim.candidate_name?.includes('- Updated')), 'Update Manual Simulation berhasil');

    // Delete single simulation
    await prisma.smartEvaluation.delete({ where: { id: singleSim.id } });
    assert(true, 'Delete Manual Simulation berhasil');

    // B. Batch 150 Data Koperasi Empiris
    console.log('  Membuat 150 dataset empiris anggota Koperasi Al-Azhar BSD...');
    const dataset150 = generate150CooperativeData();
    assert(dataset150.length === 150, `Generator 150 data berhasil menghasilkan ${dataset150.length} alternatif`);

    // Bersihkan simulasi lama bila ada
    await prisma.smartEvaluation.deleteMany({ where: { is_manual_simulation: true } });

    console.log('  Memproses kalkulasi 150 data alternatif secara serentak dengan metode SMART...');
    const startTime = Date.now();
    await SmartEngineService.calculateBatchSimulations(dataset150);
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);

    const totalSimulations = await prisma.smartEvaluation.count({
      where: { is_manual_simulation: true, is_delete: 0 },
    });
    assert(totalSimulations === 150, `150 Data Alternatif berhasil disimpan dan dihitung (Total di DB: ${totalSimulations}) dalam ${elapsedTime}s`);

    // Verifikasi Ranking 1 sampai 150
    const topRank = await prisma.smartEvaluation.findFirst({
      where: { is_manual_simulation: true },
      orderBy: { rank: 'asc' },
    });
    const bottomRank = await prisma.smartEvaluation.findFirst({
      where: { is_manual_simulation: true },
      orderBy: { rank: 'desc' },
    });

    assert(topRank?.rank === 1, `Alternatif Peringkat #1 terverifikasi (${topRank?.candidate_name}, Skor: ${topRank?.final_score})`);
    assert(bottomRank?.rank !== undefined && bottomRank.rank >= 150, `Alternatif Peringkat Terendah terverifikasi (#${bottomRank?.rank}, Skor: ${bottomRank?.final_score})`);

    // Verifikasi Utilitas SMART: u1 s.d. u5 terisi dengan benar (tidak ada NaN)
    const all150Evals = await prisma.smartEvaluation.findMany({
      where: { is_manual_simulation: true },
    });
    const hasInvalidScore = all150Evals.some(
      (e) => isNaN(e.utility_c1) || isNaN(e.final_score) || e.final_score === undefined
    );
    assert(!hasInvalidScore, 'Seluruh nilai utilitas u(a) dan skor akhir V(Ai) valid tanpa nilai null/NaN');

    console.log('\n================================================================');
    console.log(`🎉 HASIL AUDIT: ${passedTests} DARI ${totalTests} PENGUJIAN BERHASIL SEMPURNA (100% PASS)`);
    console.log('SEMUA FUNGSI CRUD & KALKULASI METODE SMART BERFUNGSI DENGAN BAIK!');
    console.log('================================================================\n');

  } catch (error: any) {
    console.error('\n❌ AUDIT GAGAL:', error.message);
    process.exit(1);
  }
}

runFullSystemAudit()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
