'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { generateDynamicQRIS } from '../lib/qrisGenerator';
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
  Check,
  Copy,
  QrCode,
  CreditCard
} from 'lucide-react';

export interface InstallmentData {
  id: number;
  loan_application_id: number;
  installment_number: number;
  due_date: string;
  amount: number;
  kode_unik?: number;
  total_with_code?: number;
  metode_bayar?: string;
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
  metode_pembayaran?: string;
  status_pegawai?: string;
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
  const [dynamicQris, setDynamicQris] = useState<{ rawString: string; totalBayar: number; qrImageUrl: string } | null>(null);
  const [proofFile, setProofFile] = useState<{ name: string; base64: string }>({ name: '', base64: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && loanId) {
      fetchInstallments();
      setMsg(null);
      setSelectedInstallment(null);
      setDynamicQris(null);
    }
  }, [isOpen, loanId]);

  useEffect(() => {
    if (selectedInstallment && data) {
      const qris = generateDynamicQRIS({
        nominal: selectedInstallment.amount,
        kodeUnik: selectedInstallment.kode_unik || 0,
        invoiceNumber: `${data.application_number}-B${selectedInstallment.installment_number}`,
        merchantName: 'KOPKAR AL-AZHAR BSD',
      });
      setDynamicQris(qris);
    } else {
      setDynamicQris(null);
    }
  }, [selectedInstallment, data]);

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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
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
  const isPayroll = data?.metode_pembayaran === 'potong_gaji';

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
                {isPayroll ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-500/20 text-teal-300 rounded border border-teal-500/30">
                    Potong Gaji (Payroll)
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                    Pembayaran Mandiri (QRIS Dinamis)
                  </span>
                )}
                {isFullyPaid && (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
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
              {/* Context Banner: Payroll vs Manual */}
              {isPayroll ? (
                <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3.5">
                  <div className="p-2.5 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5 shadow-sm">
                    <Building className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-emerald-950 text-sm">
                        Skema Pelunasan: Potong Gaji Otomatis (Payroll Yayasan Al-Azhar)
                      </span>
                      <span className="bg-emerald-200/70 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Setiap Tanggal 25
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Cicilan bulanan sebesar <strong>{formatCurrency(data.monthly_amount)}</strong> dipotong secara otomatis dari rekening payroll Bank Muamalat oleh Bagian Keuangan Yayasan. 
                      Anggota <strong>tidak perlu melakukan transfer manual atau mengunggah bukti pembayaran</strong>.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3.5">
                  <div className="p-2.5 bg-amber-600 text-white rounded-xl shrink-0 mt-0.5 shadow-sm">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-amber-950 text-sm">
                        Skema Pelunasan: Pembayaran Mandiri (QRIS Dinamis &amp; Transfer Bank)
                      </span>
                      <span className="bg-amber-200/70 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Tenaga Outsourcing / Eksternal
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Pembayaran dilakukan mandiri setiap bulan via Scan QRIS Dinamis atau transfer rekening Bank Muamalat Koperasi. 
                      Setiap tagihan dilengkapi <strong>3 Digit Kode Unik</strong> agar teridentifikasi secara instan.
                    </p>
                  </div>
                </div>
              )}

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
                  <span className="text-emerald-700 block text-[10px] uppercase font-bold">Angsuran Pokok / Bln</span>
                  <span className="font-black text-emerald-900 text-sm">{formatCurrency(data.monthly_amount)}</span>
                </div>
                <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
                  <span className="text-emerald-700 block text-[10px] uppercase font-bold">Progress Pelunasan</span>
                  <span className="font-black text-emerald-900 text-sm">{totalLunasCount} / {data.tenor} Bulan</span>
                </div>
              </div>

              {/* DYNAMIC QRIS & MANUAL TRANSFER PAYMENT CARD (When Selected) */}
              {selectedInstallment && !isPayroll && userRole === 'anggota' && dynamicQris && (
                <div className="p-5 rounded-3xl bg-slate-900 text-white border-2 border-emerald-500 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-emerald-500 text-slate-950 rounded-lg">
                        <QrCode className="w-4 h-4" />
                      </span>
                      <div>
                        <h4 className="font-extrabold text-sm text-white">
                          QRIS Dinamis — Angsuran ke-{selectedInstallment.installment_number}
                        </h4>
                        <span className="text-[11px] text-emerald-300 font-medium">
                          Nominal terkunci otomatis via QRIS Standar Bank Indonesia (EMVCo)
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedInstallment(null)} 
                      className="text-xs text-slate-400 hover:text-white font-bold bg-slate-800 px-2.5 py-1 rounded-lg transition"
                    >
                      Tutup
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                    
                    {/* Left: QR Code Preview */}
                    <div className="flex flex-col items-center bg-white p-4 rounded-2xl text-slate-900 shadow-inner">
                      <div className="text-center mb-2">
                        <span className="font-black text-xs tracking-wider block text-slate-800">QRIS STANDAR PEMBAYARAN NASIONAL</span>
                        <span className="text-[10px] text-slate-500">KOPERASI KARYAWAN AL-AZHAR BSD</span>
                      </div>

                      <div className="p-2 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
                        <img 
                          src={dynamicQris.qrImageUrl} 
                          alt="QRIS Dinamis" 
                          className="w-48 h-48 object-contain rounded-lg"
                        />
                      </div>

                      <div className="text-center mt-2.5 space-y-0.5">
                        <span className="text-[10px] font-mono text-slate-500 block">NMID: ID1020261109001</span>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                          Scan dengan BCA Mobile, Livin, GoPay, OVO, Dana, dll.
                        </span>
                      </div>
                    </div>

                    {/* Right: Payment Breakdown & Bank Muamalat Transfer */}
                    <div className="space-y-3.5 text-xs">
                      
                      {/* Price Breakdown */}
                      <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 space-y-2">
                        <div className="flex justify-between items-center text-slate-400">
                          <span>Angsuran Pokok + Jasa:</span>
                          <span className="font-mono font-bold text-white">{formatCurrency(selectedInstallment.amount)}</span>
                        </div>
                        <div className="flex justify-between items-center text-amber-400">
                          <span className="flex items-center gap-1">
                            Kode Unik Verifikasi:
                            <span className="text-[9px] bg-amber-400/20 px-1.5 py-0.2 rounded font-bold">Otomatis</span>
                          </span>
                          <span className="font-mono font-extrabold">+ Rp {selectedInstallment.kode_unik || 0}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-700 flex justify-between items-center">
                          <span className="font-bold text-emerald-400">Total Tagihan (Pas):</span>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-black text-emerald-300 font-mono">
                              {formatCurrency(dynamicQris.totalBayar)}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(String(dynamicQris.totalBayar), 'nominal')}
                              className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition"
                              title="Salin Nominal"
                            >
                              {copiedText === 'nominal' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Bank Muamalat Alternative */}
                      <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 space-y-1.5">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Opsi Transfer Bank (Muamalat):
                        </span>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-mono font-bold text-white text-sm">3910000280</span>
                            <span className="block text-[11px] text-slate-400">a.n. Koperasi Karyawan Al-Azhar BSD</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard('3910000280', 'rekening')}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] transition shadow-xs"
                          >
                            {copiedText === 'rekening' ? (
                              <>
                                <Check className="w-3 h-3 text-yellow-300" />
                                <span>Tersalin</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Salin No Rek</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Upload Proof */}
                      <form onSubmit={handleUploadPayment} className="space-y-2 pt-1">
                        <div className="p-2.5 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-between">
                          <span className="font-mono text-[11px] text-slate-300 truncate pr-2">
                            {proofFile.name || 'Belum upload struk/bukti transfer'}
                          </span>
                          <label className="cursor-pointer px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold text-[11px] shrink-0 transition">
                            Pilih File
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
                          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? 'Mengunggah...' : 'Konfirmasi Bukti Transfer'}
                        </button>
                      </form>

                    </div>

                  </div>
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
                          <td className="p-3 text-slate-900 font-mono">
                            <span className="font-bold text-slate-900 block">
                              {formatCurrency(inst.amount)}
                            </span>
                            {!isPayroll && (inst.kode_unik ?? 0) > 0 && (
                              <span className="text-[10px] text-amber-700 font-semibold block">
                                + Kode Unik: Rp {inst.kode_unik} (Total: {formatCurrency(inst.total_with_code || (inst.amount + (inst.kode_unik || 0)))})
                              </span>
                            )}
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
                            ) : isPayroll ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 font-semibold text-[10px] border border-teal-200">
                                <Building className="w-3 h-3 text-teal-600" /> Payroll (Tgl 25)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-semibold text-[10px] border border-amber-200">
                                Mandiri (QRIS)
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

                            {/* Anggota Pay Button (Only if NOT payroll or if outsourcing) */}
                            {userRole === 'anggota' && inst.status !== 'lunas' && !isPayroll && (
                              <button
                                onClick={() => {
                                  setSelectedInstallment(inst);
                                  setMsg(null);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] shadow-xs transition"
                              >
                                <QrCode className="w-3 h-3 text-white" />
                                {inst.status === 'menunggu_konfirmasi' ? 'Ganti Bukti' : 'Bayar QRIS'}
                              </button>
                            )}

                            {/* Anggota notice if payroll */}
                            {userRole === 'anggota' && inst.status !== 'lunas' && isPayroll && (
                              <span className="text-[10px] text-teal-700 font-semibold italic bg-teal-50 px-2 py-0.5 rounded">
                                Auto Payroll
                              </span>
                            )}

                            {/* Petugas Simpin / Admin Confirm Button */}
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
