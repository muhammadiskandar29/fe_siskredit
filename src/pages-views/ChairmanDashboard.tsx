'use client';

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
  const [metodePembayaran, setMetodePembayaran] = useState<'potong_gaji' | 'transfer_manual'>('potong_gaji');
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
    // Smart default: outsourcing defaults to manual payment, permanent/contract to payroll deduction
    const isOutsourcing = loan.status_pegawai?.toLowerCase().includes('outsourcing') || 
                          loan.user?.status_pegawai?.toLowerCase().includes('outsourcing');
    const defaultMethod = (loan.metode_pembayaran as any) || (isOutsourcing ? 'transfer_manual' : 'potong_gaji');
    setMetodePembayaran(defaultMethod);
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
        metode_pembayaran: metodePembayaran,
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
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-7 text-white shadow-sm border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-emerald-950 text-emerald-400 text-[11px] font-semibold px-2.5 py-0.5 rounded border border-emerald-800/80 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              Otorisasi Final &amp; Pencairan Dana
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Dashboard Approval &amp; Penyaluran Kredit
          </h2>
          <p className="text-slate-400 text-xs mt-1 max-w-2xl leading-relaxed">
            Tinjau evaluasi kelayakan SMART, tetapkan persetujuan resmi (e-SK dengan verifikasi QR Code), dan konfirmasi penyaluran dana ke rekening anggota.
          </p>
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

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('pending_approval')}
          className={`pb-3 transition flex items-center gap-2 border-b-2 ${
            activeTab === 'pending_approval' ? 'border-emerald-600 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Antrean Persetujuan ({pendingApprovals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('disbursement')}
          className={`pb-3 transition flex items-center gap-2 border-b-2 ${
            activeTab === 'disbursement' ? 'border-emerald-600 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4 text-slate-600" />
          <span>Penyaluran &amp; Pencairan Dana ({readyOrDisbursed.length})</span>
        </button>
      </div>

      {/* TAB 1: ANTREAN KEPUTUSAN APPROVAL */}
      {activeTab === 'pending_approval' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Daftar Rekomendasi Siap ACC</h3>
              <p className="text-[11px] text-slate-500">Hasil scoring metode SMART telah selesai diverifikasi oleh tim Simpan Pinjam.</p>
            </div>
            <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              {pendingApprovals.length} Berkas Menunggu
            </span>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-slate-400 text-xs">Memuat antrean...</div>
          ) : pendingApprovals.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">Semua Berkas Selesai Diproses</p>
              <p className="text-[11px] text-slate-400">Tidak ada pengajuan yang memerlukan persetujuan saat ini.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingApprovals.map((loan) => (
                <div
                  key={loan.id}
                  className="p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition bg-white"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    
                    {/* Left Column: Info */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-bold text-xs ${
                          loan.smart_evaluation?.rank === 1 ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-700'
                        }`}>
                          #{loan.smart_evaluation?.rank || '-'}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900">{loan.user?.name}</h4>
                            <StatusBadge status={loan.status} />
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Unit {loan.user?.unit_kerja} • Pegawai {loan.status_pegawai} ({loan.masa_kerja_tahun} Thn) • NIK: {loan.user?.nik}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                          <span className="text-slate-400 block text-[10px]">Plafon Pengajuan</span>
                          <span className="font-bold text-xs text-slate-900">{formatCurrency(loan.nominal_pengajuan)}</span>
                        </div>
                        <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                          <span className="text-slate-400 block text-[10px]">Tenor Cicilan</span>
                          <span className="font-semibold text-xs text-slate-900">{loan.tenor_bulan} Bulan</span>
                        </div>
                        <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                          <span className="text-slate-400 block text-[10px]">Sisa THP (Kapasitas)</span>
                          <span className="font-bold text-xs text-emerald-700">{loan.sisa_thp_persen}%</span>
                        </div>
                        <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                          <span className="text-slate-400 block text-[10px]">Simpanan Wajib</span>
                          <span className="font-semibold text-xs text-slate-800">{formatCurrency(loan.simpanan_wajib)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: SMART Score & Action */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:border-l lg:border-slate-200 lg:pl-5">
                      <div className="text-center sm:text-right bg-slate-50 p-3 rounded-xl border border-slate-200 min-w-[130px]">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase block">Credit Score</span>
                        <div className="font-bold text-xl text-slate-900">
                          {loan.smart_evaluation?.final_score || '0'} <span className="text-xs font-normal text-slate-400">/ 100</span>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-700 block mt-0.5">
                          {loan.smart_evaluation?.recommendation || 'Layak'}
                        </span>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleOpenDecisionModal(loan, 'approved')}
                          className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Setujui (ACC)</span>
                        </button>

                        <button
                          onClick={() => handleOpenDecisionModal(loan, 'rejected')}
                          className="px-4 py-2 rounded-lg bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 hover:border-rose-200 font-semibold text-xs transition flex items-center justify-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                          <span>Tolak</span>
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
                  className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 transition space-y-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                          {loan.application_number}
                        </span>
                        <StatusBadge status={loan.status} />
                        {loan.metode_pembayaran === 'transfer_manual' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            Mandiri (QRIS/Transfer)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Potong Gaji (Payroll)
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-base text-slate-900">
                        {loan.user?.name} — <span className="text-emerald-700 font-extrabold">{formatCurrency(loan.approved_nominal || loan.nominal_pengajuan)}</span>
                      </h4>

                      <p className="text-xs text-slate-600 font-medium flex items-center gap-2">
                        <span>Rekening Bank Muamalat:</span>
                        <span className="font-mono font-bold text-slate-900 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                          {loan.no_rekening_muamalat || loan.user?.no_rekening_muamalat || '-'}
                        </span>
                        <span>(a.n. {loan.nama_rekening || loan.user?.nama_rekening || loan.user?.name || '-'})</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* View Installments */}
                      {canViewLetter && (
                        <button
                          onClick={() => setSelectedLoanForInstallments(loan.id)}
                          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-300/80 shadow-xs transition flex items-center gap-1.5"
                          title="Lihat Status & Jadwal Angsuran"
                        >
                          <Calendar className="w-4 h-4 text-emerald-700" />
                          <span>Cek Angsuran</span>
                        </button>
                      )}

                      {/* View e-SK with QR Code */}
                      {canViewLetter ? (
                        <button
                          onClick={() => setSelectedLoanForLetter(loan)}
                          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm hover:shadow transition flex items-center gap-1.5"
                        >
                          <Download className="w-4 h-4 text-white" />
                          <span>Lihat e-SK Resmi</span>
                        </button>
                      ) : (
                        <button
                          disabled
                          title="e-SK belum terbit (Menunggu Approval)"
                          className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-400 font-medium text-xs cursor-not-allowed border border-slate-200 flex items-center gap-1.5"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>e-SK Belum Terbit</span>
                        </button>
                      )}

                      {/* Disburse Button with Strict Rule */}
                      {isDisbursed ? (
                        <span className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Dana Telah Dicairkan</span>
                        </span>
                      ) : canDisburse ? (
                        <button
                          onClick={() => handleOpenDisburseModal(loan)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm hover:shadow active:scale-[0.98] transition flex items-center gap-1.5"
                        >
                          <DollarSign className="w-4 h-4 text-emerald-100" />
                          <span>Konfirmasi Pencairan Dana</span>
                        </button>
                      ) : (
                        <button
                          disabled
                          title="Permohonan harus di-Approve terlebih dahulu sebelum dana dapat dicairkan!"
                          className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-400 font-medium text-xs cursor-not-allowed border border-slate-200 flex items-center gap-1.5"
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className={`p-6 text-white flex justify-between items-start ${
              decisionType === 'approved' 
                ? 'bg-gradient-to-r from-emerald-800 to-emerald-950 border-b border-emerald-700/40' 
                : 'bg-gradient-to-r from-rose-800 to-rose-950 border-b border-rose-700/40'
            }`}>
              <div>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block mb-1.5 ${
                  decisionType === 'approved' ? 'bg-emerald-700 text-emerald-100' : 'bg-rose-700 text-rose-100'
                }`}>
                  {decisionType === 'approved' ? 'Otorisasi Persetujuan' : 'Keputusan Penolakan'}
                </span>
                <h3 className="font-bold text-lg text-white">
                  {decisionType === 'approved' ? 'Persetujuan Otorisasi Kredit (Approval)' : 'Penolakan Permohonan Kredit'}
                </h3>
                <p className="text-xs text-white/80 mt-0.5 font-medium">
                  {selectedLoanForDecision.application_number} — {selectedLoanForDecision.user?.name}
                </p>
              </div>
              <button 
                onClick={() => setSelectedLoanForDecision(null)} 
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDecisionSubmit} className="p-6 space-y-4 text-xs">
              {decisionType === 'approved' ? (
                <>
                  <div className="bg-emerald-50/90 p-4 rounded-xl border border-emerald-200 text-emerald-900 font-medium space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-xs text-emerald-950">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Penerbitan Surat Keputusan (e-SK Resmi):
                    </p>
                    <p className="text-[11px] text-slate-700 leading-relaxed">
                      Persetujuan ini akan otomatis menerbitkan <strong>Surat Keputusan Persetujuan Pinjaman (e-SK)</strong> resmi dengan Barcode QR Code Digital Signature.
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">
                      Nominal Plafon Disetujui (Rp)
                    </label>
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
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-emerald-950 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 mt-1 block">
                      Terbilang: {formatCurrency(approvedNominal)}
                    </span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">Tenor Disetujui</label>
                    <select
                      value={approvedTenor}
                      onChange={(e) => setApprovedTenor(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    >
                      <option value={6}>6 Bulan</option>
                      <option value={10}>10 Bulan</option>
                      <option value={12}>12 Bulan (1 Tahun)</option>
                      <option value={18}>18 Bulan</option>
                      <option value={24}>24 Bulan (2 Tahun)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">
                      Skema Pelunasan &amp; Pembayaran Angsuran
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div 
                        onClick={() => setMetodePembayaran('potong_gaji')}
                        className={`cursor-pointer p-3 rounded-xl border-2 transition ${
                          metodePembayaran === 'potong_gaji' 
                            ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 shadow-xs' 
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs flex items-center gap-1.5">
                            <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                              metodePembayaran === 'potong_gaji' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                            }`}>
                              {metodePembayaran === 'potong_gaji' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                            </span>
                            Potong Gaji Otomatis
                          </span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">Payroll Yayasan</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug pl-5">
                          Untuk Guru &amp; Pegawai Tetap/Kontrak. Otomatis dipotong tgl 25 via rekap keuangan yayasan.
                        </p>
                      </div>

                      <div 
                        onClick={() => setMetodePembayaran('transfer_manual')}
                        className={`cursor-pointer p-3 rounded-xl border-2 transition ${
                          metodePembayaran === 'transfer_manual' 
                            ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 shadow-xs' 
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs flex items-center gap-1.5">
                            <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                              metodePembayaran === 'transfer_manual' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                            }`}>
                              {metodePembayaran === 'transfer_manual' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                            </span>
                            Pembayaran Mandiri
                          </span>
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">QRIS Dinamis</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug pl-5">
                          Untuk Tenaga Outsourcing/Mitra. Bayar via Scan QRIS Dinamis (+ 3 digit kode unik) atau transfer.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 text-rose-900 font-medium text-xs leading-relaxed">
                  Permohonan akan berstatus <strong>Ditolak</strong> dan catatan penolakan akan dicatat ke pemohon serta tercatat pada audit trail koperasi.
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Catatan {decisionType === 'approved' ? 'Persetujuan / Otorisasi' : 'Alasan Penolakan'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={decisionType === 'approved' ? 'Catatan otorisasi untuk staf simpan pinjam dan anggota...' : 'Tuliskan alasan penolakan secara jelas...'}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedLoanForDecision(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-1.5 ${
                    decisionType === 'approved' 
                      ? 'bg-emerald-600 hover:bg-emerald-700' 
                      : 'bg-rose-600 hover:bg-rose-700'
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 p-6 text-white flex justify-between items-start border-b border-emerald-700/40">
              <div>
                <span className="bg-emerald-700 text-emerald-100 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block mb-1.5">
                  Pencairan Dana
                </span>
                <h3 className="font-bold text-lg text-white">Konfirmasi Penyaluran Uang</h3>
                <p className="text-xs text-emerald-200/90 font-medium">
                  {selectedLoanForDisburse.application_number} — {selectedLoanForDisburse.user?.name}
                </p>
              </div>
              <button 
                onClick={() => setSelectedLoanForDisburse(null)} 
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDisburseSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-emerald-50/90 rounded-xl border border-emerald-200/80 space-y-1.5">
                <span className="text-emerald-900 font-bold text-xs flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-emerald-700" />
                  Rekening Tujuan (Bank Muamalat):
                </span>
                <div className="font-mono font-bold text-base text-emerald-950 tracking-wide">
                  {selectedLoanForDisburse.no_rekening_muamalat || selectedLoanForDisburse.user?.no_rekening_muamalat || '3910000280'}
                </div>
                <div className="text-slate-700 font-semibold text-xs">
                  a.n. {selectedLoanForDisburse.nama_rekening || selectedLoanForDisburse.user?.nama_rekening || selectedLoanForDisburse.user?.name || 'Achmad Sobari'}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Nomor Referensi Transfer / Resi
                </label>
                <input
                  type="text"
                  required
                  value={disburseRef}
                  onChange={(e) => setDisburseRef(e.target.value)}
                  placeholder="Contoh: MUA-TRF-20261109-001"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Nominal yang Dicairkan (Rp)
                </label>
                <input
                  type="number"
                  required
                  value={disburseAmount}
                  onChange={(e) => setDisburseAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-emerald-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Catatan Pencairan
                </label>
                <textarea
                  rows={2}
                  value={disburseNotes}
                  onChange={(e) => setDisburseNotes(e.target.value)}
                  placeholder="Catatan transfer ke rekening Bank Muamalat anggota..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedLoanForDisburse(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <DollarSign className="w-4 h-4 text-emerald-100" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Konfirmasi & Cairkan Dana'}</span>
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
