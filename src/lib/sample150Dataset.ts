// Generator 150 Data Empiris Koperasi Al-Azhar BSD untuk Lab Riset SPK & Pengujian Skripsi

export interface SimulationCandidateItem {
  candidate_name: string;
  candidate_nik: string;
  candidate_unit: string;
  candidate_plafon: number;
  val_c1: number; // Sisa THP / Rasio Finansial (Benefit)
  val_c2: number; // Simpanan Wajib & Pokok (Benefit)
  val_c3: number; // Masa Kerja & Status Kepegawaian (Benefit)
  val_c4: number; // Riwayat Angsuran / Kolektibilitas (Benefit)
  val_c5: number; // Nominal Pengajuan Plafon (Cost)
  // Additional real cooperative metadata for inspection
  gaji_pokok?: number;
  potongan?: number;
  sisa_thp?: number;
  simpanan?: number;
  masa_kerja?: number;
  status_pegawai?: string;
  riwayat_angsuran?: string;
}

const firstNames = [
  'Achmad', 'Fitri', 'Mohamad', 'Siti', 'Hendra', 'Dewi', 'Bambang', 'Rina', 'Dedi', 'Eka',
  'Nurul', 'Arif', 'Tri', 'Agus', 'Sri', 'Dian', 'Ahmad', 'Maya', 'Rizki', 'Wahyu',
  'Ilham', 'Anisa', 'Fajar', 'Lilis', 'Agung', 'Ratna', 'Heri', 'Yuni', 'Gunawan', 'Eni',
  'Teguh', 'Indah', 'Yudi', 'Lestari', 'Surya', 'Kartika', 'Rahmat', 'Novi', 'Bayu', 'Rini',
  'Imam', 'Wulan', 'Darmawan', 'Tuti', 'Budi', 'Ayu', 'Rudi', 'Kusuma', 'Asep', 'Hani'
];

const lastNames = [
  'Sobari', 'Yanti', 'Ridwan', 'Nurjanah', 'Wijaya', 'Anggraini', 'Sutejo', 'Marlina', 'Kurniawan', 'Prasetya',
  'Hidayati', 'Budiman', 'Wahyuni', 'Santoso', 'Rahayu', 'Permatasari', 'Fauzi', 'Indriani', 'Ramadhan', 'Hidayat',
  'Maulana', 'Rahmawati', 'Pratama', 'Suryani', 'Nugroho', 'Wibowo', 'Purwanto', 'Astuti', 'Wibisono', 'Rohaeni',
  'Saputra', 'Handayani', 'Setiawan', 'Ningsih', 'Pradana', 'Kusumawati', 'Subekti', 'Komalasari', 'Siregar', 'Kurnia',
  'Hakim', 'Anggara', 'Sutrisno', 'Puspitasari', 'Gunawan', 'Novitasari', 'Purnama', 'Lestari', 'Irawan', 'Utami'
];

const degrees = ['', ', S.Pd', ', M.Pd', ', S.Kom', ', S.E', ', S.Si', ', M.M', ', S.Ag', ', S.T', ', S.Pd.I'];

const units = [
  'SD Islam Al-Azhar BSD',
  'SMP Islam Al-Azhar BSD',
  'SMA Islam Al-Azhar BSD',
  'TK Islam Al-Azhar BSD',
  'Pelaksana Harian (LAKHAR)',
  'Bagian Keuangan Yayasan',
  'Bagian Sarana & Prasarana',
  'Laboratorium Komputer & Sains'
];

/**
 * Generate 150 deterministic, realistic dataset of cooperative members
 */
export function generate150CooperativeData(): SimulationCandidateItem[] {
  const result: SimulationCandidateItem[] = [];

  for (let i = 1; i <= 150; i++) {
    const fIdx = (i * 7 + 3) % firstNames.length;
    const lIdx = (i * 13 + 5) % lastNames.length;
    const degIdx = (i * 3) % degrees.length;
    const unitIdx = (i * 5) % units.length;

    const name = `${firstNames[fIdx]} ${lastNames[lIdx]}${degrees[degIdx]}`;
    const nik = `320907${String(100000 + i).slice(1)}${String(80 + (i % 20))}${String(1000 + i)}`;
    const unit = units[unitIdx];

    // Seeded realistic financial parameters
    // Gaji pokok between 4.5jt - 15jt
    const gajiPokok = 4500000 + ((i * 350000) % 10500000);
    // Potongan antara 10% - 65% dari gaji pokok
    const potPct = 0.15 + ((i * 17) % 50) / 100;
    const potongan = Math.round((gajiPokok * potPct) / 100000) * 100000;
    const sisaThp = gajiPokok - potongan;
    const rasioThp = (sisaThp / gajiPokok) * 100;

    // C1: Sisa THP (>=50% -> 100, 40-49% -> 75, <40% -> 25)
    let val_c1 = 25;
    if (rasioThp >= 50) val_c1 = 100;
    else if (rasioThp >= 40) val_c1 = 75;

    // Simpanan antara 500rb - 12jt
    const simpanan = 800000 + ((i * 650000) % 11200000);
    // C2: Simpanan (>5jt -> 100, 1-5jt -> 75, <1jt -> 25)
    let val_c2 = 25;
    if (simpanan > 5000000) val_c2 = 100;
    else if (simpanan >= 1000000) val_c2 = 75;

    // Masa kerja 1 - 25 thn
    const masaKerja = 1 + ((i * 3) % 22);
    const statusPegawai = (i % 6 === 0) ? 'KONTRAK' : 'TETAP';
    // C3: Masa Kerja (Tetap >5thn -> 100, Tetap <=5thn -> 75, Kontrak -> 25)
    let val_c3 = 25;
    if (statusPegawai === 'TETAP') {
      val_c3 = masaKerja > 5 ? 100 : 75;
    }

    // Riwayat kolektibilitas
    const riwayatChoice = (i % 8 === 0) ? 'kurang_lancar' : ((i % 3 === 0) ? 'tepat_waktu' : 'sangat_lancar');
    let val_c4 = 25;
    if (riwayatChoice === 'sangat_lancar') val_c4 = 100;
    else if (riwayatChoice === 'tepat_waktu') val_c4 = 75;

    // Plafon pengajuan 3jt - 25jt
    const plafon = 3000000 + ((i * 1500000) % 22000000);
    // C5: Plafon Cost (<=10jt -> 100, 10-15jt -> 75, >15jt -> 25)
    let val_c5 = 25;
    if (plafon <= 10000000) val_c5 = 100;
    else if (plafon <= 15000000) val_c5 = 75;

    result.push({
      candidate_name: name,
      candidate_nik: nik,
      candidate_unit: unit,
      candidate_plafon: plafon,
      val_c1,
      val_c2,
      val_c3,
      val_c4,
      val_c5,
      gaji_pokok: gajiPokok,
      potongan,
      sisa_thp: sisaThp,
      simpanan,
      masa_kerja: masaKerja,
      status_pegawai: statusPegawai,
      riwayat_angsuran: riwayatChoice,
    });
  }

  return result;
}

/**
 * Parse TSV or CSV pasted text into Candidate Items
 */
export function parsePastedData(text: string): SimulationCandidateItem[] {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];

  const candidates: SimulationCandidateItem[] = [];

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    // Skip header line if it contains common words like "nama" or "name"
    if (idx === 0 && (line.toLowerCase().includes('nama') || line.toLowerCase().includes('name') || line.toLowerCase().includes('nik'))) {
      continue;
    }

    // Split by tab (Excel copy) or comma / semicolon (CSV)
    let parts = line.split('\t');
    if (parts.length < 3) {
      parts = line.split(';');
    }
    if (parts.length < 3) {
      parts = line.split(',');
    }

    if (parts.length >= 1) {
      const name = parts[0]?.trim() || `Kandidat Alternatif #${idx + 1}`;
      const nik = parts[1]?.trim() || `SIM-${Math.floor(100 + Math.random() * 900)}`;
      const unit = parts[2]?.trim() || 'Unit Akademik';
      
      // Check if raw salary / figures or direct C1-C5 scores are provided
      const p3 = parseFloat(parts[3]?.replace(/[^0-9.-]+/g, '') || '75');
      const p4 = parseFloat(parts[4]?.replace(/[^0-9.-]+/g, '') || '75');
      const p5 = parseFloat(parts[5]?.replace(/[^0-9.-]+/g, '') || '75');
      const p6 = parseFloat(parts[6]?.replace(/[^0-9.-]+/g, '') || '75');
      const p7 = parseFloat(parts[7]?.replace(/[^0-9.-]+/g, '') || '10000000');

      let val_c1 = p3 > 100 ? (p3 >= 5000000 ? 100 : 75) : (p3 || 75);
      let val_c2 = p4 > 100 ? (p4 >= 5000000 ? 100 : 75) : (p4 || 75);
      let val_c3 = p5 > 100 ? (p5 > 5 ? 100 : 75) : (p5 || 75);
      let val_c4 = p6 > 100 ? 75 : (p6 || 75);
      let plafon = p7 > 100 ? p7 : 10000000;
      let val_c5 = plafon <= 10000000 ? 100 : (plafon <= 15000000 ? 75 : 25);

      candidates.push({
        candidate_name: name,
        candidate_nik: nik,
        candidate_unit: unit,
        candidate_plafon: plafon,
        val_c1,
        val_c2,
        val_c3,
        val_c4,
        val_c5,
      });
    }
  }

  return candidates;
}
