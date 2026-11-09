'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { Criterion, SubCriterion, SmartEvaluation, LoanApplication } from '../types';
import { 
  Home, 
  Sliders, 
  Layers, 
  Users, 
  TrendingUp, 
  BarChart3, 
  FileText, 
  Calculator, 
  BookOpen, 
  ArrowLeft, 
  Plus, 
  Edit3, 
  Trash2, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Scale,
  Copy,
  Check,
  ChevronRight,
  Info,
  Sparkles,
  UserCheck,
  Key,
  LogOut,
  Upload,
  Download,
  Search,
  Filter,
  FileSpreadsheet,
  Play,
  ArrowUpDown,
  Coins,
  Wallet,
  Briefcase,
  ChevronLeft
} from 'lucide-react';
import { generate150CooperativeData, parsePastedData, SimulationCandidateItem } from '../lib/sample150Dataset';

interface Props {
  onBackToOperational: () => void;
}

export const SmartLabPage: React.FC<Props> = ({ onBackToOperational }) => {
  const [activeMenu, setActiveMenu] = useState<'beranda' | 'kriteria' | 'sub_kriteria' | 'alternatif' | 'perangkingan' | 'grafik' | 'laporan'>('kriteria');
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [evaluations, setEvaluations] = useState<SmartEvaluation[]>([]);
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Criteria Modal State
  const [isCriteriaModalOpen, setIsCriteriaModalOpen] = useState(false);
  const [editingCriterion, setEditingCriterion] = useState<Criterion | null>(null);
  const [critCode, setCritCode] = useState('');
  const [critName, setCritName] = useState('');
  const [critType, setCritType] = useState<'benefit' | 'cost'>('benefit');
  const [critRawWeight, setCritRawWeight] = useState(20);
  const [critDesc, setCritDesc] = useState('');

  // Sub-Criteria Modal State
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [selectedParentCriterion, setSelectedParentCriterion] = useState<Criterion | null>(null);
  const [subLabel, setSubLabel] = useState('');
  const [subScore, setSubScore] = useState(100);

  // Fast Weight Modal
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [fastWeights, setFastWeights] = useState<{ id: number; raw_weight: number }[]>([]);

  // Simulation Alternative Modal State (With Real Cooperative Data)
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [editingSim, setEditingSim] = useState<SmartEvaluation | null>(null);
  const [simInputMode, setSimInputMode] = useState<'real' | 'scores'>('real');
  const [simName, setSimName] = useState('');
  const [simNik, setSimNik] = useState('');
  const [simUnit, setSimUnit] = useState('SD Islam Al-Azhar BSD');
  const [simPlafon, setSimPlafon] = useState<number>(10000000);
  
  // Real cooperative parameters state
  const [simGajiPokok, setSimGajiPokok] = useState<number>(8500000);
  const [simPotonganGaji, setSimPotonganGaji] = useState<number>(2500000);
  const [simSaldoSimpanan, setSimSaldoSimpanan] = useState<number>(6000000);
  const [simMasaKerja, setSimMasaKerja] = useState<number>(7);
  const [simStatusPegawai, setSimStatusPegawai] = useState<'TETAP' | 'KONTRAK'>('TETAP');
  const [simRiwayat, setSimRiwayat] = useState<'sangat_lancar' | 'tepat_waktu' | 'kurang_lancar'>('sangat_lancar');

  const [simScores, setSimScores] = useState<Record<string, number>>({
    C1: 100,
    C2: 100,
    C3: 100,
    C4: 100,
    C5: 100,
  });

  // Batch 150 Data Modal State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [batchItems, setBatchItems] = useState<SimulationCandidateItem[]>([]);
  const [batchPastedText, setBatchPastedText] = useState<string>('');
  const [batchTab, setBatchTab] = useState<'sample150' | 'paste'>('sample150');
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);

  // Search & Filter State for Alternatif & Perangkingan
  const [searchAltQuery, setSearchAltQuery] = useState<string>('');
  const [filterRecommendation, setFilterRecommendation] = useState<string>('all');
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [currentAltPage, setCurrentAltPage] = useState<number>(1);
  const [currentRankPage, setCurrentRankPage] = useState<number>(1);

  // Perangkingan View Sub-Tabs (Bab 4 Skripsi)
  const [perangkinganSubTab, setPerangkinganSubTab] = useState<'tahapan' | 'ringkas' | 'manual'>('tahapan');
  const [selectedManualAltId, setSelectedManualAltId] = useState<number | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Classic Benchmark Modals (Operator & Password)
  const [isOperatorModalOpen, setIsOperatorModalOpen] = useState<boolean>(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);

  const getCandidateName = (ev: SmartEvaluation) => {
    if (ev.is_manual_simulation && ev.candidate_name) {
      return ev.candidate_name;
    }
    return ev.loan_application?.user?.name || 'Tanpa Nama';
  };

  const getCandidateNik = (ev: SmartEvaluation) => {
    if (ev.is_manual_simulation && ev.candidate_nik) {
      return ev.candidate_nik;
    }
    return ev.loan_application?.user?.nik || '-';
  };

  const getCandidateUnit = (ev: SmartEvaluation) => {
    if (ev.is_manual_simulation && ev.candidate_unit) {
      return ev.candidate_unit;
    }
    return ev.loan_application?.user?.unit_kerja ? `Unit ${ev.loan_application.user.unit_kerja}` : 'Unit LAKHAR';
  };

  const getCandidatePlafon = (ev: SmartEvaluation) => {
    if (ev.is_manual_simulation && ev.candidate_plafon) {
      return Number(ev.candidate_plafon);
    }
    return ev.loan_application?.nominal_pengajuan || 0;
  };

  // Compute scores dynamically when real parameters change
  const computeScoresFromRealData = (
    gaji: number,
    pot: number,
    simp: number,
    masa: number,
    status: string,
    riwayat: string,
    plafon: number
  ) => {
    const sisa = Math.max(0, gaji - pot);
    const rasio = gaji > 0 ? (sisa / gaji) * 100 : 0;

    // C1: Sisa THP
    let c1 = 25;
    if (rasio >= 50) c1 = 100;
    else if (rasio >= 40) c1 = 75;

    // C2: Simpanan Koperasi
    let c2 = 25;
    if (simp > 5000000) c2 = 100;
    else if (simp >= 1000000) c2 = 75;

    // C3: Masa Kerja & Status Kepegawaian
    let c3 = 25;
    if (status === 'TETAP') {
      c3 = masa > 5 ? 100 : 75;
    }

    // C4: Riwayat Angsuran / Kolektibilitas
    let c4 = 25;
    if (riwayat === 'sangat_lancar') c4 = 100;
    else if (riwayat === 'tepat_waktu') c4 = 75;

    // C5: Plafon Pinjaman (Cost)
    let c5 = 25;
    if (plafon <= 10000000) c5 = 100;
    else if (plafon <= 15000000) c5 = 75;

    return { c1, c2, c3, c4, c5, sisa, rasio };
  };

  const handleOpenSimModal = (sim?: SmartEvaluation) => {
    if (sim) {
      setEditingSim(sim);
      setSimName(sim.candidate_name || '');
      setSimNik(sim.candidate_nik || '');
      setSimUnit(sim.candidate_unit || 'SD Islam Al-Azhar BSD');
      const plaf = sim.candidate_plafon ? Number(sim.candidate_plafon) : 10000000;
      setSimPlafon(plaf);
      setSimInputMode('scores');
      setSimScores({
        C1: Number(sim.val_c1),
        C2: Number(sim.val_c2),
        C3: Number(sim.val_c3),
        C4: Number(sim.val_c4),
        C5: Number(sim.val_c5),
        ...(sim.dynamic_scores || {}),
      });
    } else {
      setEditingSim(null);
      setSimName('');
      setSimNik('SIM-' + Math.floor(1000 + Math.random() * 9000));
      setSimUnit('SD Islam Al-Azhar BSD');
      const defPlafon = 10000000;
      const defGaji = 8500000;
      const defPot = 2500000;
      const defSimp = 6000000;
      const defMasa = 7;
      const defStatus: 'TETAP' | 'KONTRAK' = 'TETAP';
      const defRiw: 'sangat_lancar' | 'tepat_waktu' | 'kurang_lancar' = 'sangat_lancar';

      setSimPlafon(defPlafon);
      setSimGajiPokok(defGaji);
      setSimPotonganGaji(defPot);
      setSimSaldoSimpanan(defSimp);
      setSimMasaKerja(defMasa);
      setSimStatusPegawai(defStatus);
      setSimRiwayat(defRiw);
      setSimInputMode('real');

      const calc = computeScoresFromRealData(defGaji, defPot, defSimp, defMasa, defStatus, defRiw, defPlafon);
      setSimScores({
        C1: calc.c1,
        C2: calc.c2,
        C3: calc.c3,
        C4: calc.c4,
        C5: calc.c5,
      });
    }
    setIsSimModalOpen(true);
  };

  const handleSaveSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simName.trim()) {
      alert('Silakan masukkan nama calon alternatif.');
      return;
    }

    try {
      // If in real mode, recalculate before sending
      let finalScores = { ...simScores };
      if (simInputMode === 'real') {
        const calc = computeScoresFromRealData(
          simGajiPokok,
          simPotonganGaji,
          simSaldoSimpanan,
          simMasaKerja,
          simStatusPegawai,
          simRiwayat,
          simPlafon
        );
        finalScores = {
          C1: calc.c1,
          C2: calc.c2,
          C3: calc.c3,
          C4: calc.c4,
          C5: calc.c5,
        };
      }

      const payload = {
        candidate_name: simName,
        candidate_nik: simNik,
        candidate_unit: simUnit,
        candidate_plafon: simPlafon,
        val_c1: finalScores.C1 ?? 75,
        val_c2: finalScores.C2 ?? 75,
        val_c3: finalScores.C3 ?? 75,
        val_c4: finalScores.C4 ?? 75,
        val_c5: finalScores.C5 ?? 50,
        dynamic_scores: finalScores,
        gaji_pokok: simGajiPokok,
        potongan: simPotonganGaji,
        simpanan: simSaldoSimpanan,
        masa_kerja: simMasaKerja,
        status_pegawai: simStatusPegawai,
        riwayat_angsuran: simRiwayat,
      };

      if (editingSim) {
        await api.put(`/smart/simulations/${editingSim.id}`, payload);
        setMsg({ type: 'success', text: `Alternatif simulasi (${simName}) berhasil diperbarui.` });
      } else {
        await api.post('/smart/simulations', payload);
        setMsg({ type: 'success', text: `Alternatif simulasi (${simName}) berhasil ditambahkan dan dinilai dengan metode SMART.` });
      }

      setIsSimModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyimpan alternatif simulasi.');
    }
  };

  const handleDeleteSimulation = async (id: number, name?: string) => {
    if (!confirm(`Hapus alternatif simulasi (${name || 'Kandidat'}) dari matriks riset?`)) return;

    try {
      await api.delete(`/smart/simulations/${id}`);
      setMsg({ type: 'success', text: `Alternatif simulasi berhasil dihapus.` });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus alternatif.');
    }
  };

  // Reset ALL simulation records
  const handleResetAllSimulations = async () => {
    if (!confirm('Apakah Anda yakin ingin MENGHAPUS SEMUA alternatif simulasi riset? Matriks keputusan akan dikembalikan hanya ke data riil pengajuan koperasi asli.')) {
      return;
    }

    setIsCalculating(true);
    try {
      const res = await api.delete('/smart/simulations');
      setMsg({ type: 'success', text: res.data.message || 'Semua data simulasi berhasil direset.' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mereset simulasi.');
    } finally {
      setIsCalculating(false);
    }
  };

  // Load 150 Real Cooperative Dataset
  const handleLoadSample150 = () => {
    const data = generate150CooperativeData();
    setBatchItems(data);
    setMsg({ type: 'success', text: '150 Data Empiris Koperasi Al-Azhar BSD berhasil dimuat ke memori. Klik tombol proses untuk menghitung SMART!' });
  };

  // Parse Pasted Text from Excel / CSV
  const handleParsePastedText = () => {
    if (!batchPastedText.trim()) {
      alert('Silakan tempelkan data teks dari Excel terlebih dahulu.');
      return;
    }
    const parsed = parsePastedData(batchPastedText);
    if (parsed.length === 0) {
      alert('Format teks tidak terbaca. Pastikan ada minimal 1 baris data.');
      return;
    }
    setBatchItems(parsed);
    setMsg({ type: 'success', text: `Berhasil mengekstrak ${parsed.length} baris kandidat dari teks Excel.` });
  };

  // Execute Batch Processing
  const handleProcessBatch = async () => {
    if (batchItems.length === 0) {
      alert('Daftar data masih kosong. Silakan muat contoh 150 data atau salin data dari spreadsheet.');
      return;
    }

    setIsBatchProcessing(true);
    try {
      const res = await api.post('/smart/simulations', { batch: batchItems });
      setMsg({ 
        type: 'success', 
        text: res.data.message || `Berhasil memproses ${batchItems.length} alternatif dengan 5 tahap metode SMART.` 
      });
      setIsBatchModalOpen(false);
      setBatchItems([]);
      setBatchPastedText('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal memproses kalkulasi batch SMART.');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // Export Results to CSV for Thesis Appendix (Excel)
  const handleExportCSV = () => {
    if (evaluations.length === 0) {
      alert('Tidak ada data evaluasi untuk diekspor.');
      return;
    }

    const headers = [
      'Ranking',
      'Kode Alternatif',
      'Nama Calon / Anggota',
      'NIK',
      'Unit Kerja',
      'Nominal Plafon',
      'C1 (Sisa THP)',
      'C2 (Simpanan)',
      'C3 (Masa Kerja)',
      'C4 (Riwayat)',
      'C5 (Plafon Cost)',
      'u1 (C1)',
      'u2 (C2)',
      'u3 (C3)',
      'u4 (C4)',
      'u5 (C5)',
      'Nilai Akhir V(Ai)',
      'Rekomendasi Kelayakan',
      'Sumber Data'
    ];

    const rows = evaluations.map((ev) => [
      ev.rank ?? '-',
      ev.alternative_code,
      `"${getCandidateName(ev).replace(/"/g, '""')}"`,
      `"${getCandidateNik(ev)}"`,
      `"${getCandidateUnit(ev)}"`,
      getCandidatePlafon(ev),
      ev.val_c1,
      ev.val_c2,
      ev.val_c3,
      ev.val_c4,
      ev.val_c5,
      ev.utility_c1,
      ev.utility_c2,
      ev.utility_c3,
      ev.utility_c4,
      ev.utility_c5,
      ev.final_score,
      `"${ev.recommendation}"`,
      ev.is_manual_simulation ? 'Simulasi Riset' : 'Data Riil Koperasi'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF'
      + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekapitulasi_SMART_${evaluations.length}_Alternatif_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resCrit, resMatrix, resLoans] = await Promise.all([
        api.get('/criteria'),
        api.get('/smart/matrix'),
        api.get('/loans'),
      ]);

      if (resCrit.data.success) {
        setCriteria(resCrit.data.data);
        setFastWeights(resCrit.data.data.map((c: Criterion) => ({ id: c.id, raw_weight: Number(c.raw_weight) })));
      }
      if (resMatrix.data.success) {
        setEvaluations(resMatrix.data.data.evaluations);
      }
      if (resLoans.data.success) {
        setLoans(resLoans.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalRawWeight = criteria.reduce((acc, c) => acc + Number(c.raw_weight), 0);
  const totalNormalized = criteria.reduce((acc, c) => acc + Number(c.normalized_weight), 0);

  // Execute 1-Click Recalculation
  const handleRecalculateAll = async () => {
    setIsCalculating(true);
    setMsg(null);
    try {
      const res = await api.post('/smart/calculate-all');
      if (res.data.success) {
        setMsg({ type: 'success', text: 'Kalkulasi metode SMART berhasil dijalankan ulang secara menyeluruh.' });
        fetchData();
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Gagal menghitung ulang SMART.' });
    } finally {
      setIsCalculating(false);
    }
  };

  // Save Criteria
  const handleSaveCriterion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCriterion) {
        await api.put(`/criteria/${editingCriterion.id}`, {
          code: critCode,
          name: critName,
          type: critType,
          raw_weight: critRawWeight,
          description: critDesc,
        });
        setMsg({ type: 'success', text: `Kriteria ${critCode} berhasil diperbarui.` });
      } else {
        await api.post('/criteria', {
          code: critCode,
          name: critName,
          type: critType,
          raw_weight: critRawWeight,
          description: critDesc,
        });
        setMsg({ type: 'success', text: `Kriteria baru ${critCode} berhasil ditambahkan.` });
      }
      setIsCriteriaModalOpen(false);
      fetchData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Gagal menyimpan kriteria.' });
    }
  };

  // Delete Criteria
  const handleDeleteCriterion = async (id: number, code: string) => {
    if (!window.confirm(`Yakin ingin menghapus kriteria ${code}? Semua bobot akan dinormalisasi ulang otomatis.`)) return;
    try {
      await api.delete(`/criteria/${id}`);
      setMsg({ type: 'success', text: `Kriteria ${code} berhasil dihapus.` });
      fetchData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Gagal menghapus kriteria.' });
    }
  };

  // Save Fast Weights
  const handleSaveFastWeights = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/criteria/weights', { weights: fastWeights });
      setMsg({ type: 'success', text: 'Bobot kriteria berhasil diperbarui dan dinormalisasi ulang.' });
      setIsWeightModalOpen(false);
      fetchData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Gagal memperbarui bobot kriteria.' });
    }
  };

  // Save Sub-Criterion
  const handleSaveSubCriterion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParentCriterion) return;
    try {
      await api.post(`/criteria/${selectedParentCriterion.id}/sub-criteria`, {
        label: subLabel,
        score_value: subScore,
      });
      setMsg({ type: 'success', text: `Parameter skala untuk ${selectedParentCriterion.code} berhasil ditambahkan.` });
      setIsSubModalOpen(false);
      setSubLabel('');
      fetchData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Gagal menyimpan sub-kriteria.' });
    }
  };

  // Delete Sub-Criterion
  const handleDeleteSub = async (subId: number) => {
    if (!window.confirm('Yakin ingin menghapus parameter skala ini?')) return;
    try {
      await api.delete(`/sub-criteria/${subId}`);
      setMsg({ type: 'success', text: 'Sub-kriteria berhasil dihapus.' });
      fetchData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Gagal menghapus sub-kriteria.' });
    }
  };

  const formatCurrency = (val?: number) => {
    if (!val) return 'Rp 0';
    return 'Rp ' + Number(val).toLocaleString('id-ID');
  };

  return (
    <div className="space-y-4">
      
      {/* Top Banner Bar */}
      <div className="bg-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-950 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-800 uppercase">
              Mode Akademik &amp; Riset Internal Mahasiswa
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
            Panel Laboratorium Algoritma SPK SMART
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Lingkungan pengujian struktur skripsi: Kriteria, Sub Kriteria, Alternatif, Eksekusi Perangkingan, Grafik, dan Laporan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBackToOperational}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Operasional Koperasi</span>
          </button>

          <button
            onClick={handleRecalculateAll}
            disabled={isCalculating}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCalculating ? 'animate-spin' : ''}`} />
            <span>{isCalculating ? 'Menghitung...' : 'Hitung Ulang SPK'}</span>
          </button>
        </div>
      </div>

      {/* Action Message Alert */}
      {msg && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 ${
          msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Main Two-Column Frame: Classic Sidebar + Dedicated Panel Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* LEFT COLUMN: Classic Skripsi Navigation Sidebar */}
        <div className="md:col-span-3 space-y-3">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Menu Algoritma SMART</span>
              <span className="text-xs font-bold text-slate-900 block mt-0.5">Navigasi Pengujian</span>
            </div>

            <nav className="p-2 space-y-1 text-xs font-semibold">
              <button
                onClick={() => setActiveMenu('beranda')}
                className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition text-left ${
                  activeMenu === 'beranda' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Home className="w-4 h-4 shrink-0" />
                <span>Beranda Riset</span>
              </button>

              <button
                onClick={() => setActiveMenu('kriteria')}
                className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between transition text-left ${
                  activeMenu === 'kriteria' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 shrink-0" />
                  <span>Kriteria &amp; Bobot</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700">
                  {criteria.length}
                </span>
              </button>

              <button
                onClick={() => setActiveMenu('sub_kriteria')}
                className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition text-left ${
                  activeMenu === 'sub_kriteria' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Layers className="w-4 h-4 shrink-0" />
                <span>Sub Kriteria (Skala)</span>
              </button>

              <button
                onClick={() => setActiveMenu('alternatif')}
                className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between transition text-left ${
                  activeMenu === 'alternatif' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 shrink-0" />
                  <span>Data Alternatif (Ai)</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700">
                  {evaluations.length}
                </span>
              </button>

              <button
                onClick={() => setActiveMenu('perangkingan')}
                className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition text-left ${
                  activeMenu === 'perangkingan' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="w-4 h-4 shrink-0" />
                <span>Eksekusi Perangkingan</span>
              </button>

              <button
                onClick={() => setActiveMenu('grafik')}
                className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition text-left ${
                  activeMenu === 'grafik' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-4 h-4 shrink-0" />
                <span>Grafik Hasil Perangkingan</span>
              </button>

              <button
                onClick={() => setActiveMenu('laporan')}
                className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition text-left ${
                  activeMenu === 'laporan' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span>Laporan &amp; Cetak SPK</span>
              </button>
            </nav>
          </div>

          {/* Quick Stats Widget */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-2.5 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status Normalisasi</span>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">Σ Bobot Normal:</span>
                <span className="font-bold text-slate-900 font-mono">{totalNormalized.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">Status Kriteria:</span>
                <span className={`font-bold text-[10px] px-2 py-0.5 rounded ${
                  Math.abs(totalNormalized - 1.0) < 0.01 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {Math.abs(totalNormalized - 1.0) < 0.01 ? 'Valid (100%)' : 'Perlu Normalisasi'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Active Menu View Panel */}
        <div className="md:col-span-9 space-y-4">

          {/* ============================================================== */}
          {/* MENU 1: BERANDA RISET                                          */}
          {/* ============================================================== */}
          {activeMenu === 'beranda' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
              <div>
                <h3 className="font-bold text-base text-slate-900">Dashboard Riset Metode SMART</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Arsitektur pengambilan keputusan multi-atribut sederhana (*Simple Multi Attribute Rating Technique*).
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Kriteria</span>
                  <span className="text-xl font-bold text-slate-900 mt-1 block">{criteria.length} Kriteria</span>
                  <span className="text-[10px] text-slate-500">C1 s.d. C5</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Alternatif</span>
                  <span className="text-xl font-bold text-slate-900 mt-1 block">{evaluations.length} Alternatif</span>
                  <span className="text-[10px] text-slate-500">Data Pemohon Terdaftar</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Bobot Mentah</span>
                  <span className="text-xl font-bold text-slate-900 mt-1 block">{totalRawWeight}</span>
                  <span className="text-[10px] text-slate-500">Skala Poin Kepentingan</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Status Bobot</span>
                  <span className="text-xl font-bold text-emerald-700 mt-1 block">1.00</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">Ternormalisasi Penuh</span>
                </div>
              </div>

              {/* Tahapan Algoritma */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <span className="font-bold text-slate-900 text-xs block">Tahapan Prosedural Metode SMART:</span>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
                  <li><strong>Penetapan Kriteria &amp; Alternatif:</strong> Menentukan 5 indikator kelayakan (C1 - C5) dan daftar calon peminjam (A1 - An).</li>
                  <li><strong>Penentuan Bobot &amp; Normalisasi:</strong> Menetapkan tingkat kepentingan (Wj) lalu dinormalisasi dengan rumus wj = Wj / &Sigma; Wk sehingga total bobot bernilai 1.</li>
                  <li><strong>Transformasi Nilai Utilitas u(ai):</strong> Mengonversi nilai mentah menjadi skala 0–100 menggunakan fungsi linier Benefit atau Cost.</li>
                  <li><strong>Agregasi Aditif V(Ai):</strong> Mengalikan nilai utilitas dengan bobot kriteria untuk mendapatkan total skor akhir kelayakan.</li>
                  <li><strong>Perangkingan &amp; Rekomendasi:</strong> Mengurutkan alternatif dari nilai tertinggi ke terendah sebagai bahan persetujuan Ketua Koperasi.</li>
                </ol>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* MENU 2: KRITERIA & BOBOT                                       */}
          {/* ============================================================== */}
          {activeMenu === 'kriteria' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Data Kriteria &amp; Pembobotan SMART</h3>
                  <p className="text-[11px] text-slate-500">Kelola indikator penilaian kelayakan kredit, jenis kriteria, dan normalisasi bobot.</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsWeightModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Atur Bobot Cepat</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingCriterion(null);
                      setCritCode(`C${criteria.length + 1}`);
                      setCritName('');
                      setCritType('benefit');
                      setCritRawWeight(20);
                      setCritDesc('');
                      setIsCriteriaModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Kriteria</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">Kode</th>
                      <th className="py-3 px-4">Nama Kriteria</th>
                      <th className="py-3 px-4">Sifat / Jenis</th>
                      <th className="py-3 px-4">Bobot Asli (Wj)</th>
                      <th className="py-3 px-4">Normalisasi (wj)</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {criteria.map((c, idx) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3.5 px-4 font-bold font-mono text-slate-900">{c.code}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">{c.name}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            c.type === 'benefit' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {c.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold font-mono text-slate-800">{c.raw_weight}</td>
                        <td className="py-3.5 px-4 font-bold font-mono text-emerald-700">{c.normalized_weight}</td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingCriterion(c);
                                setCritCode(c.code);
                                setCritName(c.name);
                                setCritType(c.type);
                                setCritRawWeight(c.raw_weight);
                                setCritDesc(c.description || '');
                                setIsCriteriaModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCriterion(c.id, c.code)}
                              className="px-2.5 py-1 rounded-md border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-semibold"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* MENU 3: SUB KRITERIA                                           */}
          {/* ============================================================== */}
          {activeMenu === 'sub_kriteria' && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Daftar Sub Kriteria &amp; Parameter Skala</h3>
                  <p className="text-[11px] text-slate-500">Nilai skala parameter (100 = Sangat Baik, 75 = Baik, 50 = Cukup, 25 = Kurang).</p>
                </div>
              </div>

              <div className="space-y-4">
                {criteria.map((c) => (
                  <div key={c.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded">{c.code}</span>
                        <span className="font-bold text-xs text-slate-900">{c.name}</span>
                        <span className="text-[10px] text-slate-400">({c.type.toUpperCase()} • Bobot {c.normalized_weight})</span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedParentCriterion(c);
                          setSubLabel('');
                          setSubScore(100);
                          setIsSubModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Tambah Skala
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {c.sub_criteria && c.sub_criteria.length > 0 ? (
                        c.sub_criteria.map((sub) => (
                          <div key={sub.id} className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                            <span className="text-slate-800 text-[11px] font-medium">{sub.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                                {sub.score_value}
                              </span>
                              <button
                                onClick={() => handleDeleteSub(sub.id)}
                                className="text-slate-400 hover:text-rose-600 p-1"
                                title="Hapus Sub-Kriteria"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 p-2.5 text-center text-slate-400 italic text-[11px] bg-white rounded-lg border border-dashed border-slate-200">
                          Belum ada sub-kriteria. Klik Tambah Skala untuk menambahkan.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* MENU 4: DATA ALTERNATIF (Ai) & SIMULASI 150 DATA KOPERASI     */}
          {/* ============================================================== */}
          {activeMenu === 'alternatif' && (() => {
            const hasSimData = evaluations.some(e => e.is_manual_simulation);
            const totalCount = evaluations.length;
            const simCount = evaluations.filter(e => e.is_manual_simulation).length;
            const realCount = totalCount - simCount;

            const filtered = evaluations.filter((ev) => {
              const name = getCandidateName(ev).toLowerCase();
              const nik = getCandidateNik(ev).toLowerCase();
              const unit = getCandidateUnit(ev).toLowerCase();
              const code = ev.alternative_code.toLowerCase();
              const q = searchAltQuery.toLowerCase().trim();

              const matchesSearch = !q || name.includes(q) || nik.includes(q) || unit.includes(q) || code.includes(q);

              const matchesRecom = filterRecommendation === 'all'
                || (filterRecommendation === 'sangat' && ev.recommendation?.toLowerCase().includes('sangat'))
                || (filterRecommendation === 'layak' && ev.recommendation?.toLowerCase().includes('penyesuaian'))
                || (filterRecommendation === 'tidak' && ev.recommendation?.toLowerCase().includes('tidak'));

              return matchesSearch && matchesRecom;
            });

            const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
            const safeCurrentPage = Math.min(currentAltPage, totalPages);
            const startIdx = (safeCurrentPage - 1) * itemsPerPage;
            const pageData = filtered.slice(startIdx, startIdx + itemsPerPage);

            return (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-4 p-5">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white px-2 py-0.5 rounded">
                        Laboratorium SPK
                      </span>
                      <span className="text-xs text-slate-500 font-medium">Data Calon Alternatif &amp; Uji Empiris 150 Data</span>
                    </div>
                    <h3 className="font-bold text-base text-slate-900 mt-1">
                      Data Alternatif Calon Penerima Kredit ({totalCount} Alternatif)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Kelola dan hitung data kandidat pemohon pinjaman berdasarkan data riil Koperasi Al-Azhar BSD maupun batch simulasi 150 data.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        setBatchItems([]);
                        setBatchPastedText('');
                        setIsBatchModalOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>📥 Import / Uji 150 Data (Excel)</span>
                    </button>

                    <button
                      onClick={() => handleOpenSimModal()}
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Input 1 Data Riil Manual</span>
                    </button>

                    <button
                      onClick={handleExportCSV}
                      disabled={evaluations.length === 0}
                      className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5"
                      title="Unduh seluruh data alternatif & skor SMART ke file Excel CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>

                    {hasSimData && (
                      <button
                        onClick={handleResetAllSimulations}
                        className="px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition flex items-center gap-1.5"
                        title="Hapus semua alternatif simulasi riset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Reset Simulasi</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Badge Stats & Filter Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-medium text-slate-500">Statistik Matriks:</span>
                    <span className="bg-emerald-100/80 text-emerald-900 font-semibold px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                      {realCount} Data Riil Koperasi
                    </span>
                    <span className="bg-amber-100/80 text-amber-900 font-semibold px-2 py-0.5 rounded text-[11px] border border-amber-200">
                      {simCount} Simulasi Riset
                    </span>
                    <span className="bg-slate-200/80 text-slate-800 font-bold px-2 py-0.5 rounded text-[11px]">
                      Total: {totalCount} Kandidat
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchAltQuery}
                        onChange={(e) => {
                          setSearchAltQuery(e.target.value);
                          setCurrentAltPage(1);
                        }}
                        placeholder="Cari Nama, NIK, Kode..."
                        className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:border-emerald-600 w-44"
                      />
                    </div>

                    {/* Filter Rekomendasi */}
                    <select
                      value={filterRecommendation}
                      onChange={(e) => {
                        setFilterRecommendation(e.target.value);
                        setCurrentAltPage(1);
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-medium focus:outline-none focus:border-emerald-600"
                    >
                      <option value="all">Semua Rekomendasi</option>
                      <option value="sangat">Sangat Layak</option>
                      <option value="layak">Layak (Penyesuaian)</option>
                      <option value="tidak">Tidak Layak</option>
                    </select>

                    {/* Page Size */}
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentAltPage(1);
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-medium focus:outline-none focus:border-emerald-600"
                    >
                      <option value={15}>15 baris</option>
                      <option value={30}>30 baris</option>
                      <option value={50}>50 baris</option>
                      <option value={150}>150 baris (Semua)</option>
                    </select>
                  </div>
                </div>

                {/* Table Data */}
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-3.5">Kode</th>
                        <th className="py-3 px-3.5">Nama Alternatif</th>
                        <th className="py-3 px-3.5">NIK / ID</th>
                        <th className="py-3 px-3.5">Unit Kerja</th>
                        <th className="py-3 px-3.5">Plafon Diajukan</th>
                        <th className="py-3 px-3.5 text-center">Nilai Parameter [C1 - C5]</th>
                        <th className="py-3 px-3.5">Skor Akhir &amp; Rank</th>
                        <th className="py-3 px-3.5">Sumber Data</th>
                        <th className="py-3 px-3.5 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {pageData.length > 0 ? (
                        pageData.map((ev) => {
                          const isSim = !!ev.is_manual_simulation;
                          const name = getCandidateName(ev);
                          const nik = getCandidateNik(ev);
                          const unit = getCandidateUnit(ev);
                          const plafon = getCandidatePlafon(ev);

                          return (
                            <tr key={ev.id} className="hover:bg-slate-50/80 transition">
                              <td className="py-3 px-3.5 font-bold font-mono text-slate-900">{ev.alternative_code}</td>
                              <td className="py-3 px-3.5 font-bold text-slate-900">{name}</td>
                              <td className="py-3 px-3.5 font-mono text-slate-500">{nik}</td>
                              <td className="py-3 px-3.5">{unit}</td>
                              <td className="py-3 px-3.5 font-bold text-slate-900">
                                {formatCurrency(plafon)}
                              </td>
                              <td className="py-3 px-3.5 text-center">
                                <span className="font-mono text-[11px] font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-700 border border-slate-200">
                                  [{ev.val_c1}, {ev.val_c2}, {ev.val_c3}, {ev.val_c4}, {ev.val_c5}]
                                </span>
                              </td>
                              <td className="py-3 px-3.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold font-mono text-emerald-700 text-xs">
                                    {ev.final_score}
                                  </span>
                                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                    #{ev.rank || '-'}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-3.5">
                                {isSim ? (
                                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                    Simulasi Peneliti
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    Riil Koperasi
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3.5 text-center">
                                {isSim ? (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => handleOpenSimModal(ev)}
                                      className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                                      title="Edit Penilaian Alternatif Simulasi"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSimulation(ev.id, ev.candidate_name)}
                                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                      title="Hapus Alternatif Simulasi"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-[10px] italic">Terkunci</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                            Tidak ada data alternatif yang sesuai dengan kata kunci pencarian.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <div>
                    Menampilkan <strong className="text-slate-900">{filtered.length > 0 ? startIdx + 1 : 0}</strong> s.d.{' '}
                    <strong className="text-slate-900">{Math.min(startIdx + itemsPerPage, filtered.length)}</strong> dari{' '}
                    <strong className="text-slate-900">{filtered.length}</strong> alternatif
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentAltPage(prev => Math.max(1, prev - 1))}
                      disabled={safeCurrentPage <= 1}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-slate-700 flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Sebelumnya</span>
                    </button>

                    <div className="px-3 py-1 font-mono font-bold text-slate-900 bg-slate-100 rounded-lg">
                      {safeCurrentPage} / {totalPages}
                    </div>

                    <button
                      onClick={() => setCurrentAltPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={safeCurrentPage >= totalPages}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-slate-700 flex items-center gap-1"
                    >
                      <span>Selanjutnya</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })()}

          {/* ============================================================== */}
          {/* MENU 5: EKSEKUSI PERANGKINGAN & 5 TAHAP MATEMATIS SMART       */}
          {/* ============================================================== */}
          {activeMenu === 'perangkingan' && (() => {
            const wMap: Record<string, number> = {};
            criteria.forEach(c => {
              wMap[c.code] = Number(c.normalized_weight);
            });
            const w1 = wMap['C1'] ?? 0.30;
            const w2 = wMap['C2'] ?? 0.20;
            const w3 = wMap['C3'] ?? 0.20;
            const w4 = wMap['C4'] ?? 0.15;
            const w5 = wMap['C5'] ?? 0.15;

            const activeManualEval = (selectedManualAltId 
              ? evaluations.find(e => e.id === selectedManualAltId) 
              : evaluations[0]) || evaluations[0];

            const manName = activeManualEval ? getCandidateName(activeManualEval) : 'Achmad Sobari';
            const manNik = activeManualEval ? getCandidateNik(activeManualEval) : '3209071808830004';
            const manUnit = activeManualEval ? getCandidateUnit(activeManualEval) : 'Unit LAKHAR';
            const manPlafon = activeManualEval ? getCandidatePlafon(activeManualEval) : 15000000;
            const manCode = activeManualEval?.alternative_code || 'A1';

            const manV1 = Number(activeManualEval?.val_c1 ?? 100);
            const manV2 = Number(activeManualEval?.val_c2 ?? 75);
            const manV3 = Number(activeManualEval?.val_c3 ?? 100);
            const manV4 = Number(activeManualEval?.val_c4 ?? 100);
            const manV5 = Number(activeManualEval?.val_c5 ?? 75);

            const manU1 = Number(activeManualEval?.utility_c1 ?? 100);
            const manU2 = Number(activeManualEval?.utility_c2 ?? 66.67);
            const manU3 = Number(activeManualEval?.utility_c3 ?? 100);
            const manU4 = Number(activeManualEval?.utility_c4 ?? 100);
            const manU5 = Number(activeManualEval?.utility_c5 ?? 33.33);

            const manWeighted1 = Number((w1 * manU1).toFixed(2));
            const manWeighted2 = Number((w2 * manU2).toFixed(2));
            const manWeighted3 = Number((w3 * manU3).toFixed(2));
            const manWeighted4 = Number((w4 * manU4).toFixed(2));
            const manWeighted5 = Number((w5 * manU5).toFixed(2));

            const manFinal = Number(activeManualEval?.final_score ?? (manWeighted1 + manWeighted2 + manWeighted3 + manWeighted4 + manWeighted5).toFixed(2));

            const manualDocText = `CONTOH PERHITUNGAN MANUAL METODE SMART UNTUK ALTERNATIF ${manCode} (${manName})
KOPERASI KONSUMEN KARYAWAN AL-AZHAR BSD

1. IDENTIFIKASI DATA CALON ANGGOTA:
- Kode Alternatif : ${manCode}
- Nama Pemohon    : ${manName}
- NIK             : ${manNik}
- Unit Kerja      : ${manUnit}
- Nominal Plafon  : ${formatCurrency(manPlafon)}
- Sumber Data     : ${activeManualEval?.is_manual_simulation ? 'Simulasi Riset' : 'Data Riil Koperasi'}

2. TAHAP 1: NORMALISASI BOBOT KRITERIA (wj = Wj / Σ Wk)
- C1 (Sisa THP / Finansial) : w1 = 30 / 100 = ${w1.toFixed(2)} (30%)
- C2 (Simpanan Wajib & Pokok): w2 = 20 / 100 = ${w2.toFixed(2)} (20%)
- C3 (Masa Kerja & Kepegawaian): w3 = 20 / 100 = ${w3.toFixed(2)} (20%)
- C4 (Riwayat Kolektibilitas): w4 = 15 / 100 = ${w4.toFixed(2)} (15%)
- C5 (Besaran Nominal Plafon): w5 = 15 / 100 = ${w5.toFixed(2)} (15%)
Total Bobot: ${(w1 + w2 + w3 + w4 + w5).toFixed(2)} = 1.00 (100%)

3. TAHAP 2: NILAI MENTAH / PARAMETER SUB-KRITERIA (X)
- C1 = ${manV1} (Benefit)
- C2 = ${manV2} (Benefit)
- C3 = ${manV3} (Benefit)
- C4 = ${manV4} (Benefit)
- C5 = ${manV5} (Cost)

4. TAHAP 3: TRANSFORMASI NILAI UTILITAS (Cmin = 25, Cmax = 100)
- Rumus Kriteria Benefit: u(a) = ((C_out - C_min) / (C_max - C_min)) * 100%
  * u1(C1) = ((${manV1} - 25) / (100 - 25)) * 100 = ${manU1}
  * u2(C2) = ((${manV2} - 25) / (100 - 25)) * 100 = ${manU2}
  * u3(C3) = ((${manV3} - 25) / (100 - 25)) * 100 = ${manU3}
  * u4(C4) = ((${manV4} - 25) / (100 - 25)) * 100 = ${manU4}
- Rumus Kriteria Cost: u(a) = ((C_max - C_out) / (C_max - C_min)) * 100%
  * u5(C5) = ((100 - ${manV5}) / (100 - 25)) * 100 = ${manU5}

5. TAHAP 4: MATRIKS TERBOBOT (wj * uj)
- V1 = ${w1.toFixed(2)} * ${manU1} = ${manWeighted1}
- V2 = ${w2.toFixed(2)} * ${manU2} = ${manWeighted2}
- V3 = ${w3.toFixed(2)} * ${manU3} = ${manWeighted3}
- V4 = ${w4.toFixed(2)} * ${manU4} = ${manWeighted4}
- V5 = ${w5.toFixed(2)} * ${manU5} = ${manWeighted5}

6. TAHAP 5: NILAI AKHIR TOTAL V(Ai) & KEPUTUSAN KELAYAKAN
- V(${manCode}) = V1 + V2 + V3 + V4 + V5
- V(${manCode}) = ${manWeighted1} + ${manWeighted2} + ${manWeighted3} + ${manWeighted4} + ${manWeighted5} = ${manFinal}
- Rekomendasi : ${activeManualEval?.recommendation}
- Peringkat   : Ranking #${activeManualEval?.rank}`;

            const handleCopyManual = () => {
              navigator.clipboard.writeText(manualDocText);
              setCopySuccess(true);
              setTimeout(() => setCopySuccess(false), 2500);
            };

            return (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-5 p-5">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white px-2 py-0.5 rounded">
                        Formulasi Matematika Skripsi
                      </span>
                      <span className="text-xs text-slate-500 font-medium">Buku Pedoman Skripsi IT / Sistem Informasi</span>
                    </div>
                    <h3 className="font-bold text-base text-slate-900 mt-1">Eksekusi Perangkingan Matriks SMART (Bab 4)</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Transparansi penuh 5 tahapan komputasi metode SMART sesuai kaidah akademis sidang skripsi.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportCSV}
                      disabled={evaluations.length === 0}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition flex items-center gap-1.5"
                      title="Ekspor seluruh hasil perhitungan 5 tahapan SMART ke file CSV Excel"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Rekapitulasi (CSV)</span>
                    </button>

                    <button
                      onClick={handleRecalculateAll}
                      disabled={isCalculating}
                      className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isCalculating ? 'animate-spin' : ''}`} />
                      <span>Hitung Ulang SPK</span>
                    </button>
                  </div>
                </div>

                {/* Sub-Tab Navigation Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setPerangkinganSubTab('tahapan')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                        perangkinganSubTab === 'tahapan'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>📑 5 Tahapan Lengkap (Bab 4 Skripsi)</span>
                    </button>

                    <button
                      onClick={() => setPerangkinganSubTab('ringkas')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                        perangkinganSubTab === 'ringkas'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>📊 Matriks Keputusan Ringkas</span>
                    </button>

                    <button
                      onClick={() => setPerangkinganSubTab('manual')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                        perangkinganSubTab === 'manual'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      <span>🧮 Bedah Hitung Manual Interaktif</span>
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono">
                    Total: <strong className="text-slate-900">{evaluations.length} Alternatif</strong> | Σ Bobot: <strong className="text-emerald-700 font-bold">1.00</strong>
                  </div>
                </div>

                {/* ============================================================== */}
                {/* SUB-TAB 1: 5 TAHAPAN MATEMATIS LENGKAP UNTUK BAB 4 SKRIPSI     */}
                {/* ============================================================== */}
                {perangkinganSubTab === 'tahapan' && (
                  <div className="space-y-8">
                    
                    {/* TAHAP 1: NORMALISASI BOBOT */}
                    <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">1</span>
                          <h4 className="font-bold text-sm text-slate-900">Tahap 1: Normalisasi Bobot Kriteria (w<sub>j</sub>)</h4>
                        </div>
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 text-[11px] font-mono text-slate-700">
                          <span>Rumus:</span>
                          <strong className="text-slate-900">w<sub>j</sub> = W<sub>j</sub> / &Sigma; W<sub>k</sub></strong>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        Bobot awal kepetingan (<span className="font-mono font-bold">W<sub>j</sub></span>) dinormalisasikan dengan membagi masing-masing nilai bobot terhadap total keseluruhan bobot kriteria (&Sigma; W), sehingga menghasilkan jumlah total bobot normalisasi bernilai tepat <span className="font-mono font-bold text-emerald-700">1,00 (100%)</span>.
                      </p>

                      <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                              <th className="py-2.5 px-3 text-center">No</th>
                              <th className="py-2.5 px-3">Kode</th>
                              <th className="py-2.5 px-3">Nama Kriteria</th>
                              <th className="py-2.5 px-3">Sifat / Jenis</th>
                              <th className="py-2.5 px-3 font-mono text-center">Bobot Awal (W<sub>j</sub>)</th>
                              <th className="py-2.5 px-3 text-center">Rumus Normalisasi</th>
                              <th className="py-2.5 px-3 font-mono text-center font-bold text-emerald-800">Bobot Normal (w<sub>j</sub>)</th>
                              <th className="py-2.5 px-3 text-right">Persentase</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {criteria.map((c, idx) => (
                              <tr key={c.id} className="hover:bg-slate-50">
                                <td className="py-2 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                                <td className="py-2 px-3 font-bold font-mono text-slate-900">{c.code}</td>
                                <td className="py-2 px-3 font-medium text-slate-800">{c.name}</td>
                                <td className="py-2 px-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    c.type === 'benefit' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                                  }`}>
                                    {c.type}
                                  </span>
                                </td>
                                <td className="py-2 px-3 font-mono text-center">{c.raw_weight}</td>
                                <td className="py-2 px-3 text-center font-mono text-slate-500 text-[11px]">
                                  {c.raw_weight} / {totalRawWeight || 100}
                                </td>
                                <td className="py-2 px-3 font-mono text-center font-bold text-emerald-700">
                                  {c.normalized_weight}
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-slate-600">
                                  {(Number(c.normalized_weight) * 100).toFixed(0)}%
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-emerald-50/70 font-bold border-t border-emerald-200 text-emerald-900 text-xs">
                              <td colSpan={4} className="py-2.5 px-3 text-right">TOTAL KESELURUHAN (&Sigma;):</td>
                              <td className="py-2.5 px-3 font-mono text-center">{totalRawWeight}</td>
                              <td className="py-2.5 px-3 text-center font-mono text-[11px]">-</td>
                              <td className="py-2.5 px-3 font-mono text-center font-bold text-emerald-800">{totalNormalized.toFixed(2)}</td>
                              <td className="py-2.5 px-3 text-right font-mono">100%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* TAHAP 2: MATRIKS KEPUTUSAN AWAL (X) */}
                    <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">2</span>
                          <h4 className="font-bold text-sm text-slate-900">Tahap 2: Matriks Keputusan Awal Nilai Mentah (X<sub>ij</sub>)</h4>
                        </div>
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 text-[11px] font-mono text-slate-700">
                          <span>Matriks:</span>
                          <strong className="text-slate-900">X = [x<sub>ij</sub>]<sub>n &times; 5</sub></strong>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        Nilai evaluasi mentah alternatif (<span className="font-mono font-bold">A<sub>i</sub></span>) pada setiap kriteria (<span className="font-mono font-bold">C<sub>j</sub></span>) hasil mapping skala sub-kriteria (25 = Kurang, 50 = Cukup, 75 = Baik, 100 = Sangat Baik).
                      </p>

                      <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                              <th className="py-2.5 px-3 text-center">No</th>
                              <th className="py-2.5 px-3">Kode</th>
                              <th className="py-2.5 px-3">Nama Calon Peminjam</th>
                              <th className="py-2.5 px-3 font-mono text-center">C1 (Sisa THP)</th>
                              <th className="py-2.5 px-3 font-mono text-center">C2 (Simpanan)</th>
                              <th className="py-2.5 px-3 font-mono text-center">C3 (Masa Kerja)</th>
                              <th className="py-2.5 px-3 font-mono text-center">C4 (Riwayat)</th>
                              <th className="py-2.5 px-3 font-mono text-center">C5 (Plafon)</th>
                              <th className="py-2.5 px-3 text-center">Sumber</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                            {evaluations.map((ev, idx) => (
                              <tr key={ev.id} className="hover:bg-slate-50">
                                <td className="py-2 px-3 text-center text-slate-400">{idx + 1}</td>
                                <td className="py-2 px-3 font-bold text-slate-900">{ev.alternative_code}</td>
                                <td className="py-2 px-3 font-sans font-medium text-slate-900">{getCandidateName(ev)}</td>
                                <td className="py-2 px-3 text-center font-bold">{ev.val_c1}</td>
                                <td className="py-2 px-3 text-center font-bold">{ev.val_c2}</td>
                                <td className="py-2 px-3 text-center font-bold">{ev.val_c3}</td>
                                <td className="py-2 px-3 text-center font-bold">{ev.val_c4}</td>
                                <td className="py-2 px-3 text-center font-bold">{ev.val_c5}</td>
                                <td className="py-2 px-3 text-center font-sans">
                                  {ev.is_manual_simulation ? (
                                    <span className="text-[10px] bg-amber-50 text-amber-800 font-semibold px-2 py-0.5 rounded border border-amber-200">
                                      Simulasi
                                    </span>
                                  ) : (
                                    <span className="text-[10px] bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-200">
                                      Data Riil
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* TAHAP 3: TRANSFORMASI NILAI UTILITAS */}
                    <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">3</span>
                          <h4 className="font-bold text-sm text-slate-900">Tahap 3: Transformasi Nilai Utilitas u(a<sub>i</sub>)</h4>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-mono">
                          <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                            Benefit: (C<sub>out</sub> - C<sub>min</sub>) / (C<sub>max</sub> - C<sub>min</sub>) &times; 100
                          </span>
                          <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                            Cost: (C<sub>max</sub> - C<sub>out</sub>) / (C<sub>max</sub> - C<sub>min</sub>) &times; 100
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        Mengonversi nilai mentah menjadi skala baku 0 s.d. 100 dengan batas <span className="font-mono font-bold">C<sub>min</sub> = 25</span> dan <span className="font-mono font-bold">C<sub>max</sub> = 100</span>. Kriteria C1 s.d. C4 bersifat Benefit (makin tinggi makin baik), sedangkan C5 bersifat Cost (makin kecil plafon pinjaman, makin kecil risiko kredit bagi koperasi).
                      </p>

                      <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                              <th className="py-2.5 px-3 text-center">No</th>
                              <th className="py-2.5 px-3">Kode</th>
                              <th className="py-2.5 px-3">Nama Calon</th>
                              <th className="py-2.5 px-3 font-mono text-center">u<sub>1</sub>(C1 - Ben)</th>
                              <th className="py-2.5 px-3 font-mono text-center">u<sub>2</sub>(C2 - Ben)</th>
                              <th className="py-2.5 px-3 font-mono text-center">u<sub>3</sub>(C3 - Ben)</th>
                              <th className="py-2.5 px-3 font-mono text-center">u<sub>4</sub>(C4 - Ben)</th>
                              <th className="py-2.5 px-3 font-mono text-center text-amber-800">u<sub>5</sub>(C5 - Cost)</th>
                              <th className="py-2.5 px-3 text-center font-sans font-bold text-slate-800">Rerata Utilitas</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                            {evaluations.map((ev, idx) => {
                              const avg = ((Number(ev.utility_c1) + Number(ev.utility_c2) + Number(ev.utility_c3) + Number(ev.utility_c4) + Number(ev.utility_c5)) / 5).toFixed(2);
                              return (
                                <tr key={ev.id} className="hover:bg-slate-50">
                                  <td className="py-2 px-3 text-center text-slate-400">{idx + 1}</td>
                                  <td className="py-2 px-3 font-bold text-slate-900">{ev.alternative_code}</td>
                                  <td className="py-2 px-3 font-sans font-medium text-slate-900">{getCandidateName(ev)}</td>
                                  <td className="py-2 px-3 text-center">{ev.utility_c1}</td>
                                  <td className="py-2 px-3 text-center">{ev.utility_c2}</td>
                                  <td className="py-2 px-3 text-center">{ev.utility_c3}</td>
                                  <td className="py-2 px-3 text-center">{ev.utility_c4}</td>
                                  <td className="py-2 px-3 text-center font-bold text-amber-800 bg-amber-50/50">{ev.utility_c5}</td>
                                  <td className="py-2 px-3 text-center font-sans font-bold text-slate-900">{avg}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* TAHAP 4: MATRIKS NILAI TERBOBOT */}
                    <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">4</span>
                          <h4 className="font-bold text-sm text-slate-900">Tahap 4: Pembentukan Matriks Nilai Terbobot (w<sub>j</sub> &times; u<sub>j</sub>)</h4>
                        </div>
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 text-[11px] font-mono text-slate-700">
                          <span>Rumus Perkalian:</span>
                          <strong className="text-slate-900">V<sub>ij</sub> = w<sub>j</sub> &times; u<sub>j</sub>(a<sub>i</sub>)</strong>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        Mengalikan masing-masing nilai utilitas kriteria dengan bobot kriteria yang telah dinormalisasikan (<span className="font-mono font-bold">w<sub>1</sub>={w1.toFixed(2)}, w<sub>2</sub>={w2.toFixed(2)}, w<sub>3</sub>={w3.toFixed(2)}, w<sub>4</sub>={w4.toFixed(2)}, w<sub>5</sub>={w5.toFixed(2)}</span>).
                      </p>

                      <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                              <th className="py-2.5 px-3 text-center">No</th>
                              <th className="py-2.5 px-3">Kode</th>
                              <th className="py-2.5 px-3">Nama Calon</th>
                              <th className="py-2.5 px-3 font-mono text-center">C1 (w={w1.toFixed(2)})</th>
                              <th className="py-2.5 px-3 font-mono text-center">C2 (w={w2.toFixed(2)})</th>
                              <th className="py-2.5 px-3 font-mono text-center">C3 (w={w3.toFixed(2)})</th>
                              <th className="py-2.5 px-3 font-mono text-center">C4 (w={w4.toFixed(2)})</th>
                              <th className="py-2.5 px-3 font-mono text-center">C5 (w={w5.toFixed(2)})</th>
                              <th className="py-2.5 px-3 text-center font-sans font-bold text-emerald-800 bg-emerald-50/60">&Sigma; Terbobot</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                            {evaluations.map((ev, idx) => {
                              const calc1 = (w1 * Number(ev.utility_c1)).toFixed(2);
                              const calc2 = (w2 * Number(ev.utility_c2)).toFixed(2);
                              const calc3 = (w3 * Number(ev.utility_c3)).toFixed(2);
                              const calc4 = (w4 * Number(ev.utility_c4)).toFixed(2);
                              const calc5 = (w5 * Number(ev.utility_c5)).toFixed(2);
                              return (
                                <tr key={ev.id} className="hover:bg-slate-50">
                                  <td className="py-2 px-3 text-center text-slate-400">{idx + 1}</td>
                                  <td className="py-2 px-3 font-bold text-slate-900">{ev.alternative_code}</td>
                                  <td className="py-2 px-3 font-sans font-medium text-slate-900">{getCandidateName(ev)}</td>
                                  <td className="py-2 px-3 text-center">{calc1}</td>
                                  <td className="py-2 px-3 text-center">{calc2}</td>
                                  <td className="py-2 px-3 text-center">{calc3}</td>
                                  <td className="py-2 px-3 text-center">{calc4}</td>
                                  <td className="py-2 px-3 text-center">{calc5}</td>
                                  <td className="py-2 px-3 text-center font-bold text-emerald-800 bg-emerald-50/40 text-sm font-sans">
                                    {ev.final_score}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* TAHAP 5: NILAI AKHIR & PERANGKINGAN */}
                    <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">5</span>
                          <h4 className="font-bold text-sm text-slate-900">Tahap 5: Nilai Akhir Total V(A<sub>i</sub>) &amp; Penetapan Peringkat (Ranking)</h4>
                        </div>
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 text-[11px] font-mono text-slate-700">
                          <span>Fungsi Aditif:</span>
                          <strong className="text-slate-900">V(A<sub>i</sub>) = &Sigma; w<sub>j</sub> &times; u<sub>j</sub>(a<sub>i</sub>)</strong>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        Nilai akhir diperoleh dari penjumlahan seluruh nilai terbobot kriteria, kemudian diurutkan secara <em>descending</em> (tertinggi ke terendah). Batas kelayakan: <span className="font-bold text-emerald-800">&ge; 75.00 (Sangat Layak)</span>, <span className="font-bold text-amber-800">50.00 - 74.99 (Layak Bersyarat)</span>, dan <span className="font-bold text-rose-800">&lt; 50.00 (Tidak Layak)</span>.
                      </p>

                      <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                              <th className="py-2.5 px-3 text-center">Peringkat</th>
                              <th className="py-2.5 px-3">Kode Alternatif</th>
                              <th className="py-2.5 px-3">Nama Calon Peminjam</th>
                              <th className="py-2.5 px-3">Unit Kerja</th>
                              <th className="py-2.5 px-3">Plafon Pinjaman</th>
                              <th className="py-2.5 px-3 font-mono text-center font-bold text-slate-900">Nilai Akhir V(A<sub>i</sub>)</th>
                              <th className="py-2.5 px-3">Status Rekomendasi SPK</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {evaluations.map((ev) => (
                              <tr key={ev.id} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 text-center font-bold">
                                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-mono font-bold ${
                                    ev.rank === 1 ? 'bg-amber-400 text-slate-950 font-extrabold shadow-xs' :
                                    ev.rank === 2 ? 'bg-slate-300 text-slate-900 font-bold' :
                                    ev.rank === 3 ? 'bg-amber-700/20 text-amber-900 font-bold' :
                                    'bg-slate-100 text-slate-600'
                                  }`}>
                                    {ev.rank}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-bold font-mono text-slate-900">{ev.alternative_code}</td>
                                <td className="py-2.5 px-3 font-semibold text-slate-900">
                                  {getCandidateName(ev)}
                                  {ev.is_manual_simulation && (
                                    <span className="ml-1.5 text-[9px] bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.5 rounded border border-amber-200">
                                      Simulasi
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-slate-600">{getCandidateUnit(ev)}</td>
                                <td className="py-2.5 px-3 font-medium text-slate-900">{formatCurrency(getCandidatePlafon(ev))}</td>
                                <td className="py-2.5 px-3 font-mono text-center font-extrabold text-sm text-slate-900">
                                  {ev.final_score}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className={`px-2.5 py-1 rounded text-[11px] font-semibold border ${
                                    ev.final_score >= 75 
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                      : ev.final_score >= 50 
                                      ? 'bg-amber-50 text-amber-800 border-amber-200' 
                                      : 'bg-rose-50 text-rose-800 border-rose-200'
                                  }`}>
                                    {ev.recommendation}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                )}

                {/* ============================================================== */}
                {/* SUB-TAB 2: MATRIKS KEPUTUSAN RINGKAS (SCREENSHOT RESMI)        */}
                {/* ============================================================== */}
                {perangkinganSubTab === 'ringkas' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                      Tampilan matriks ringkas utilitas dan nilai akhir untuk verifikasi cepat keputusan kredit:
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                            <th className="py-3 px-3 text-center">No</th>
                            <th className="py-3 px-3">Alternatif</th>
                            <th className="py-3 px-3">Kriteria 1 (THP)</th>
                            <th className="py-3 px-3">Kriteria 2 (Simp)</th>
                            <th className="py-3 px-3">Kriteria 3 (Kerja)</th>
                            <th className="py-3 px-3">Kriteria 4 (Hist)</th>
                            <th className="py-3 px-3">Kriteria 5 (Plaf)</th>
                            <th className="py-3 px-3 font-bold text-slate-900">Hasil V(Ai)</th>
                            <th className="py-3 px-4">Keterangan</th>
                          </tr>
                          <tr className="bg-emerald-50/60 border-b border-emerald-200 text-emerald-900 font-mono font-bold text-[11px]">
                            <td className="py-2.5 px-3 text-center">-</td>
                            <td className="py-2.5 px-3 uppercase">Bobot (wj)</td>
                            <td className="py-2.5 px-3">{w1.toFixed(2)}</td>
                            <td className="py-2.5 px-3">{w2.toFixed(2)}</td>
                            <td className="py-2.5 px-3">{w3.toFixed(2)}</td>
                            <td className="py-2.5 px-3">{w4.toFixed(2)}</td>
                            <td className="py-2.5 px-3">{w5.toFixed(2)}</td>
                            <td className="py-2.5 px-3 font-sans">-</td>
                            <td className="py-2.5 px-4 font-sans text-emerald-800 font-semibold">&Sigma; w = 1.00</td>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                          {evaluations.map((ev, idx) => (
                            <tr key={ev.id} className="hover:bg-slate-50 transition">
                              <td className="py-3 px-3 text-center font-sans font-bold text-slate-900">{idx + 1}</td>
                              <td className="py-3 px-3 font-bold text-slate-900 font-sans">
                                {ev.alternative_code} - {getCandidateName(ev)}
                                {ev.is_manual_simulation && (
                                  <span className="ml-1.5 text-[9px] bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.5 rounded border border-amber-200 font-sans">
                                    Simulasi
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3">{ev.utility_c1}</td>
                              <td className="py-3 px-3">{ev.utility_c2}</td>
                              <td className="py-3 px-3">{ev.utility_c3}</td>
                              <td className="py-3 px-3">{ev.utility_c4}</td>
                              <td className="py-3 px-3">{ev.utility_c5}</td>
                              <td className="py-3 px-3 font-bold text-sm text-slate-900 font-sans">
                                {ev.final_score}
                              </td>
                              <td className="py-3 px-4 font-sans">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                                  ev.final_score >= 75 
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                    : ev.final_score >= 50 
                                    ? 'bg-amber-50 text-amber-800 border-amber-200' 
                                    : 'bg-rose-50 text-rose-800 border-rose-200'
                                }`}>
                                  {ev.recommendation}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ============================================================== */}
                {/* SUB-TAB 3: BEDAH HITUNG MANUAL INTERAKTIF (UJI KASUS SAMPEL)  */}
                {/* ============================================================== */}
                {perangkinganSubTab === 'manual' && (
                  <div className="space-y-5">
                    {/* Candidate Picker Bar */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Pilih Alternatif Uji Kasus
                        </span>
                        <h4 className="font-bold text-sm text-slate-900">Bedah Bukti Perhitungan Manual (Excel vs Sistem)</h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={activeManualEval?.id || ''}
                          onChange={(e) => setSelectedManualAltId(Number(e.target.value))}
                          className="p-2 rounded-lg border border-slate-300 text-xs font-semibold bg-white text-slate-800"
                        >
                          {evaluations.map((ev) => (
                            <option key={ev.id} value={ev.id}>
                              {ev.alternative_code} - {getCandidateName(ev)} ({ev.is_manual_simulation ? 'Simulasi' : 'Riil'})
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={handleCopyManual}
                          className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs"
                          title="Salin perincian perhitungan ke format teks Microsoft Word Bab 4"
                        >
                          {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copySuccess ? 'Tersalin!' : 'Salin Format Bab 4'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Candidate Profile Details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Kandidat Terpilih</span>
                        <span className="font-bold text-slate-900 text-sm block mt-0.5">{manCode} - {manName}</span>
                        <span className="text-[10px] text-slate-500">NIK: {manNik}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Unit Kerja &amp; Plafon</span>
                        <span className="font-bold text-slate-900 text-sm block mt-0.5">{formatCurrency(manPlafon)}</span>
                        <span className="text-[10px] text-slate-500">{manUnit}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Nilai Akhir V({manCode})</span>
                        <span className="font-bold text-emerald-700 text-sm block mt-0.5">{manFinal}</span>
                        <span className="text-[10px] text-emerald-600 font-semibold">Peringkat #{activeManualEval?.rank}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Keputusan SPK</span>
                        <span className="font-bold text-slate-900 text-xs block mt-1">{activeManualEval?.recommendation}</span>
                        <span className="text-[10px] text-slate-500">Ambang Batas &ge; 75.00</span>
                      </div>
                    </div>

                    {/* Mathematical Derivation Steps for the Alternative */}
                    <div className="space-y-4">
                      
                      {/* Step A: Data Mentah */}
                      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">A</span>
                          <span className="font-bold text-xs text-slate-900">Nilai Input Parameter Sub-Kriteria Alternatif ({manCode})</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono pt-1">
                          <div className="p-2 rounded bg-slate-50 border border-slate-200 text-center">
                            <span className="text-[10px] text-slate-400 block font-sans">C1 (Sisa THP)</span>
                            <span className="font-bold text-slate-900 text-sm">{manV1}</span>
                          </div>
                          <div className="p-2 rounded bg-slate-50 border border-slate-200 text-center">
                            <span className="text-[10px] text-slate-400 block font-sans">C2 (Simpanan)</span>
                            <span className="font-bold text-slate-900 text-sm">{manV2}</span>
                          </div>
                          <div className="p-2 rounded bg-slate-50 border border-slate-200 text-center">
                            <span className="text-[10px] text-slate-400 block font-sans">C3 (Masa Kerja)</span>
                            <span className="font-bold text-slate-900 text-sm">{manV3}</span>
                          </div>
                          <div className="p-2 rounded bg-slate-50 border border-slate-200 text-center">
                            <span className="text-[10px] text-slate-400 block font-sans">C4 (Riwayat)</span>
                            <span className="font-bold text-slate-900 text-sm">{manV4}</span>
                          </div>
                          <div className="p-2 rounded bg-slate-50 border border-slate-200 text-center">
                            <span className="text-[10px] text-slate-400 block font-sans">C5 (Plafon)</span>
                            <span className="font-bold text-slate-900 text-sm">{manV5}</span>
                          </div>
                        </div>
                      </div>

                      {/* Step B: Perhitungan Fungsi Utilitas */}
                      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">B</span>
                          <span className="font-bold text-xs text-slate-900">Perhitungan Substitusi Fungsi Utilitas u<sub>j</sub>({manCode})</span>
                        </div>
                        <div className="space-y-1.5 font-mono text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-700">
                          <p>
                            • u<sub>1</sub>(C1 - Benefit) = (({manV1} - 25) / (100 - 25)) &times; 100 = ({manV1 - 25} / 75) &times; 100 = <strong className="text-slate-900">{manU1}</strong>
                          </p>
                          <p>
                            • u<sub>2</sub>(C2 - Benefit) = (({manV2} - 25) / (100 - 25)) &times; 100 = ({manV2 - 25} / 75) &times; 100 = <strong className="text-slate-900">{manU2}</strong>
                          </p>
                          <p>
                            • u<sub>3</sub>(C3 - Benefit) = (({manV3} - 25) / (100 - 25)) &times; 100 = ({manV3 - 25} / 75) &times; 100 = <strong className="text-slate-900">{manU3}</strong>
                          </p>
                          <p>
                            • u<sub>4</sub>(C4 - Benefit) = (({manV4} - 25) / (100 - 25)) &times; 100 = ({manV4 - 25} / 75) &times; 100 = <strong className="text-slate-900">{manU4}</strong>
                          </p>
                          <p className="text-amber-800 font-semibold">
                            • u<sub>5</sub>(C5 - Cost) = ((100 - {manV5}) / (100 - 25)) &times; 100 = ({100 - manV5} / 75) &times; 100 = <strong className="text-amber-900">{manU5}</strong>
                          </p>
                        </div>
                      </div>

                      {/* Step C: Perkalian Terbobot & Agregasi Aditif */}
                      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">C</span>
                          <span className="font-bold text-xs text-slate-900">Perkalian Bobot Terbobot &amp; Penjumlahan Nilai Akhir V({manCode})</span>
                        </div>
                        <div className="space-y-1.5 font-mono text-[11px] bg-emerald-50/60 p-3.5 rounded-lg border border-emerald-200 text-emerald-950">
                          <p>
                            • V<sub>1</sub> = w<sub>1</sub> &times; u<sub>1</sub> = {w1.toFixed(2)} &times; {manU1} = <strong className="text-slate-900">{manWeighted1}</strong>
                          </p>
                          <p>
                            • V<sub>2</sub> = w<sub>2</sub> &times; u<sub>2</sub> = {w2.toFixed(2)} &times; {manU2} = <strong className="text-slate-900">{manWeighted2}</strong>
                          </p>
                          <p>
                            • V<sub>3</sub> = w<sub>3</sub> &times; u<sub>3</sub> = {w3.toFixed(2)} &times; {manU3} = <strong className="text-slate-900">{manWeighted3}</strong>
                          </p>
                          <p>
                            • V<sub>4</sub> = w<sub>4</sub> &times; u<sub>4</sub> = {w4.toFixed(2)} &times; {manU4} = <strong className="text-slate-900">{manWeighted4}</strong>
                          </p>
                          <p>
                            • V<sub>5</sub> = w<sub>5</sub> &times; u<sub>5</sub> = {w5.toFixed(2)} &times; {manU5} = <strong className="text-slate-900">{manWeighted5}</strong>
                          </p>
                          <div className="pt-2 border-t border-emerald-200 text-xs font-bold text-emerald-900">
                            V({manCode}) = {manWeighted1} + {manWeighted2} + {manWeighted3} + {manWeighted4} + {manWeighted5} = <span className="text-base font-extrabold text-slate-900 underline">{manFinal}</span>
                          </div>
                        </div>
                      </div>

                      {/* Step D: Kesimpulan Narasi Skripsi */}
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                        <span className="font-bold text-slate-900 text-xs block">Kesimpulan Evaluasi Skripsi Bab 4:</span>
                        <p className="text-slate-700 leading-relaxed text-[11px]">
                          Berdasarkan hasil komputasi menggunakan metode <em>Simple Multi-Attribute Rating Technique</em> (SMART), alternatif <strong>{manCode} atas nama {manName}</strong> memperoleh nilai akhir total kelayakan kredit sebesar <strong className="font-mono text-slate-900">{manFinal}</strong>. Sesuai dengan batasan ambang batas kelayakan kredit Koperasi Karyawan Al-Azhar BSD, alternatif ini menempati peringkat <strong>Rank #{activeManualEval?.rank}</strong> dengan status rekomendasi akhir <strong className="text-emerald-800">{activeManualEval?.recommendation}</strong>.
                        </p>
                      </div>

                    </div>
                  </div>
                )}

              </div>
            );
          })()}

          {/* ============================================================== */}
          {/* MENU 6: GRAFIK HASIL PERANGKINGAN (PERSIS SCREENSHOT)         */}
          {/* ============================================================== */}
          {activeMenu === 'grafik' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
              <div>
                <h3 className="font-bold text-base text-slate-900">Hasil Akhir Perangkingan (Visualisasi Grafik)</h3>
                <p className="text-xs text-slate-500 mt-0.5">Komparasi nilai skor akhir kelayakan per calon peminjam (Skala 0 - 100).</p>
              </div>

              {/* Bar Chart Container */}
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-6">
                
                {/* Legend */}
                <div className="flex items-center justify-center gap-6 text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-emerald-600"></span>
                    <span className="text-slate-700">Sangat Layak (Skor ≥ 75)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-amber-500"></span>
                    <span className="text-slate-700">Layak Bersyarat (50 - 74)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-rose-500"></span>
                    <span className="text-slate-700">Tidak Layak (&lt; 50)</span>
                  </div>
                </div>

                {/* Vertical Bars */}
                <div className="h-64 flex items-end justify-around gap-4 pt-8 pb-2 border-b border-slate-300">
                  {evaluations.map((ev) => {
                    const heightPercent = Math.min(100, Math.max(10, ev.final_score));
                    const barColor = ev.final_score >= 75 ? 'bg-emerald-600' : ev.final_score >= 50 ? 'bg-amber-500' : 'bg-rose-500';

                    return (
                      <div key={ev.id} className="flex-1 flex flex-col items-center gap-2 h-full justify-end max-w-[80px]">
                        <span className="text-xs font-bold text-slate-900 font-mono">
                          {ev.final_score}
                        </span>
                        <div
                          className={`w-full rounded-t-lg transition-all duration-500 shadow-xs ${barColor}`}
                          style={{ height: `${heightPercent}%` }}
                          title={`${ev.alternative_code}: ${ev.final_score} / 100`}
                        ></div>
                      </div>
                    );
                  })}
                </div>

                {/* X-Axis Labels */}
                <div className="flex items-start justify-around gap-4 text-center">
                  {evaluations.map((ev) => (
                    <div key={ev.id} className="flex-1 max-w-[80px]">
                      <span className="font-bold text-xs font-mono text-slate-900 block">{ev.alternative_code}</span>
                      <span className="text-[10px] text-slate-500 truncate block" title={getCandidateName(ev)}>
                        {getCandidateName(ev)}
                      </span>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* MENU 7: LAPORAN & CETAK REKAPITULASI RESMI                    */}
          {/* ============================================================== */}
          {activeMenu === 'laporan' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between no-print bg-white p-4 rounded-2xl border border-slate-200">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Format Laporan Hasil SPK SMART</h3>
                  <p className="text-[11px] text-slate-500">Siap cetak atau ekspor ke PDF untuk berkas lampiran skripsi Bab 4.</p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Laporan Resmi (PDF)</span>
                </button>
              </div>

              {/* Printable Paper Area */}
              <div id="printable-area" className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-sm text-slate-900 space-y-6">
                
                {/* Kop Surat Koperasi */}
                <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                  <h2 className="text-base font-extrabold uppercase tracking-wide">KOPERASI KONSUMEN KARYAWAN AL-AZHAR BSD</h2>
                  <p className="text-xs text-slate-600">Jl. Puspita Loka No. 1, BSD City, Serpong, Tangerang Selatan, Banten</p>
                  <p className="text-[10px] text-slate-500 font-mono">Unit Layanan Simpan Pinjam (Kredit) • SK Kemenkumham RI</p>
                </div>

                <div className="text-center space-y-1">
                  <h3 className="text-sm font-bold uppercase underline">REKAPITULASI HASIL REKOMENDASI SPK KELAYAKAN KREDIT</h3>
                  <p className="text-xs text-slate-500">Penerapan Metode SMART Periode Tahun 2026</p>
                </div>

                {/* Formal Table */}
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 font-bold text-[11px]">
                      <th className="p-2 border-r border-slate-300 text-center">Rank</th>
                      <th className="p-2 border-r border-slate-300">Kode</th>
                      <th className="p-2 border-r border-slate-300">Nama Anggota</th>
                      <th className="p-2 border-r border-slate-300">Unit Kerja</th>
                      <th className="p-2 border-r border-slate-300">Plafon Diajukan</th>
                      <th className="p-2 border-r border-slate-300 text-center">Skor SMART</th>
                      <th className="p-2">Status Keputusan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 text-[11px]">
                    {evaluations.map((ev) => (
                      <tr key={ev.id}>
                        <td className="p-2 border-r border-slate-300 text-center font-bold">#{ev.rank}</td>
                        <td className="p-2 border-r border-slate-300 font-mono font-bold">{ev.alternative_code}</td>
                        <td className="p-2 border-r border-slate-300 font-semibold">
                          {getCandidateName(ev)}
                          {ev.is_manual_simulation && (
                            <span className="ml-1 text-[9px] text-amber-700 italic">(Simulasi)</span>
                          )}
                        </td>
                        <td className="p-2 border-r border-slate-300">{getCandidateUnit(ev)}</td>
                        <td className="p-2 border-r border-slate-300">{formatCurrency(getCandidatePlafon(ev))}</td>
                        <td className="p-2 border-r border-slate-300 font-mono text-center font-bold">{ev.final_score}</td>
                        <td className="p-2 font-semibold">{ev.recommendation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Signature Block */}
                <div className="pt-8 flex justify-between text-xs">
                  <div>
                    <p className="text-slate-500">Mengetahui,</p>
                    <p className="font-bold text-slate-800">Petugas Simpan Pinjam</p>
                    <div className="h-16"></div>
                    <p className="font-bold underline text-slate-900">Koordinator Simpin</p>
                    <p className="text-[10px] text-slate-500">NIP: SIMPIN001</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-500">Tangerang Selatan, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p className="font-bold text-slate-800">Ketua Koperasi Al-Azhar BSD</p>
                    <div className="h-16"></div>
                    <p className="font-bold underline text-slate-900">Arrizal Muhaemin Yunus, M.Pd</p>
                    <p className="text-[10px] text-slate-500">NIP: KETUA001</p>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>

      {/* MODAL: TAMBAH / EDIT KRITERIA */}
      {isCriteriaModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingCriterion ? `Edit Kriteria ${editingCriterion.code}` : 'Tambah Kriteria Baru'}
              </h3>
              <button onClick={() => setIsCriteriaModalOpen(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveCriterion} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kode Kriteria</label>
                <input
                  type="text"
                  required
                  value={critCode}
                  onChange={(e) => setCritCode(e.target.value)}
                  placeholder="C1, C2, dsb."
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Kriteria</label>
                <input
                  type="text"
                  required
                  value={critName}
                  onChange={(e) => setCritName(e.target.value)}
                  placeholder="Nama kriteria..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Kriteria</label>
                  <select
                    value={critType}
                    onChange={(e: any) => setCritType(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-semibold"
                  >
                    <option value="benefit">Benefit (Makin besar makin baik)</option>
                    <option value="cost">Cost (Makin kecil makin baik)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bobot Kepentingan</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={100}
                    value={critRawWeight}
                    onChange={(e) => setCritRawWeight(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan / Landasan</label>
                <textarea
                  rows={2}
                  value={critDesc}
                  onChange={(e) => setCritDesc(e.target.value)}
                  placeholder="Penjelasan kriteria..."
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCriteriaModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
                >
                  Simpan Kriteria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ATUR BOBOT CEPAT */}
      {isWeightModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Pengaturan Bobot Cepat (Normalisasi Otomatis)</h3>
                <p className="text-[11px] text-slate-400">Total bobot akan dinormalisasi otomatis ke 1.0 (100%).</p>
              </div>
              <button onClick={() => setIsWeightModalOpen(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveFastWeights} className="p-5 space-y-3.5 text-xs">
              <div className="space-y-2.5">
                {criteria.map((c) => {
                  const currentRaw = fastWeights.find((w) => w.id === c.id)?.raw_weight || 0;
                  return (
                    <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div>
                        <span className="font-bold font-mono text-slate-900 block">{c.code} - {c.name}</span>
                        <span className="text-[10px] text-slate-400 uppercase">{c.type}</span>
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={currentRaw}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setFastWeights((prev) => prev.map((item) => (item.id === c.id ? { ...item, raw_weight: val } : item)));
                          }}
                          className="w-full p-2 text-right rounded-lg border border-slate-300 font-mono font-bold"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsWeightModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
                >
                  Simpan &amp; Normalisasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH SUB-KRITERIA */}
      {isSubModalOpen && selectedParentCriterion && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-xs">Tambah Skala: {selectedParentCriterion.code}</h3>
              <button onClick={() => setIsSubModalOpen(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveSubCriterion} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Label Parameter (Kondisi)</label>
                <input
                  type="text"
                  required
                  value={subLabel}
                  onChange={(e) => setSubLabel(e.target.value)}
                  placeholder="misal: Masa Kerja > 5 Tahun"
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nilai Skala Poin</label>
                <select
                  value={subScore}
                  onChange={(e) => setSubScore(Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono font-bold"
                >
                  <option value={100}>100 (Sangat Baik / Prioritas Tertinggi)</option>
                  <option value={75}>75 (Baik / Prioritas Tinggi)</option>
                  <option value={50}>50 (Cukup / Prioritas Sedang)</option>
                  <option value={25}>25 (Kurang / Prioritas Rendah)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
                >
                  Simpan Skala
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INPUT ALTERNATIF SIMULASI DINAMIS & DATA RIIL KOPERASI */}
      {isSimModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden border border-slate-200 my-8">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded">
                    Lab Riset SPK
                  </span>
                  <span className="text-xs text-slate-400">Metode SMART</span>
                </div>
                <h3 className="font-bold text-sm text-white mt-1">
                  {editingSim ? 'Edit Alternatif Simulasi Riset' : 'Input Alternatif Baru (Data Riil Koperasi)'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Input data calon pemohon dengan data finansial riil koperasi atau tentukan skor skala kriteria langsung.
                </p>
              </div>
              <button 
                onClick={() => setIsSimModalOpen(false)} 
                className="text-slate-400 hover:text-white font-bold p-1 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
              <button
                type="button"
                onClick={() => setSimInputMode('real')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                  simInputMode === 'real'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>🏢 Mode Data Riil Koperasi (Slip Gaji &amp; Simpanan)</span>
              </button>
              <button
                type="button"
                onClick={() => setSimInputMode('scores')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                  simInputMode === 'scores'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>⚙️ Mode Skor Kriteria Langsung (C1 - C5)</span>
              </button>
            </div>

            <form onSubmit={handleSaveSimulation} className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              
              {/* Bagian 1: Identitas Calon */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-bold text-slate-900 text-xs block border-b border-slate-200 pb-1.5">
                  1. Identitas Calon Alternatif
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nama Lengkap Calon <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={simName}
                      onChange={(e) => setSimName(e.target.value)}
                      placeholder="misal: Achmad Sobari, M.Pd"
                      className="w-full p-2.5 rounded-lg border border-slate-300 font-semibold text-slate-900 bg-white focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      NIK / Kode ID
                    </label>
                    <input
                      type="text"
                      value={simNik}
                      onChange={(e) => setSimNik(e.target.value)}
                      placeholder="misal: 3209071808830004"
                      className="w-full p-2.5 rounded-lg border border-slate-300 font-mono text-slate-700 bg-white focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Unit Kerja / Lembaga
                    </label>
                    <select
                      value={simUnit}
                      onChange={(e) => setSimUnit(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 font-medium text-slate-800 bg-white focus:outline-none focus:border-emerald-600"
                    >
                      <option value="SD Islam Al-Azhar BSD">SD Islam Al-Azhar BSD</option>
                      <option value="SMP Islam Al-Azhar BSD">SMP Islam Al-Azhar BSD</option>
                      <option value="SMA Islam Al-Azhar BSD">SMA Islam Al-Azhar BSD</option>
                      <option value="TK Islam Al-Azhar BSD">TK Islam Al-Azhar BSD</option>
                      <option value="Pelaksana Harian (LAKHAR)">Pelaksana Harian (LAKHAR)</option>
                      <option value="Bagian Keuangan Yayasan">Bagian Keuangan Yayasan</option>
                      <option value="Bagian Sarana &amp; Prasarana">Bagian Sarana &amp; Prasarana</option>
                      <option value="Unit Lainnya">Unit Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Plafon Pinjaman Diajukan (Rp) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step={500000}
                      min={1000000}
                      required
                      value={simPlafon}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSimPlafon(val);
                        if (simInputMode === 'real') {
                          const calc = computeScoresFromRealData(simGajiPokok, simPotonganGaji, simSaldoSimpanan, simMasaKerja, simStatusPegawai, simRiwayat, val);
                          setSimScores({ C1: calc.c1, C2: calc.c2, C3: calc.c3, C4: calc.c4, C5: calc.c5 });
                        }
                      }}
                      className="w-full p-2.5 rounded-lg border border-slate-300 font-mono font-bold text-slate-900 bg-white focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Bagian 2A: Mode Data Riil Koperasi */}
              {simInputMode === 'real' && (() => {
                const sisa = Math.max(0, simGajiPokok - simPotonganGaji);
                const rasio = simGajiPokok > 0 ? (sisa / simGajiPokok) * 100 : 0;
                const calc = computeScoresFromRealData(simGajiPokok, simPotonganGaji, simSaldoSimpanan, simMasaKerja, simStatusPegawai, simRiwayat, simPlafon);

                return (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <span className="font-bold text-slate-900 text-xs">
                        2. Parameter Riil Koperasi (Slip Gaji &amp; Arsip Simpin)
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Auto-Mapping ke Kriteria SMART
                      </span>
                    </div>

                    {/* C1: Gaji & Potongan */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <Coins className="w-4 h-4 text-emerald-600" />
                          <span>Kriteria C1: Kapasitas Finansial (Slip Gaji)</span>
                        </span>
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Skor C1: {calc.c1} ({rasio >= 50 ? '≥50%' : rasio >= 40 ? '40-49%' : '<40%'})
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Gaji Pokok / Total Penghasilan</label>
                          <input
                            type="number"
                            step={100000}
                            min={1000000}
                            value={simGajiPokok}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setSimGajiPokok(val);
                              const c = computeScoresFromRealData(val, simPotonganGaji, simSaldoSimpanan, simMasaKerja, simStatusPegawai, simRiwayat, simPlafon);
                              setSimScores({ C1: c.c1, C2: c.c2, C3: c.c3, C4: c.c4, C5: c.c5 });
                            }}
                            className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Total Potongan Rutin</label>
                          <input
                            type="number"
                            step={100000}
                            min={0}
                            value={simPotonganGaji}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setSimPotonganGaji(val);
                              const c = computeScoresFromRealData(simGajiPokok, val, simSaldoSimpanan, simMasaKerja, simStatusPegawai, simRiwayat, simPlafon);
                              setSimScores({ C1: c.c1, C2: c.c2, C3: c.c3, C4: c.c4, C5: c.c5 });
                            }}
                            className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold text-slate-900"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px]">
                        <div>
                          Sisa THP: <strong className="text-slate-900">{formatCurrency(sisa)}</strong>
                        </div>
                        <div>
                          Rasio Sisa Gaji:{' '}
                          <strong className={rasio >= 50 ? 'text-emerald-700 font-bold' : rasio >= 40 ? 'text-amber-700 font-bold' : 'text-rose-700 font-bold'}>
                            {rasio.toFixed(1)}%
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* C2: Simpanan Koperasi */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <Wallet className="w-4 h-4 text-emerald-600" />
                          <span>Kriteria C2: Saldo Simpanan (Wajib &amp; Pokok)</span>
                        </span>
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Skor C2: {calc.c2} ({simSaldoSimpanan > 5000000 ? '> Rp 5 Jt' : simSaldoSimpanan >= 1000000 ? 'Rp 1-5 Jt' : '< Rp 1 Jt'})
                        </span>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Saldo Simpanan di Koperasi (Rp)</label>
                        <input
                          type="number"
                          step={500000}
                          min={0}
                          value={simSaldoSimpanan}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setSimSaldoSimpanan(val);
                            const c = computeScoresFromRealData(simGajiPokok, simPotonganGaji, val, simMasaKerja, simStatusPegawai, simRiwayat, simPlafon);
                            setSimScores({ C1: c.c1, C2: c.c2, C3: c.c3, C4: c.c4, C5: c.c5 });
                          }}
                          className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold text-slate-900"
                        />
                      </div>
                    </div>

                    {/* C3: Masa Kerja & Status */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <Briefcase className="w-4 h-4 text-emerald-600" />
                          <span>Kriteria C3: Masa Kerja &amp; Status Kepegawaian</span>
                        </span>
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Skor C3: {calc.c3} ({simStatusPegawai === 'TETAP' ? (simMasaKerja > 5 ? 'Tetap >5 Thn' : 'Tetap ≤5 Thn') : 'Kontrak'})
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Masa Kerja (Tahun)</label>
                          <input
                            type="number"
                            min={0}
                            max={40}
                            value={simMasaKerja}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setSimMasaKerja(val);
                              const c = computeScoresFromRealData(simGajiPokok, simPotonganGaji, simSaldoSimpanan, val, simStatusPegawai, simRiwayat, simPlafon);
                              setSimScores({ C1: c.c1, C2: c.c2, C3: c.c3, C4: c.c4, C5: c.c5 });
                            }}
                            className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Status Kepegawaian</label>
                          <select
                            value={simStatusPegawai}
                            onChange={(e: any) => {
                              const val = e.target.value;
                              setSimStatusPegawai(val);
                              const c = computeScoresFromRealData(simGajiPokok, simPotonganGaji, simSaldoSimpanan, simMasaKerja, val, simRiwayat, simPlafon);
                              setSimScores({ C1: c.c1, C2: c.c2, C3: c.c3, C4: c.c4, C5: c.c5 });
                            }}
                            className="w-full p-2 rounded-lg border border-slate-300 font-semibold text-slate-900"
                          >
                            <option value="TETAP">Pegawai Tetap Yayasan</option>
                            <option value="KONTRAK">Pegawai Kontrak / PKWT</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* C4: Riwayat Angsuran */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Kriteria C4: Riwayat Kredit / Kolektibilitas</span>
                        </span>
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Skor C4: {calc.c4}
                        </span>
                      </div>
                      <select
                        value={simRiwayat}
                        onChange={(e: any) => {
                          const val = e.target.value;
                          setSimRiwayat(val);
                          const c = computeScoresFromRealData(simGajiPokok, simPotonganGaji, simSaldoSimpanan, simMasaKerja, simStatusPegawai, val, simPlafon);
                          setSimScores({ C1: c.c1, C2: c.c2, C3: c.c3, C4: c.c4, C5: c.c5 });
                        }}
                        className="w-full p-2 rounded-lg border border-slate-300 font-medium text-slate-900"
                      >
                        <option value="sangat_lancar">Sangat Lancar / Anggota Baru (Kolektibilitas 1) — Skor 100</option>
                        <option value="tepat_waktu">Pernah Pinjam &amp; Lunas Tepat Waktu — Skor 75</option>
                        <option value="kurang_lancar">Pernah Ada Keterlambatan / Restrukturisasi — Skor 25</option>
                      </select>
                    </div>

                    {/* Matriks Skor Terbentuk */}
                    <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Matriks Parameter SMART [X]
                        </span>
                        <span className="font-mono font-bold text-emerald-400">
                          [C1: {calc.c1}, C2: {calc.c2}, C3: {calc.c3}, C4: {calc.c4}, C5: {calc.c5}]
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Kriteria C5 (Cost):</span>
                        <span className="text-[11px] font-semibold text-slate-300">
                          Plafon {formatCurrency(simPlafon)}
                        </span>
                      </div>
                    </div>

                  </div>
                );
              })()}

              {/* Bagian 2B: Mode Skor Kriteria Skripsi Langsung */}
              {simInputMode === 'scores' && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="font-bold text-slate-900 text-xs">
                      2. Penilaian Kriteria Kelayakan Langsung (Metode SMART)
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Skala 25 s.d. 100
                    </span>
                  </div>

                  <div className="space-y-3 pt-1">
                    {criteria.map((c) => {
                      const currentScore = simScores[c.code] ?? 75;
                      const hasSub = c.sub_criteria && c.sub_criteria.length > 0;

                      return (
                        <div key={c.id} className="p-3 rounded-lg bg-white border border-slate-200 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded">
                                {c.code}
                              </span>
                              <span className="font-bold text-xs text-slate-900">
                                {c.name}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                ({c.type.toUpperCase()} • Bobot {c.normalized_weight})
                              </span>
                            </div>
                            <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                              currentScore >= 75
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : currentScore >= 50
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}>
                              Skor: {currentScore}
                            </span>
                          </div>

                          {hasSub ? (
                            <select
                              value={currentScore}
                              onChange={(e) => setSimScores({ ...simScores, [c.code]: Number(e.target.value) })}
                              className="w-full p-2 rounded-lg border border-slate-300 font-medium text-slate-800 bg-white focus:outline-none focus:border-emerald-600 text-xs"
                            >
                              {c.sub_criteria!.map((sub) => (
                                <option key={sub.id} value={sub.score_value}>
                                  [Nilai {sub.score_value}] — {sub.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <select
                              value={currentScore}
                              onChange={(e) => setSimScores({ ...simScores, [c.code]: Number(e.target.value) })}
                              className="w-full p-2 rounded-lg border border-slate-300 font-medium text-slate-800 bg-white focus:outline-none focus:border-emerald-600 text-xs"
                            >
                              <option value={100}>[Nilai 100] — Sangat Baik / Sangat Layak</option>
                              <option value={75}>[Nilai 75] — Baik / Cukup Aman</option>
                              <option value={50}>[Nilai 50] — Cukup / Standar Minimum</option>
                              <option value={25}>[Nilai 25] — Kurang / Berisiko</option>
                            </select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSimModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Simpan &amp; Hitung SMART</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BATCH IMPORT & UJI 150 DATA EMPIRIS KOPERASI (METODE SMART)       */}
      {/* ========================================================================= */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full overflow-hidden border border-slate-200 my-8">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded">
                    Uji Komputasi 150 Data
                  </span>
                  <span className="text-xs text-slate-400">Pengujian Bab 4 Skripsi</span>
                </div>
                <h3 className="font-bold text-sm text-white mt-1">
                  Import &amp; Kalkulasi Batch 150 Alternatif Data Riil Koperasi
                </h3>
                <p className="text-[11px] text-slate-400">
                  Muat dataset empiris 150 anggota Koperasi Al-Azhar BSD atau tempel data langsung dari Microsoft Excel / Google Sheets.
                </p>
              </div>
              <button 
                onClick={() => setIsBatchModalOpen(false)} 
                className="text-slate-400 hover:text-white font-bold p-1 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Batch Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
              <button
                type="button"
                onClick={() => setBatchTab('sample150')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                  batchTab === 'sample150'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>⚡ 1-Click: Muat 150 Dataset Riil Koperasi Al-Azhar BSD</span>
              </button>
              <button
                type="button"
                onClick={() => setBatchTab('paste')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                  batchTab === 'paste'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>📋 Salin-Tempel dari Excel / Spreadsheet</span>
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              
              {/* TAB 1: 1-Click 150 Sample Generator */}
              {batchTab === 'sample150' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 space-y-2">
                    <span className="font-bold text-xs block text-emerald-950">
                      Dataset Empiris 150 Alternatif Anggota Koperasi
                    </span>
                    <p className="text-[11px] leading-relaxed text-emerald-800">
                      Sistem telah menyediakan 150 catatan data realistis anggota Koperasi Konsumen Karyawan Al-Azhar BSD 
                      (kombinasi 150 guru SD, SMP, SMA, TK, staf LAKHAR, dan bagian keuangan). 
                      Setiap data mencakup parameter riil: gaji pokok (Rp 4.5jt s.d 15jt), potongan slip gaji, saldo simpanan, 
                      masa kerja (1-25 tahun), riwayat kolektibilitas, dan nominal pengajuan plafon pinjaman.
                    </p>
                    <button
                      type="button"
                      onClick={handleLoadSample150}
                      className="mt-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Muat 150 Data Empiris ke Memori</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: Salin-Tempel dari Excel */}
              {batchTab === 'paste' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[11px] space-y-1">
                    <span className="font-bold text-slate-800 block">Panduan Format Salin-Tempel dari Excel:</span>
                    <p>Blok tabel di Excel lalu Copy (Ctrl+C) dan Paste (Ctrl+V) ke dalam kotak di bawah ini.</p>
                    <p className="font-mono text-[10px] text-slate-500">
                      Urutan Kolom: Nama [Tab] NIK [Tab] Unit [Tab] C1 [Tab] C2 [Tab] C3 [Tab] C4 [Tab] Plafon
                    </p>
                  </div>

                  <textarea
                    rows={6}
                    value={batchPastedText}
                    onChange={(e) => setBatchPastedText(e.target.value)}
                    placeholder="Tempelkan baris data Excel di sini..."
                    className="w-full p-3 rounded-xl border border-slate-300 font-mono text-[11px] text-slate-800 bg-white focus:outline-none focus:border-emerald-600"
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleParsePastedText}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition"
                    >
                      Pratinjau Data Tempelan
                    </button>
                  </div>
                </div>
              )}

              {/* Area Pratinjau Dataset Siap Hitung */}
              {batchItems.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">
                      Pratinjau Data ({batchItems.length} Alternatif Terdata)
                    </span>
                    <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Siap Diproses SMART
                    </span>
                  </div>

                  <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 font-semibold text-slate-600">
                        <tr>
                          <th className="py-2 px-3">No</th>
                          <th className="py-2 px-3">Nama Anggota</th>
                          <th className="py-2 px-3">NIK</th>
                          <th className="py-2 px-3">Unit</th>
                          <th className="py-2 px-3">Plafon</th>
                          <th className="py-2 px-3 text-center">[C1 - C5]</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {batchItems.slice(0, 100).map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                            <td className="py-2 px-3 font-semibold text-slate-900">{item.candidate_name}</td>
                            <td className="py-2 px-3 font-mono text-slate-500">{item.candidate_nik}</td>
                            <td className="py-2 px-3">{item.candidate_unit}</td>
                            <td className="py-2 px-3 font-mono">{formatCurrency(item.candidate_plafon)}</td>
                            <td className="py-2 px-3 text-center font-mono font-semibold text-emerald-800">
                              [{item.val_c1}, {item.val_c2}, {item.val_c3}, {item.val_c4}, {item.val_c5}]
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {batchItems.length > 100 && (
                    <p className="text-[10px] text-slate-400 text-center italic">
                      Menampilkan 100 dari total {batchItems.length} baris data yang siap dihitung.
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleProcessBatch}
                  disabled={batchItems.length === 0 || isBatchProcessing}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white font-bold text-xs transition flex items-center gap-2 shadow-xs"
                >
                  <Play className={`w-4 h-4 ${isBatchProcessing ? 'animate-spin' : ''}`} />
                  <span>
                    {isBatchProcessing 
                      ? 'Sedang Memproses 150 Data dengan SMART...' 
                      : `Proses & Hitung ${batchItems.length > 0 ? `${batchItems.length} Data` : '150 Data'} dengan SMART`}
                  </span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
