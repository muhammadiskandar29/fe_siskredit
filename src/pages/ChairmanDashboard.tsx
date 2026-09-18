import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { LoanApplication } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { LetterPreviewModal } from '../components/LetterPreviewModal';
import { InstallmentsModal } from '../components/InstallmentsModal';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  Clock, 
  Building,
  FileCheck,
  Send,
  Eye,
  Download,
  AlertCircle,
  Lock,
  Calendar
} from 'lucide-react';

export const ChairmanDashboard: React.FC = () => {
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending_approval' | 'disbursement'>('pending_approval');
  const [selectedLoanForLetter, setSelectedLoanForLetter] = useState<LoanApplication | null>(null);
  const [selectedLoanForInstallments, setSelectedLoanForInstallments] = useState<number | null>(null);

  // Decision Modal State (Approve / Reject)
  const [selectedLoanForDecision, setSelectedLoanForDecision] = useState<LoanApplication | null>(null);
  const [decisionType, setDecisionType] = useState<'approved' | 'rejected'>('approved');
  const [approvedNominal, setApprovedNominal] = useState<number>(0);
  const [approvedTenor, setApprovedTenor] = useState<number>(12);
  const [notes, setNotes] = useState<string>('');

  // Disbursement Modal State (Pencairan Dana)
  const [selectedLoanForDisburse, setSelectedLoanForDisburse] = useState<LoanApplication | null>(null);
  const [disburseRef, setDisburseRef] = useState<string>('');
  const [disburseAmount, setDisburseAmount] = useState<number>(0);
  const [disburseNotes, setDisburseNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchLoans = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/approvals/pending');
      if (res.data.success) {
        setLoans(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  useEffect(() => {
    const handleNotifNav = (e: any) => {
      const targetUrl = e.detail?.targetUrl;
      if (!targetUrl) return;

      const match = targetUrl.match(/\/loans\/(\d+)/);
      const loanId = match ? Number(match[1]) : null;

      if (targetUrl.includes('modal=installments') && loanId) {
        setSelectedLoanForInstallments(loanId);
      } else if (targetUrl.includes('modal=disburse') && loanId) {
        const found = loans.find((l) => l.id === loanId);
        if (found) setSelectedLoanForDisburse(found);
      } else if (loanId) {
        const found = loans.find((l) => l.id === loanId);
        if (found) {
          if (targetUrl.includes('modal=letter')) {
            setSelectedLoanForLetter(found);
          } else {
            handleOpenDecisionModal(found, 'approved');
          }
        }
      }
    };

    window.addEventListener('NOTIF_NAVIGATE', handleNotifNav);
    return () => window.removeEventListener('NOTIF_NAVIGATE', handleNotifNav);
  }, [loans]);

  const handleOpenDecisionModal = (loan: LoanApplication, type: 'approved' | 'rejected') => {
    setSelectedLoanForDecision(loan);
    setDecisionType(type);
    setApprovedNominal(loan.nominal_pengajuan);
    setApprovedTenor(loan.tenor_bulan);
    setNotes(type === 'approved' ? 'Permohonan pinjaman disetujui resmi oleh Ketua Koperasi Al-Azhar BSD.' : '');
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanForDecision) return;

    setIsSubmitting(true);
    try {
      const res = await api.post(`/approvals/${selectedLoanForDecision.id}/decide`, {
        decision: decisionType,
        approved_nominal: approvedNominal,
        approved_tenor: approvedTenor,
        approval_notes: notes,
      });

      if (res.data.success) {
        setActionMsg({ type: 'success', text: res.data.message });
        const updatedLoan = res.data.data;
        setSelectedLoanForDecision(null);
        fetchLoans();

        if (decisionType === 'approved') {
          setSelectedLoanForLetter(updatedLoan);
        }
      }
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.response?.data?.message || 'Gagal memproses approval' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDisburseModal = (loan: LoanApplication) => {
    if (loan.status !== 'approved') return; // Strict check
    setSelectedLoanForDisburse(loan);
    setDisburseRef(`MUA-TRF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(loan.id).padStart(3, '0')}`);
    setDisburseAmount(loan.approved_nominal || loan.nominal_pengajuan);
    setDisburseNotes('Pencairan dana via transfer rekening Bank Muamalat.');
  };

  const handleDisburseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanForDisburse) return;

    setIsSubmitting(true);
    try {
      const res = await api.post(`/approvals/${selectedLoanForDisburse.id}/disburse`, {
        disbursement_ref_number: disburseRef,
        disbursed_amount: disburseAmount,
        disbursement_notes: disburseNotes,
      });

      if (res.data.success) {
        setActionMsg({ type: 'success', text: res.data.message });
        setSelectedLoanForDisburse(null);
        fetchLoans();
      }
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.response?.data?.message || 'Gagal mencatat pencairan dana' });
    } finally {
      setIsSubmitting(false);
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

  const pendingApprovals = loans.filter(l => ['forwarded_to_chairman', 'smart_calculated', 'verified'].includes(l.status));
  const readyOrDisbursed = loans.filter(l => ['approved', 'disbursed', 'forwarded_to_chairman', 'smart_calculated'].includes(l.status));

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 w-96 h-96 rounded-full bg-emerald-600/10 blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-gold-500/20 text-gold-300 text-xs font-extrabold px-3 py-1 rounded-full border border-gold-400/30 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-gold-400" />
              Otorisasi Final &amp; Pencairan Dana
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            Dashboard Approval &amp; Penyaluran Dana Kredit
          </h2>
          <p className="text-slate-400 text-xs mt-1 max-w-2xl">
            Review antrean rekomendasi SMART, berikan persetujuan digital resmi (e-SK dengan Barcode), dan konfirmasi pelepasan uang ke rekening anggota.
          </p>
        </div>
      </div>

      {/* Message Alert */}
      {actionMsg && (
        <div className={`p-4 rounded-2xl border text-sm font-semibold flex items-center gap-3 ${
          actionMsg.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-rose-50 border-rose-300 text-rose-800'
        }`}>
          {actionMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-rose-600" />}
          {actionMsg.text}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('pending_approval')}
          className={`pb-3 transition flex items-center gap-2 border-b-2 ${
            activeTab === 'pending_approval' ? 'border-kopkar-800 text-kopkar-800' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Antrean Keputusan ACC ({pendingApprovals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('disbursement')}
          className={`pb-3 transition flex items-center gap-2 border-b-2 ${
            activeTab === 'disbursement' ? 'border-kopkar-800 text-kopkar-800' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <span>Penyaluran &amp; Pencairan Dana ({readyOrDisbursed.length})</span>
        </button>
      </div>

      {/* TAB 1: ANTREAN KEPUTUSAN APPROVAL */}
      {activeTab === 'pending_approval' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 text-lg">Antrean Keputusan Terurut Prioritas SMART</h3>
              <p className="text-xs text-slate-500">Pilih aksi setujui untuk menerbitkan e-SK otomatis atau tolak permohonan</p>
            </div>
            <span className="text-xs font-bold text-kopkar-800 bg-kopkar-50 px-3 py-1 rounded-full border border-kopkar-200">
              {pendingApprovals.length} Permohonan Siap ACC
            </span>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-slate-400 text-xs">Memuat antrean keputusan...</div>
          ) : pendingApprovals.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Semua Antrean Telah Diproses</p>
              <p className="text-xs text-slate-500">Tidak ada pengajuan yang menunggu persetujuan Ketua saat ini.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingApprovals.map((loan) => (
                <div
                  key={loan.id}
                  className="p-6 rounded-2xl border border-slate-200 hover:border-kopkar-400 hover:shadow-lg transition bg-white"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    
                    {/* Left Column: Info */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-full inline-flex items-center justify-center font-black text-xs ${
                          loan.smart_evaluation?.rank === 1 ? 'bg-amber-400 text-slate-900 shadow-md' : 'bg-slate-100 text-slate-700'
                        }`}>
                          #{loan.smart_evaluation?.rank || '-'}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-base text-slate-900">{loan.user?.name}</h4>
                            <StatusBadge status={loan.status} />
                          </div>
                          <span className="text-xs text-slate-500 font-medium">
                            NIK: {loan.user?.nik} | Unit {loan.user?.unit_kerja} | {loan.status_pegawai} ({loan.masa_kerja_tahun} Thn)
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                          <span className="text-slate-400 block text-[10px]">Plafon Diajukan</span>
                          <span className="font-extrabold text-sm text-slate-900">{formatCurrency(loan.nominal_pengajuan)}</span>
                        </div>
                        <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                          <span className="text-slate-400 block text-[10px]">Tenor</span>
                          <span className="font-bold text-sm text-slate-900">{loan.tenor_bulan} Bulan</span>
                        </div>
                        <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                          <span className="text-slate-400 block text-[10px]">Sisa THP (C1)</span>
                          <span className="font-bold text-sm text-emerald-800">{loan.sisa_thp_persen}%</span>
                        </div>
                        <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                          <span className="text-slate-400 block text-[10px]">Simpanan Wajib (C2)</span>
                          <span className="font-bold text-sm text-slate-800">{formatCurrency(loan.simpanan_wajib)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: SMART Score & Action */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:border-l lg:border-slate-200 lg:pl-6">
                      <div className="text-center sm:text-right bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase block">Skor SPK SMART</span>
                        <span className="font-black text-2xl text-emerald-900">
                          {loan.smart_evaluation?.final_score || '0'}
                        </span>
                        <span className="text-[10px] font-extrabold text-emerald-700 block mt-0.5">
                          {loan.smart_evaluation?.recommendation || 'Layak'}
                        </span>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleOpenDecisionModal(loan, 'approved')}
                          className="px-5 py-2.5 rounded-xl bg-kopkar-800 hover:bg-kopkar-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Setujui (Approve)</span>
                        </button>

                        <button
                          onClick={() => handleOpenDecisionModal(loan, 'rejected')}
                          className="px-5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition flex items-center justify-center gap-1.5"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Tolak (Reject)</span>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PENYALURAN & PENCAIRAN DANA */}
      {activeTab === 'disbursement' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
          <div>
            <h3 className="font-black text-slate-900 text-lg">Penyaluran Dana Kredit ke Rekening Anggota</h3>
            <p className="text-xs text-slate-500">Konfirmasi pencairan dana pinjaman via transfer Bank Muamalat (Tombol hanya aktif jika sudah disetujui)</p>
          </div>

          <div className="space-y-4">
            {readyOrDisbursed.map((loan) => {
              const isApproved = loan.status === 'approved';
              const isDisbursed = loan.status === 'disbursed';
              const canDisburse = isApproved;
              const canViewLetter = isApproved || isDisbursed;

              return (
                <div
                  key={loan.id}
                  className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-kopkar-300 transition space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-kopkar-800 bg-kopkar-50 px-2 py-0.5 rounded">
                          {loan.application_number}
                        </span>
                        <StatusBadge status={loan.status} />
                      </div>

                      <h4 className="font-extrabold text-base text-slate-900">
                        {loan.user?.name} — <span className="text-emerald-900 font-black">{formatCurrency(loan.approved_nominal || loan.nominal_pengajuan)}</span>
                      </h4>

                      <p className="text-xs text-slate-500 font-medium">
                        Rekening: <span className="font-mono font-bold text-slate-800">{loan.no_rekening_muamalat}</span> (a.n. {loan.nama_rekening})
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* View Installments Read-Only */}
                      {canViewLetter && (
                        <button
                          onClick={() => setSelectedLoanForInstallments(loan.id)}
                          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                          title="Lihat Status &amp; Jadwal Angsuran"
                        >
                          <Calendar className="w-4 h-4 text-yellow-300" />
                          <span>Cek Angsuran</span>
                        </button>
                      )}

                      {/* View e-SK with QR Code */}
                      {canViewLetter ? (
                        <button
                          onClick={() => setSelectedLoanForLetter(loan)}
                          className="px-4 py-2 rounded-xl bg-kopkar-800 hover:bg-kopkar-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                        >
                          <Download className="w-4 h-4 text-gold-300" />
                          <span>Lihat e-SK Resmi</span>
                        </button>
                      ) : (
                        <button
                          disabled
                          title="e-SK belum terbit (Menunggu Approval)"
                          className="px-4 py-2 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs cursor-not-allowed border border-slate-200 flex items-center gap-1.5"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>e-SK Belum Terbit</span>
                        </button>
                      )}

                      {/* Disburse Button with Strict Rule */}
                      {isDisbursed ? (
                        <span className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 font-extrabold text-xs border border-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Dana Telah Dicairkan</span>
                        </span>
                      ) : canDisburse ? (
                        <button
                          onClick={() => handleOpenDisburseModal(loan)}
                          className="px-5 py-2 rounded-xl kopkar-gradient text-white font-extrabold text-xs shadow-md hover:opacity-95 transition flex items-center gap-1.5"
                        >
                          <DollarSign className="w-4 h-4 text-gold-300" />
                          <span>Konfirmasi Pencairan Dana</span>
                        </button>
                      ) : (
                        <button
                          disabled
                          title="Permohonan harus di-Approve terlebih dahulu sebelum dana dapat dicairkan!"
                          className="px-4 py-2 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs cursor-not-allowed border border-slate-200 flex items-center gap-1.5"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Menunggu Approval Ketua</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Disbursement Confirmation Details if Disbursed */}
                  {isDisbursed && (
                    <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="text-emerald-800 font-bold block">✓ Dana Berhasil Disalurkan:</span>
                        <span className="font-mono text-slate-700">No. Ref Transfer: <strong>{loan.disbursement_ref_number}</strong></span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Tanggal Pencairan:</span>
                        <span className="font-bold text-slate-800">{formatDate(loan.disbursed_at)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Nominal Dicairkan:</span>
                        <span className="font-black text-sm text-emerald-900">{formatCurrency(loan.disbursed_amount)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 1: APPROVAL / REJECTION DECISION */}
      {/* ========================================== */}
      {selectedLoanForDecision && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className={`p-6 text-white flex justify-between items-center ${
              decisionType === 'approved' ? 'kopkar-gradient' : 'bg-gradient-to-r from-rose-800 to-rose-950'
            }`}>
              <div>
                <h3 className="font-extrabold text-lg">
                  {decisionType === 'approved' ? 'Persetujuan Otorisasi Kredit (Approval)' : 'Penolakan Permohonan Kredit'}
                </h3>
                <p className="text-xs text-white/80">{selectedLoanForDecision.application_number} - {selectedLoanForDecision.user?.name}</p>
              </div>
              <button onClick={() => setSelectedLoanForDecision(null)} className="text-white/80 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleDecisionSubmit} className="p-6 space-y-4 text-xs">
              {decisionType === 'approved' ? (
                <>
                  <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 text-emerald-900 font-medium">
                    Persetujuan ini akan otomatis menerbitkan <strong>Surat Keputusan Persetujuan Pinjaman (e-SK)</strong> resmi dengan Barcode QR Code Digital Signature.
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Nominal Plafon Disetujui (Rp)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 font-bold text-slate-400 text-sm">Rp</span>
                      <input
                        type="text"
                        required
                        value={approvedNominal ? approvedNominal.toLocaleString('id-ID') : ''}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '');
                          const val = raw ? Math.min(Number(raw), 20000000) : 0;
                          setApprovedNominal(val);
                        }}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm font-black text-emerald-950 bg-slate-50/50 focus:bg-white"
                      />
                    </div>
                    <span className="text-[10px] font-extrabold text-emerald-700 mt-1 block">
                      Terbilang: {formatCurrency(approvedNominal)}
                    </span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Tenor Disetujui</label>
                    <select
                      value={approvedTenor}
                      onChange={(e) => setApprovedTenor(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800"
                    >
                      <option value={6}>6 Bulan</option>
                      <option value={10}>10 Bulan</option>
                      <option value={12}>12 Bulan (1 Tahun)</option>
                      <option value={18}>18 Bulan</option>
                      <option value={24}>24 Bulan (2 Tahun)</option>
                    </select>
                  </div>
                </>
              ) : (
                <div className="bg-rose-50 p-3.5 rounded-2xl border border-rose-200 text-rose-900 font-medium">
                  Permohonan akan berstatus <strong>Ditolak</strong> dan alasan penolakan akan dicatat ke pemohon.
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Catatan {decisionType === 'approved' ? 'Persetujuan' : 'Alasan Penolakan'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={decisionType === 'approved' ? 'Catatan otorisasi...' : 'Tuliskan alasan penolakan...'}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedLoanForDecision(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-2.5 rounded-xl text-white font-extrabold shadow-md transition disabled:opacity-50 ${
                    decisionType === 'approved' ? 'kopkar-gradient hover:opacity-95' : 'bg-rose-700 hover:bg-rose-800'
                  }`}
                >
                  {isSubmitting ? 'Memproses...' : decisionType === 'approved' ? 'Eksekusi Approval & Terbitkan e-SK' : 'Konfirmasi Penolakan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2: DISBURSEMENT / RELEASE DANA */}
      {/* ========================================== */}
      {selectedLoanForDisburse && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="kopkar-gradient p-6 text-white flex justify-between items-center">
              <div>
                <span className="bg-gold-500 text-slate-900 font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
                  Pencairan Dana
                </span>
                <h3 className="font-extrabold text-lg mt-1">Konfirmasi Penyaluran Uang</h3>
                <p className="text-xs text-emerald-200">{selectedLoanForDisburse.application_number} - {selectedLoanForDisburse.user?.name}</p>
              </div>
              <button onClick={() => setSelectedLoanForDisburse(null)} className="text-white/80 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleDisburseSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1">
                <span className="text-emerald-800 font-bold block">Rekening Tujuan (Bank Muamalat):</span>
                <div className="font-mono font-bold text-sm text-slate-900">{selectedLoanForDisburse.no_rekening_muamalat}</div>
                <div className="text-slate-600 font-semibold">a.n. {selectedLoanForDisburse.nama_rekening}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Nomor Referensi Transfer / Resi</label>
                <input
                  type="text"
                  required
                  value={disburseRef}
                  onChange={(e) => setDisburseRef(e.target.value)}
                  placeholder="Contoh: MUA-TRF-20260828001"
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Nominal yang Dicairkan (Rp)</label>
                <input
                  type="number"
                  required
                  value={disburseAmount}
                  onChange={(e) => setDisburseAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-emerald-900 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Catatan Pencairan</label>
                <textarea
                  rows={2}
                  value={disburseNotes}
                  onChange={(e) => setDisburseNotes(e.target.value)}
                  placeholder="Catatan transfer ke rekening anggota..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedLoanForDisburse(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl kopkar-gradient text-white font-extrabold shadow-md hover:opacity-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Konfirmasi Pencairan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* e-SK Letter Preview Modal */}
      <LetterPreviewModal
        isOpen={!!selectedLoanForLetter}
        onClose={() => setSelectedLoanForLetter(null)}
        loan={selectedLoanForLetter}
      />

      {/* Loan Installments Modal for Chairman (Read-Only) */}
      <InstallmentsModal
        isOpen={!!selectedLoanForInstallments}
        onClose={() => setSelectedLoanForInstallments(null)}
        loanId={selectedLoanForInstallments}
        userRole="ketua_koperasi"
      />
    </div>
  );
};
