'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  UploadCloud, 
  FileText, 
  X, 
  DollarSign, 
  AlertCircle, 
  Eye, 
  ShieldCheck,
  Building,
  Check
} from 'lucide-react';

export interface InstallmentData {
  id: number;
  loan_application_id: number;
  installment_number: number;
  due_date: string;
  amount: number;
  status: 'belum_lunas' | 'menunggu_konfirmasi' | 'lunas';
  payment_proof_path?: string;
  paid_at?: string;
  confirmed_at?: string;
  confirmator?: { name: string };
  notes?: string;
}

interface InstallmentResponse {
  loan_id: number;
  application_number: string;
  applicant_name: string;
  nominal: number;
  tenor: number;
  monthly_amount: number;
  total_interest: number;
  total_repayment: number;
  installments: InstallmentData[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  loanId: number | null;
  userRole?: 'anggota' | 'petugas_simpin' | 'ketua_koperasi' | 'admin';
  onRefreshParent?: () => void;
}

export const InstallmentsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  loanId,
  userRole = 'anggota',
  onRefreshParent,
}) => {
  const [data, setData] = useState<InstallmentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'schedule' | 'pay'>('schedule');

  // Selected installment for payment upload or view proof
  const [selectedInstallment, setSelectedInstallment] = useState<InstallmentData | null>(null);
  const [proofFile, setProofFile] = useState<{ name: string; base64: string }>({ name: '', base64: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && loanId) {
      fetchInstallments();
      setMsg(null);
      setPreviewProofUrl(null);
      setSelectedInstallment(null);
    }
  }, [isOpen, loanId]);

  const fetchInstallments = async () => {
    if (!loanId) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/loans/${loanId}/installments`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching installments:', err);
    } finally {
      setIsLoading(false);
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
      month: 'long',
      year: 'numeric',
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofFile({
          name: file.name,
          base64: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstallment || !proofFile.base64) {
      setMsg({ type: 'error', text: 'Pilih file bukti transfer terlebih dahulu.' });
      return;
    }

    setIsSubmitting(true);
    setMsg(null);
    try {
      const res = await api.post(`/installments/${selectedInstallment.id}/pay`, {
        payment_proof: proofFile.base64,
      });

      if (res.data.success) {
        setMsg({ type: 'success', text: res.data.message });
        setSelectedInstallment(null);
        setProofFile({ name: '', base64: '' });
        fetchInstallments();
        if (onRefreshParent) onRefreshParent();
      }
    } catch (err: any) {
      setMsg({
        type: 'error',
        text: err.response?.data?.message || 'Gagal mengunggah bukti pembayaran.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmInstallment = async (installmentId: number) => {
    setIsSubmitting(true);
    setMsg(null);
    try {
      const res = await api.post(`/installments/${installmentId}/confirm`, {
        notes: 'Dikonfirmasi LUNAS oleh Petugas Simpin.',
      });

      if (res.data.success) {
        setMsg({ type: 'success', text: res.data.message });
        fetchInstallments();
        if (onRefreshParent) onRefreshParent();
      }
    } catch (err: any) {
      setMsg({
        type: 'error',
        text: err.response?.data?.message || 'Gagal mengonfirmasi pelunasan.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !loanId) return null;

  const totalLunasCount = data?.installments.filter(i => i.status === 'lunas').length || 0;
  const isFullyPaid = data ? totalLunasCount === data.installments.length : false;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-extrabold shadow-md">
              <Calendar className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-500/30 text-emerald-300 rounded border border-emerald-500/30">
                  {data?.application_number || 'Tagihan Kredit'}
                </span>
                {isFullyPaid && (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                    ✓ LUNAS KESELURUHAN
                  </span>
                )}
              </div>
              <h3 className="font-black text-base text-white mt-0.5">
                Jadwal &amp; Tagihan Angsuran Kredit
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">

          {msg && (
            <div className={`p-3.5 rounded-2xl border font-bold flex items-center justify-between gap-3 ${
              msg.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}>
              <div className="flex items-center gap-2">
                {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                <span>{msg.text}</span>
              </div>
              <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-16 text-slate-500">
              <Clock className="w-8 h-8 mx-auto animate-spin mb-2 text-emerald-600" />
              <p className="font-bold text-xs">Memuat data jadwal angsuran...</p>
            </div>
          ) : data ? (
            <>
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Plafon Kredit</span>
                  <span className="font-black text-slate-900 text-sm">{formatCurrency(data.nominal)}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Tenor Cicilan</span>
                  <span className="font-black text-slate-900 text-sm">{data.tenor} Bulan</span>
                </div>
                <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
                  <span className="text-emerald-700 block text-[10px] uppercase font-bold">Angsuran / Bulan</span>
                  <span className="font-black text-emerald-900 text-sm">{formatCurrency(data.monthly_amount)}</span>
                </div>
                <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
                  <span className="text-emerald-700 block text-[10px] uppercase font-bold">Progress Pelunasan</span>
                  <span className="font-black text-emerald-900 text-sm">{totalLunasCount} / {data.tenor} Bulan</span>
                </div>
              </div>

              {/* Form Upload Bukti Bayar (Anggota Mode when selected) */}
              {selectedInstallment && userRole === 'anggota' && (
                <div className="p-4 rounded-2xl bg-amber-50/80 border-2 border-amber-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-amber-900 text-xs flex items-center gap-1.5">
                      <UploadCloud className="w-4 h-4 text-amber-700" />
                      Upload Bukti Bayar Angsuran ke-{selectedInstallment.installment_number} ({formatCurrency(selectedInstallment.amount)})
                    </span>
                    <button onClick={() => setSelectedInstallment(null)} className="text-xs text-amber-700 font-bold hover:underline">
                      Batal
                    </button>
                  </div>

                  <form onSubmit={handleUploadPayment} className="space-y-3">
                    <div className="p-3 bg-white rounded-xl border border-amber-200 flex items-center justify-between">
                      <div className="truncate pr-2">
                        <span className="text-slate-500 font-medium block">File Struk / Resi Transfer:</span>
                        <span className="font-mono font-bold text-slate-800 text-[11px] truncate block">
                          {proofFile.name || 'Belum memilih file'}
                        </span>
                      </div>
                      <label className="cursor-pointer px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shrink-0 shadow-sm transition">
                        Pilih File Gambar/PDF
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*,.pdf"
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !proofFile.base64}
                      className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? 'Mengunggah...' : 'Kirim Bukti Transfer ke Petugas Simpin'}
                    </button>
                  </form>
                </div>
              )}

              {/* Installments Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">
                    Daftar {data.tenor} Bulan Tagihan:
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Bunga Flat 1%/bulan terhitung otomatis
                  </span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">
                        <th className="p-3">Bulan ke-</th>
                        <th className="p-3">Jatuh Tempo</th>
                        <th className="p-3">Nominal Tagihan</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-right">Aksi &amp; Bukti</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {data.installments.map((inst) => (
                        <tr key={inst.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3 font-bold text-slate-900">
                            Ke-{inst.installment_number}
                          </td>
                          <td className="p-3 text-slate-700 font-mono">
                            {formatDate(inst.due_date)}
                          </td>
                          <td className="p-3 font-bold text-slate-900 font-mono">
                            {formatCurrency(inst.amount)}
                          </td>
                          <td className="p-3 text-center">
                            {inst.status === 'lunas' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                                <Check className="w-3 h-3 text-emerald-600" /> LUNAS
                              </span>
                            ) : inst.status === 'menunggu_konfirmasi' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[10px] animate-pulse">
                                <Clock className="w-3 h-3 text-amber-600" /> Menunggu Konfirmasi
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
                                Belum Lunas
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right space-x-1.5">
                            {/* View Proof Button */}
                            {inst.payment_proof_path && (
                              <a
                                href={`http://127.0.0.1:8000/${inst.payment_proof_path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition"
                              >
                                <Eye className="w-3 h-3 text-slate-500" /> Bukti
                              </a>
                            )}

                            {/* Anggota Pay Button */}
                            {userRole === 'anggota' && inst.status !== 'lunas' && (
                              <button
                                onClick={() => {
                                  setSelectedInstallment(inst);
                                  setMsg(null);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] shadow-xs transition"
                              >
                                <UploadCloud className="w-3 h-3 text-white" />
                                {inst.status === 'menunggu_konfirmasi' ? 'Ganti Bukti' : 'Bayar'}
                              </button>
                            )}

                            {/* Petugas Simpin Confirm Button */}
                            {(userRole === 'petugas_simpin' || userRole === 'admin') && inst.status === 'menunggu_konfirmasi' && (
                              <button
                                onClick={() => handleConfirmInstallment(inst.id)}
                                disabled={isSubmitting}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-[10px] shadow-xs transition disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-3 h-3 text-yellow-300" /> Konfirmasi Lunas
                              </button>
                            )}

                            {/* Ketua Koperasi View Only */}
                            {userRole === 'ketua_koperasi' && (
                              <span className="text-[10px] text-slate-400 italic">
                                Read-Only
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}

        </div>
      </div>
    </div>
  );
};
