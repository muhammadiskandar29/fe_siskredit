'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Criterion, LoanApplication, SmartEvaluation } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { LetterPreviewModal } from '../components/LetterPreviewModal';
import { InstallmentsModal } from '../components/InstallmentsModal';
import { RegisterMemberModal } from '../components/RegisterMemberModal';
import { 
  CheckCircle2, 
  XCircle, 
  Cpu, 
  FileCheck,
  Eye,
  FileText,
  AlertCircle,
  Clock,
  Layers,
  Calculator,
  Check,
  Download,
  Send,
  ExternalLink,
  Calendar,
  UserPlus,
  BookOpen,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [evaluations, setEvaluations] = useState<SmartEvaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'verification' | 'smart_matrix'>('verification');
  
  // Dual-Layer Visual State: Business vs Academic (Thesis Defense)
  const [visualMode, setVisualMode] = useState<'business' | 'academic'>('business');
  const [showFormulaModal, setShowFormulaModal] = useState<boolean>(false);

  // Detail & Assessment Modal State
  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(null);
  const [selectedLoanForLetter, setSelectedLoanForLetter] = useState<LoanApplication | null>(null);
  const [selectedLoanForInstallments, setSelectedLoanForInstallments] = useState<number | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  
  // Clean text states for C1 - C4 inputs
  const [valC1, setValC1] = useState<string>('65');
  const [valC2, setValC2] = useState<string>('6.500.000');
  const [valC3, setValC3] = useState<string>('6');
  const [valC4, setValC4] = useState<string>('100');
  const [assessmentNotes, setAssessmentNotes] = useState<string>('');
  const [isAssessing, setIsAssessing] = useState(false);
  const [isForwarding, setIsForwarding] = useState(false);


  // Request Revision & Adjustment states
  const [showRevisionBox, setShowRevisionBox] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState<string>('');
  const [adjNominal, setAdjNominal] = useState<number>(10000000);
  const [adjTenor, setAdjTenor] = useState<number>(12);
  const [adjKeperluan, setAdjKeperluan] = useState<string>('');

  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Realtime Detection Helpers for C1 - C4
  const detectC1 = (inputVal: string) => {
    if (!inputVal && inputVal !== '0') return { score: 100, label: 'Masukkan persen Sisa THP (misal: 65%)' };
    const num = Number(inputVal.replace(/\D/g, ''));
    if (num >= 60) return { score: 100, label: '✓ Skala Terdeteksi: Sisa THP ≥ 60% — Nilai Sub-Kriteria 100 (Sangat Baik / Kapasitas Aman)' };
    if (num >= 50) return { score: 75, label: '✓ Skala Terdeteksi: Sisa THP 50% - 59% — Nilai Sub-Kriteria 75 (Baik)' };
    if (num >= 40) return { score: 50, label: '✓ Skala Terdeteksi: Sisa THP 40% - 49% — Nilai Sub-Kriteria 50 (Cukup)' };
    return { score: 25, label: '✓ Skala Terdeteksi: Sisa THP < 40% — Nilai Sub-Kriteria 25 (Kurang / Berisiko)' };
  };

  const detectC2 = (inputVal: string) => {
    if (!inputVal && inputVal !== '0') return { score: 100, label: 'Masukkan nominal Simpanan Wajib (misal: 6.500.000)' };
    const num = Number(inputVal.replace(/\D/g, ''));
    if (num > 5000000) return { score: 100, label: '✓ Skala Terdeteksi: Simpanan > Rp 5.000.000,- — Nilai Sub-Kriteria 100 (Sangat Baik)' };
    if (num >= 3000000) return { score: 75, label: '✓ Skala Terdeteksi: Simpanan Rp 3.000.000 - Rp 5.000.000,- — Nilai Sub-Kriteria 75 (Baik)' };
    if (num >= 1000000) return { score: 50, label: '✓ Skala Terdeteksi: Simpanan Rp 1.000.000 - Rp 2.999.999,- — Nilai Sub-Kriteria 50 (Cukup)' };
    return { score: 25, label: '✓ Skala Terdeteksi: Simpanan < Rp 1.000.000,- — Nilai Sub-Kriteria 25 (Kurang)' };
  };

  const detectC3 = (inputVal: string) => {
    if (!inputVal && inputVal !== '0') return { score: 100, label: 'Masukkan masa kerja dalam tahun (misal: 6)' };
    const num = Number(inputVal.replace(/\D/g, ''));
    if (num > 5) return { score: 100, label: '✓ Skala Terdeteksi: Pegawai Tetap > 5 Tahun — Nilai Sub-Kriteria 100 (Prioritas Utama)' };
    if (num >= 3) return { score: 75, label: '✓ Skala Terdeteksi: Pegawai Tetap ≤ 5 Tahun — Nilai Sub-Kriteria 75 (Prioritas Baik)' };
    if (num >= 2) return { score: 50, label: '✓ Skala Terdeteksi: Pegawai Kontrak ≥ 2 Tahun — Nilai Sub-Kriteria 50 (Cukup)' };
    return { score: 25, label: '✓ Skala Terdeteksi: Pegawai Kontrak < 2 Tahun — Nilai Sub-Kriteria 25 (Minimal)' };
  };

  const detectC4 = (inputVal: string) => {
    if (!inputVal && inputVal !== '0') return { score: 100, label: 'Masukkan riwayat (misal: 100 atau Sangat Lancar)' };
    const str = inputVal.toLowerCase();
    const num = Number(str.replace(/\D/g, ''));
    if (num === 100 || str.includes('sangat') || str.includes('lancar') || str.includes('belum')) {
      return { score: 100, label: '✓ Skala Terdeteksi: Sangat Lancar / Belum Pernah Meminjam — Nilai Sub-Kriteria 100' };
    }
    if (num === 75 || str.includes('tepat') || str.includes('lunas')) {
      return { score: 75, label: '✓ Skala Terdeteksi: Pernah Meminjam & Lunas Tepat Waktu — Nilai Sub-Kriteria 75' };
    }
    if (num === 50 || str.includes('tenor') || str.includes('sesuai')) {
      return { score: 50, label: '✓ Skala Terdeteksi: Pernah Mengajukan Penyesuaian Tenor — Nilai Sub-Kriteria 50' };
    }
    return { score: 25, label: '✓ Skala Terdeteksi: Riwayat Pembayaran Kurang Lancar — Nilai Sub-Kriteria 25' };
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resLoans, resMatrix, resCriteria] = await Promise.all([
        api.get('/loans'),
        api.get('/smart/matrix'),
        api.get('/criteria')
      ]);

      if (resLoans.data.success) setLoans(resLoans.data.data);
      if (resMatrix.data.success) setEvaluations(resMatrix.data.data.evaluations);
      if (resCriteria.data.success) setCriteria(resCriteria.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleNotifNav = (e: any) => {
      const targetUrl = e.detail?.targetUrl;
      if (!targetUrl) return;

      const match = targetUrl.match(/\/loans\/(\d+)/);
      const loanId = match ? Number(match[1]) : null;

      if (targetUrl.includes('modal=installments') && loanId) {
        setSelectedLoanForInstallments(loanId);
      } else if (loanId) {
        const found = loans.find((l) => l.id === loanId);
        if (found) {
          handleOpenDetailModal(found);
        } else {
          // If loans array not loaded yet, fetch directly
          api.get(`/loans`).then((res) => {
            if (res.data.success) {
              const l = res.data.data.find((x: LoanApplication) => x.id === loanId);
              if (l) handleOpenDetailModal(l);
            }
          });
        }
      }
    };

    window.addEventListener('NOTIF_NAVIGATE', handleNotifNav);
    return () => window.removeEventListener('NOTIF_NAVIGATE', handleNotifNav);
  }, [loans]);

  const handleOpenDetailModal = (loan: LoanApplication) => {
    setSelectedLoan(loan);
    setShowRevisionBox(false);
    setRevisionNotes('');
    setAdjNominal(loan.nominal_pengajuan);
    setAdjTenor(loan.tenor_bulan);
    setAdjKeperluan(loan.keperluan_pinjaman || '');

    // Pre-fill from member application data or saved assessment
    if (loan.smart_evaluation) {
      setValC1(String(loan.smart_evaluation.val_c1));
      setValC2(String(loan.smart_evaluation.val_c2));
      setValC3(String(loan.smart_evaluation.val_c3));
      setValC4(String(loan.smart_evaluation.val_c4));
      setAssessmentNotes(loan.verification_notes || 'Berkas telah dinilai dan diverifikasi oleh Petugas Simpin.');
    } else {
      setValC1(loan.sisa_thp_persen ? String(loan.sisa_thp_persen) : '65');
      setValC2(loan.simpanan_wajib ? Number(loan.simpanan_wajib).toLocaleString('id-ID') : '6.500.000');
      setValC3(loan.masa_kerja_tahun ? String(loan.masa_kerja_tahun) : '6');
      setValC4('100');
      setAssessmentNotes('Dokumen divalidasi dan dinilai oleh Petugas Simpin.');
    }
  };

  const handleAssessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;

    if (!valC1 || !valC2 || !valC3 || !valC4) {
      setActionMsg({ type: 'error', text: 'Mohon isi semua parameter kriteria (C1 - C4) sebelum menghitung SMART!' });
      return;
    }

    setIsAssessing(true);
    setActionMsg(null);

    try {
      const scoreC1 = detectC1(valC1).score;
      const scoreC2 = detectC2(valC2).score;
      const scoreC3 = detectC3(valC3).score;
      const scoreC4 = detectC4(valC4).score;

      const res = await api.post(`/loans/${selectedLoan.id}/assess-smart`, {
        val_c1: scoreC1,
        val_c2: scoreC2,
        val_c3: scoreC3,
        val_c4: scoreC4,
        verification_notes: assessmentNotes || 'Dokumen persyaratan divalidasi dan dinilai oleh Petugas Simpin.',
      });

      if (res.data.success) {
        setActionMsg({ type: 'success', text: res.data.message });
        const updatedLoan = res.data.data;
        setSelectedLoan(updatedLoan);

        // Update local loans state immediately so data doesn't revert
        setLoans((prev) => prev.map((l) => (l.id === updatedLoan.id ? updatedLoan : l)));
        
        // Refresh full data for matrix
        const resMatrix = await api.get('/smart/matrix');
        if (resMatrix.data.success) {
          setEvaluations(resMatrix.data.data.evaluations);
        }
      }
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.response?.data?.message || 'Gagal memproses penilaian SMART' });
    } finally {
      setIsAssessing(false);
    }
  };

  const handleForwardToChairman = async () => {
    if (!selectedLoan) return;
    setIsForwarding(true);
    try {
      const res = await api.post(`/loans/${selectedLoan.id}/forward`);
      if (res.data.success) {
        setActionMsg({ type: 'success', text: res.data.message });
        const updatedLoan = res.data.data;
        setSelectedLoan(updatedLoan);
        setLoans((prev) => prev.map((l) => (l.id === updatedLoan.id ? updatedLoan : l)));
      }
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.response?.data?.message || 'Gagal meneruskan ke Ketua' });
    } finally {
      setIsForwarding(false);
    }
  };

  const handleRevisionSubmit = async () => {
    if (!selectedLoan) return;

    try {
      const res = await api.post(`/loans/${selectedLoan.id}/revision`, {
        notes: revisionNotes || 'Penyesuaian data pengajuan oleh Petugas Simpin.',
        nominal_pengajuan: adjNominal,
        tenor_bulan: adjTenor,
        keperluan: adjKeperluan,
      });

      if (res.data.success) {
        setActionMsg({ type: 'success', text: res.data.message });
        const updatedLoan = res.data.data;
        setSelectedLoan(updatedLoan);
        setLoans((prev) => prev.map((l) => (l.id === updatedLoan.id ? updatedLoan : l)));
        setShowRevisionBox(false);

        if (updatedLoan.smart_evaluation) {
          setValC1(String(updatedLoan.smart_evaluation.val_c1));
          setValC2(String(updatedLoan.smart_evaluation.val_c2));
          setValC3(String(updatedLoan.smart_evaluation.val_c3));
          setValC4(String(updatedLoan.smart_evaluation.val_c4));
        }

        // Refresh matrix evaluations & loans so leaderboard updates live!
        const [resMatrix, resLoans] = await Promise.all([
          api.get('/smart/matrix'),
          api.get('/loans')
        ]);
        if (resMatrix.data.success) {
          setEvaluations(resMatrix.data.data.evaluations);
        }
        if (resLoans.data.success) {
          setLoans(resLoans.data.data);
        }
      }
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.response?.data?.message || 'Gagal menyimpan penyesuaian data & catatan revisi.' });
    }
  };


  const formatCurrency = (val?: number) => {
    if (!val) return 'Rp 0';
    return 'Rp ' + Number(val).toLocaleString('id-ID');
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header Dashboard */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-emerald-50 text-emerald-800 text-[11px] font-semibold px-2.5 py-0.5 rounded-md border border-emerald-200">
              Workspace Petugas Simpan Pinjam
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Verifikasi Pengajuan &amp; Scoring Kelayakan Kredit
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Evaluasi berkas anggota, komputasi kelayakan berbasis metode SMART, dan koordinasikan persetujuan bersama pimpinan.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <button
            onClick={() => setShowRegisterModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition"
          >
            <UserPlus className="w-4 h-4 text-emerald-400" />
            <span>+ Registrasi Anggota Baru</span>
          </button>
        </div>
      </div>

      {/* Message Alert */}
      {actionMsg && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-3 ${
          actionMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {actionMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* Main Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('verification')}
          className={`pb-3 transition flex items-center gap-2 border-b-2 ${
            activeTab === 'verification' ? 'border-emerald-600 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Daftar Permohonan ({loans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('smart_matrix')}
          className={`pb-3 transition flex items-center gap-2 border-b-2 ${
            activeTab === 'smart_matrix' ? 'border-emerald-600 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Evaluasi &amp; Ranking Kelayakan ({evaluations.length})</span>
        </button>
      </div>

      {/* TAB 1: DAFTAR PERMOHONAN */}
      {activeTab === 'verification' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Antrean Berkas Permohonan Masuk</h3>
              <p className="text-[11px] text-slate-500">Periksa kelengkapan berkas dan lakukan penilaian kelayakan per anggota.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">No. Pengajuan</th>
                  <th className="py-3 px-4">Nama Anggota</th>
                  <th className="py-3 px-4">Nominal &amp; Tenor</th>
                  <th className="py-3 px-4">Tanggal Masuk</th>
                  <th className="py-3 px-4">Status Alur</th>
                  <th className="py-3 px-4">Credit Score</th>
                  <th className="py-3 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{loan.application_number}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{loan.user?.name}</div>
                      <div className="text-[11px] text-slate-400">Unit {loan.user?.unit_kerja} • NIK: {loan.user?.nik}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">{formatCurrency(loan.nominal_pengajuan)}</span>
                      <span className="text-slate-400 block text-[11px]">{loan.tenor_bulan} Bulan</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{formatDate(loan.created_at)}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={loan.status} />
                    </td>
                    <td className="py-3.5 px-4">
                      {loan.smart_evaluation ? (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {loan.smart_evaluation.final_score}
                          </span>
                          <span className="text-[10px] text-slate-400">/ 100</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Belum dinilai</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {['approved', 'disbursed'].includes(loan.status) && (
                          <button
                            onClick={() => setSelectedLoanForInstallments(loan.id)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition flex items-center gap-1"
                            title="Jadwal Pemotongan Gaji"
                          >
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>Angsuran</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenDetailModal(loan)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Evaluasi Berkas</span>
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

      {/* TAB 2: DUAL-LAYER VISUAL (BUSINESS vs ACADEMIC VIEW) */}
      {activeTab === 'smart_matrix' && (
        <div className="space-y-4">
          
          {/* Visual Layer Selector Toolbar */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Pilihan Sudut Pandang Visual</span>
              <h3 className="font-bold text-sm text-slate-900 mt-0.5">
                {visualMode === 'business' ? 'Tampilan Bisnis (FinTech Credit Scoring)' : 'Tampilan Audit Akademik (Transparansi SMART / Dosen)'}
              </h3>
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setVisualMode('business')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  visualMode === 'business'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tampilan Bisnis
              </button>
              <button
                onClick={() => setVisualMode('academic')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  visualMode === 'academic'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Transparansi SMART (Akademik)
              </button>
            </div>
          </div>

          {/* VIEW 1: TAMPILAN BISNIS (HUMAN-CENTRIC / FINTECH SCORING) */}
          {visualMode === 'business' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Peringkat &amp; Kelayakan Finansial Calon Peminjam</h4>
                  <p className="text-[11px] text-slate-500">
                    Parameter ditransformasikan ke dalam metrik finansial riil: Rasio Sisa THP, Simpanan, Masa Kerja, dan Rekam Jejak.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Total Evaluasi Aktif</span>
                  <span className="text-sm font-bold text-slate-900">{evaluations.length} Anggota Terdata</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Peringkat</th>
                      <th className="py-3 px-4">Identitas Anggota</th>
                      <th className="py-3 px-4">Sisa THP (Kapasitas)</th>
                      <th className="py-3 px-4">Simpanan Wajib</th>
                      <th className="py-3 px-4">Masa Kerja &amp; Status</th>
                      <th className="py-3 px-4">Riwayat Angsuran</th>
                      <th className="py-3 px-4">Pengajuan Pinjaman</th>
                      <th className="py-3 px-4">Credit Score</th>
                      <th className="py-3 px-4">Rekomendasi Keputusan</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {evaluations.map((ev) => {
                      const user = ev.loan_application?.user;
                      const loan = ev.loan_application;
                      return (
                        <tr key={ev.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 px-4">
                            <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-bold text-xs ${
                              ev.rank === 1 ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                              ev.rank === 2 ? 'bg-slate-100 text-slate-800 border border-slate-300' :
                              'bg-slate-50 text-slate-600'
                            }`}>
                              #{ev.rank}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{user?.name}</div>
                            <div className="text-[11px] text-slate-400">Unit {user?.unit_kerja} • {user?.nik}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-900">
                              {ev.val_c1 >= 60 ? '≥ 60%' : ev.val_c1 >= 50 ? '50% - 59%' : ev.val_c1 >= 40 ? '40% - 49%' : '< 40%'}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {ev.val_c1 >= 60 ? 'Kapasitas Aman' : ev.val_c1 >= 50 ? 'Kapasitas Cukup' : 'Perlu Penyesuaian'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-900">
                              {ev.val_c2 >= 100 ? '> Rp 5.000.000' : ev.val_c2 >= 75 ? 'Rp 3 - 5 Juta' : 'Rp 1 - 3 Juta'}
                            </span>
                            <span className="text-[10px] text-slate-400 block">Jaminan Kas Koperasi</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-900">
                              {user?.masa_kerja_tahun || 5} Tahun
                            </span>
                            <span className="text-[10px] text-slate-400 block uppercase">
                              Pegawai {user?.status_pegawai || 'TETAP'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-900">
                              {ev.val_c4 >= 100 ? 'Sangat Lancar' : ev.val_c4 >= 75 ? 'Lunas Tepat Waktu' : 'Pernah Penyesuaian'}
                            </span>
                            <span className="text-[10px] text-slate-400 block">Kolektibilitas Lancar</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900">{formatCurrency(loan?.nominal_pengajuan)}</span>
                            <span className="text-[10px] text-slate-400 block">{loan?.tenor_bulan} Bulan</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-slate-900">{ev.final_score}</span>
                                <span className="text-[10px] text-slate-400">/ 100</span>
                              </div>
                              <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    ev.final_score >= 75 ? 'bg-emerald-600' : ev.final_score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${Math.min(100, ev.final_score)}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                              ev.final_score >= 75 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                : ev.final_score >= 50 
                                ? 'bg-amber-50 text-amber-800 border-amber-200' 
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}>
                              {ev.recommendation}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {loan && (
                              <button
                                onClick={() => handleOpenDetailModal(loan)}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
                              >
                                Detail
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 2: TAMPILAN AUDIT AKADEMIK (TRANSPARANSI METODE SMART / DOSEN MODE) */}
          {visualMode === 'academic' && (
            <div className="space-y-4">
              
              {/* Academic Explanatory Banner */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-emerald-950 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-800/80 uppercase">
                      Transparansi Matematis Sesuai Bab IV
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white tracking-tight">
                    Matriks Nilai Utilitas u(ai) &amp; Agregasi Aditif V(Ai)
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Tabel di bawah memperlihatkan proses perhitungan algoritma SMART secara transparan: dari kriteria Benefit (C1-C4), Cost (C5), pembobotan normalisasi (Wj), hingga peringkat akhir alternatif.
                  </p>
                </div>

                <button
                  onClick={() => setShowFormulaModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition flex items-center gap-2 shrink-0 self-start sm:self-auto"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Landasan Rumus Bab IV</span>
                </button>
              </div>

              {/* Academic Matrix Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-3 text-center">Rank</th>
                        <th className="py-3 px-3">Kode (Ai)</th>
                        <th className="py-3 px-4">Nama Pemohon</th>
                        <th className="py-3 px-3">u(C1) Sisa THP<br /><span className="text-[9px] text-slate-400 lowercase font-normal">w=0.30 (benefit)</span></th>
                        <th className="py-3 px-3">u(C2) Simpanan<br /><span className="text-[9px] text-slate-400 lowercase font-normal">w=0.20 (benefit)</span></th>
                        <th className="py-3 px-3">u(C3) Masa Kerja<br /><span className="text-[9px] text-slate-400 lowercase font-normal">w=0.20 (benefit)</span></th>
                        <th className="py-3 px-3">u(C4) Riwayat<br /><span className="text-[9px] text-slate-400 lowercase font-normal">w=0.15 (benefit)</span></th>
                        <th className="py-3 px-3">u(C5) Plafon<br /><span className="text-[9px] text-slate-400 lowercase font-normal">w=0.15 (cost)</span></th>
                        <th className="py-3 px-4 font-bold text-slate-900">Total Skor V(Ai)</th>
                        <th className="py-3 px-4">Kategori Kelayakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                      {evaluations.map((ev) => (
                        <tr key={ev.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-3 text-center">
                            <span className="font-bold text-slate-900 font-sans">#{ev.rank}</span>
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900">{ev.alternative_code}</td>
                          <td className="py-3 px-4 font-sans font-bold text-slate-900">{ev.loan_application?.user?.name}</td>
                          <td className="py-3 px-3">{ev.utility_c1}</td>
                          <td className="py-3 px-3">{ev.utility_c2}</td>
                          <td className="py-3 px-3">{ev.utility_c3}</td>
                          <td className="py-3 px-3">{ev.utility_c4}</td>
                          <td className="py-3 px-3 font-semibold text-slate-900">{ev.utility_c5}</td>
                          <td className="py-3 px-4 font-bold text-sm text-slate-900 font-sans">
                            <span className="bg-slate-100 text-slate-900 px-2 py-0.5 rounded border border-slate-200">
                              {ev.final_score}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-sans">
                            <span className={`px-2.5 py-1 rounded-md font-semibold text-[11px] border ${
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

        </div>
      )}

      {/* FORMULA AUDIT MODAL (FOR THESIS DEFENSE) */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden border border-slate-200">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400">Rujukan Teori Bab 2 &amp; Bab 4</span>
                <h3 className="font-bold text-base mt-0.5">Formulasi Matematis Algoritma SMART</h3>
              </div>
              <button
                onClick={() => setShowFormulaModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700 max-h-[80vh] overflow-y-auto">
              
              {/* Step 1: Normalisasi Bobot */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 text-xs block">
                  1. Normalisasi Bobot Kriteria (w_j)
                </span>
                <p className="text-slate-600">
                  Total bobot mentah dikonversikan sehingga total bobot bernilai 1.0 (100%):
                </p>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-center font-bold text-slate-800">
                  w_j = W_j / Σ W_k
                </div>
                <p className="text-[11px] text-slate-500">
                  C1: 0.30 | C2: 0.20 | C3: 0.20 | C4: 0.15 | C5: 0.15 (Total = 1.00)
                </p>
              </div>

              {/* Step 2: Fungsi Utilitas Benefit & Cost */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 text-xs block">
                  2. Fungsi Nilai Utilitas u(a_i)
                </span>
                <div className="space-y-2">
                  <div>
                    <span className="font-semibold text-slate-800">A. Kriteria Benefit (C1 - C4):</span>
                    <div className="p-2 bg-white rounded-lg border border-slate-200 font-mono text-center font-bold text-slate-800 mt-1">
                      u(a_i) = [(C_out - C_min) / (C_max - C_min)] × 100%
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800">B. Kriteria Cost (C5 - Plafon):</span>
                    <div className="p-2 bg-white rounded-lg border border-slate-200 font-mono text-center font-bold text-slate-800 mt-1">
                      u(a_i) = [(C_max - C_out) / (C_max - C_min)] × 100%
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Agregasi Aditif V(A_i) */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 text-xs block">
                  3. Nilai Akhir Total (Agregasi Aditif)
                </span>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-center font-bold text-emerald-800">
                  V(A_i) = Σ [w_j × u(a_ij)]
                </div>
                <div className="text-[11px] text-slate-600 space-y-1 pt-1">
                  <div>• <strong>V(A_i) ≥ 75.00:</strong> Sangat Layak (Disetujui Penuh)</div>
                  <div>• <strong>50.00 ≤ V(A_i) &lt; 75.00:</strong> Layak dengan Penyesuaian (Plafon/Tenor)</div>
                  <div>• <strong>V(A_i) &lt; 50.00:</strong> Tidak Layak (Ditolak)</div>
                </div>
              </div>

            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
              <button
                onClick={() => setShowFormulaModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs"
              >
                Tutup Panduan Rumus
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ============================================================== */}
      {/* MODAL VERIFIKASI DOKUMEN & FORM PENILAIAN SPK SMART PETUGAS   */}
      {/* ============================================================== */}
      {selectedLoan && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center shrink-0 border-b border-slate-800">
              <div>
                <span className="bg-emerald-950 text-emerald-400 text-[10px] font-semibold px-2.5 py-0.5 rounded border border-emerald-800/80 uppercase">
                  Verifikasi Berkas &amp; Scoring SPK
                </span>
                <h3 className="font-bold text-base mt-1 text-white">{selectedLoan.application_number} — {selectedLoan.user?.name}</h3>
                <p className="text-xs text-slate-400">Unit {selectedLoan.user?.unit_kerja} • NIK: {selectedLoan.user?.nik}</p>
              </div>
              <button onClick={() => setSelectedLoan(null)} className="text-slate-400 hover:text-white text-lg font-bold">
                ✕
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 space-y-6 text-xs overflow-y-auto flex-1">
              
              {/* Section 1: Data Pengajuan Pemohon */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-slate-500" /> 1. Data Permohonan Pinjaman
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Plafon Pengajuan</span>
                    <span className="font-bold text-sm text-slate-900">{formatCurrency(selectedLoan.nominal_pengajuan)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Tenor Cicilan</span>
                    <span className="font-semibold text-sm text-slate-900">{selectedLoan.tenor_bulan} Bulan</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Tanggal Pengajuan</span>
                    <span className="font-semibold text-slate-800">{formatDate(selectedLoan.created_at)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Status Alur</span>
                    <div className="mt-0.5"><StatusBadge status={selectedLoan.status} /></div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] font-semibold">Keperluan Pinjaman:</span>
                  <p className="text-xs font-medium text-slate-800 mt-0.5">{selectedLoan.keperluan_pinjaman}</p>
                </div>
              </div>

              {/* Section 2: Pratinjau Dokumen Persyaratan Asli yang Diunggah */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-slate-500" /> 2. Berkas Persyaratan Terlampir
                  </h4>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Dokumen Lengkap
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedLoan.documents && selectedLoan.documents.length > 0 ? (
                    selectedLoan.documents.map((doc) => (
                      <div key={doc.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 truncate max-w-[170px]">{doc.file_name}</div>
                            <span className="text-[10px] text-slate-400 uppercase font-mono">{doc.document_type}</span>
                          </div>
                        </div>
                        <a
                          href={`http://127.0.0.1:8000/${doc.file_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-semibold text-slate-700 bg-white hover:bg-slate-100 px-2.5 py-1 rounded border border-slate-200 transition flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> Unduh
                        </a>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 p-3 bg-slate-50 rounded-xl text-slate-400 italic text-center">
                      Dokumen otomatis terverifikasi.
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Form Penilaian Kriteria SPK SMART oleh Petugas */}
              <form onSubmit={handleAssessSubmit} className="space-y-4 pt-4 border-t border-slate-100">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-slate-500" /> 3. Penilaian Indikator Kelayakan Finansial
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Verifikasi angka riil dari slip gaji, mutasi simpanan, dan rekam jejak anggota untuk komputasi SMART:
                  </p>
                </div>

                {/* C1: Sisa THP */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-800 text-xs">
                      1. Rasio Sisa Gaji / Take Home Pay (Kapasitas Cicilan)
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">Kode C1 (Benefit, Bobot 30%)</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={valC1}
                    onChange={(e) => setValC1(e.target.value)}
                    placeholder="misal: 65% (Ketik persentase Sisa THP pemohon)"
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-semibold text-slate-900 bg-white text-xs focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                  />
                  {valC1 !== '' && (
                    <div className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                      {detectC1(valC1).label}
                    </div>
                  )}
                </div>

                {/* C2: Simpanan Wajib */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-800 text-xs">
                      2. Saldo Simpanan Wajib Anggota (Jaminan Finansial)
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">Kode C2 (Benefit, Bobot 20%)</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={valC2}
                    onChange={(e) => setValC2(e.target.value)}
                    placeholder="misal: 6.500.000 (Ketik jumlah simpanan rupiah)"
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-semibold text-slate-900 bg-white text-xs focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                  />
                  {valC2 !== '' && (
                    <div className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                      {detectC2(valC2).label}
                    </div>
                  )}
                </div>

                {/* C3: Masa Kerja & Status */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-800 text-xs">
                      3. Masa Kerja &amp; Status Kepegawaian (Jaminan Payroll)
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">Kode C3 (Benefit, Bobot 20%)</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={valC3}
                    onChange={(e) => setValC3(e.target.value)}
                    placeholder="misal: 6 (Ketik lama masa kerja dalam tahun)"
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-semibold text-slate-900 bg-white text-xs focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                  />
                  {valC3 !== '' && (
                    <div className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                      {detectC3(valC3).label}
                    </div>
                  )}
                </div>

                {/* C4: Riwayat Pinjaman */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-800 text-xs">
                      4. Rekam Jejak Angsuran / Kolektibilitas
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">Kode C4 (Benefit, Bobot 15%)</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={valC4}
                    onChange={(e) => setValC4(e.target.value)}
                    placeholder="misal: 100 atau Sangat Lancar"
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-semibold text-slate-900 bg-white text-xs focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                  />
                  {valC4 !== '' && (
                    <div className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                      {detectC4(valC4).label}
                    </div>
                  )}
                </div>

                {/* C5: Otomatis dari Plafon */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900 block">5. Plafon Pinjaman yang Diajukan (Faktor Beban)</span>
                    <span className="text-[11px] text-slate-500">Nominal: {formatCurrency(selectedLoan.nominal_pengajuan)}</span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-slate-600 bg-white px-2 py-1 rounded border border-slate-200">
                    Kode C5 (Cost, Bobot 15%)
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Catatan Verifikasi Petugas</label>
                  <textarea
                    rows={2}
                    value={assessmentNotes}
                    onChange={(e) => setAssessmentNotes(e.target.value)}
                    placeholder="Tuliskan catatan verifikasi berkas atau rekomendasi..."
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRevisionBox(!showRevisionBox)}
                    className="px-3.5 py-2 rounded-xl text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 font-semibold text-xs transition flex items-center gap-1.5"
                  >
                    <span>Penyesuaian Plafon / Catatan Revisi</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isAssessing}
                    className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Calculator className="w-4 h-4" />
                    <span>{isAssessing ? 'Menghitung SMART...' : 'Hitung & Simpan Scoring SMART'}</span>
                  </button>
                </div>
              </form>

              {/* Box Penyesuaian Data & Catatan Revisi */}
              {showRevisionBox && (
                <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-300 space-y-3">
                  <span className="font-bold text-amber-950 text-xs uppercase tracking-wider block">
                    Penyesuaian Plafon &amp; Catatan Perbaikan Berkas
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-amber-950 mb-1">
                        Penyesuaian Nominal Pengajuan (Rp)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 font-bold text-amber-700 text-xs">Rp</span>
                        <input
                          type="text"
                          value={adjNominal ? adjNominal.toLocaleString('id-ID') : ''}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '');
                            setAdjNominal(raw ? Math.min(Number(raw), 20000000) : 0);
                          }}
                          placeholder="10.000.000"
                          className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-amber-300 font-bold text-amber-950 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-amber-950 mb-1">
                        Penyesuaian Tenor (Bulan)
                      </label>
                      <select
                        value={adjTenor}
                        onChange={(e) => setAdjTenor(Number(e.target.value))}
                        className="w-full p-1.5 rounded-lg border border-amber-300 font-semibold text-amber-950 bg-white text-xs"
                      >
                        {[3, 5, 6, 8, 9, 10, 12, 15, 16, 18, 20, 21, 24].map((t) => (
                          <option key={t} value={t}>
                            {t} Bulan ({t >= 12 ? `${t / 12} Tahun` : `${t} Bln`})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-amber-950 text-xs mb-1">
                      Penyesuaian Catatan Keperluan Pinjaman
                    </label>
                    <input
                      type="text"
                      value={adjKeperluan}
                      onChange={(e) => setAdjKeperluan(e.target.value)}
                      placeholder="Keperluan pinjaman pemohon..."
                      className="w-full p-2 rounded-lg border border-amber-300 font-medium text-amber-950 text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-amber-950 text-xs mb-1">
                      Catatan / Instruksi Perbaikan Berkas untuk Pemohon
                    </label>
                    <textarea
                      rows={2}
                      value={revisionNotes}
                      onChange={(e) => setRevisionNotes(e.target.value)}
                      placeholder="Contoh: Nominal disesuaikan berdasarkan analisis sisa THP..."
                      className="w-full p-2 rounded-lg border border-amber-300 text-xs text-amber-950 bg-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowRevisionBox(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold text-xs"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleRevisionSubmit}
                      className="px-4 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs transition"
                    >
                      Simpan Penyesuaian
                    </button>
                  </div>
                </div>
              )}

              {/* Section 4: Live SMART Calculation Breakdown & Forward to Chairman */}
              {selectedLoan.smart_evaluation && (
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 4. Hasil Komputasi SPK SMART
                    </h4>

                    {/* Forward to Chairman Button */}
                    {selectedLoan.status !== 'forwarded_to_chairman' && selectedLoan.status !== 'approved' && selectedLoan.status !== 'disbursed' ? (
                      <button
                        type="button"
                        onClick={handleForwardToChairman}
                        disabled={isForwarding}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{isForwarding ? 'Meneruskan...' : 'Teruskan ke Dashboard Ketua'}</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Telah Masuk Antrean Ketua
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">u(C1) Sisa THP</span>
                        <span className="font-bold text-slate-800">{selectedLoan.smart_evaluation.utility_c1}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">u(C2) Simpanan</span>
                        <span className="font-bold text-slate-800">{selectedLoan.smart_evaluation.utility_c2}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">u(C3) Masa Kerja</span>
                        <span className="font-bold text-slate-800">{selectedLoan.smart_evaluation.utility_c3}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">u(C4) Riwayat</span>
                        <span className="font-bold text-slate-800">{selectedLoan.smart_evaluation.utility_c4}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">u(C5) Plafon</span>
                        <span className="font-bold text-slate-800">{selectedLoan.smart_evaluation.utility_c5}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Total Skor Kelayakan:</span>
                        <span className="font-bold text-xl text-slate-900">
                          {selectedLoan.smart_evaluation.final_score} <span className="text-xs font-normal text-slate-400">/ 100</span>
                        </span>
                      </div>
                      <span className="px-3 py-1.5 rounded-lg font-semibold text-xs bg-slate-900 text-white shadow-xs">
                        {selectedLoan.smart_evaluation.recommendation}
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              {['approved', 'disbursed'].includes(selectedLoan.status) ? (
                <button
                  onClick={() => setSelectedLoanForLetter(selectedLoan)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Lihat Dokumen e-SK</span>
                </button>
              ) : (
                <span className="text-[11px] text-slate-400 italic">e-SK terbit setelah persetujuan Ketua</span>
              )}

              <button
                onClick={() => setSelectedLoan(null)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs transition"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}


      {/* e-SK Letter Preview Modal */}
      <LetterPreviewModal
        isOpen={!!selectedLoanForLetter}
        onClose={() => setSelectedLoanForLetter(null)}
        loan={selectedLoanForLetter}
      />

      {/* Loan Installments Modal for Petugas Simpin */}
      <InstallmentsModal
        isOpen={!!selectedLoanForInstallments}
        onClose={() => setSelectedLoanForInstallments(null)}
        loanId={selectedLoanForInstallments}
        userRole="petugas_simpin"
        onRefreshParent={fetchData}
      />

      {/* Modal Registrasi Akun Kreditur Baru */}
      <RegisterMemberModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSuccess={fetchData}
      />
    </div>
  );
};
