import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { LoanApplication } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { LetterPreviewModal } from '../components/LetterPreviewModal';
import { InstallmentsModal } from '../components/InstallmentsModal';
import { 
  CreditCard, 
  Send, 
  Clock, 
  CheckCircle2, 
  FileText, 
  AlertCircle, 
  Download, 
  PlusCircle,
  Building,
  DollarSign,
  Award,
  FileCheck,
  ShieldCheck,
  ArrowRight,
  UploadCloud,
  File,
  Sparkles,
  Calendar
} from 'lucide-react';

export const MemberDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedLoanForLetter, setSelectedLoanForLetter] = useState<LoanApplication | null>(null);
  const [selectedLoanForInstallments, setSelectedLoanForInstallments] = useState<number | null>(null);

  // Form states - Natural Member Input
  const [nominal, setNominal] = useState<number>(10000000);
  const [tenor, setTenor] = useState<number>(12);
  const [keperluan, setKeperluan] = useState<string>('');
  const [noRekening, setNoRekening] = useState<string>(user?.no_rekening_muamalat || '3910000280');
  const [namaRekening, setNamaRekening] = useState<string>(user?.nama_rekening || user?.name || '');

  // File Uploads with Real Base64
  const [slipGaji, setSlipGaji] = useState<{ name: string; base64: string }>({ name: 'Slip_Gaji_Bulan_Ini.pdf', base64: '' });
  const [mutasi, setMutasi] = useState<{ name: string; base64: string }>({ name: 'Mutasi_Tabungan_Muamalat.pdf', base64: '' });
  const [skPegawai, setSkPegawai] = useState<{ name: string; base64: string }>({ name: 'SK_Kepegawaian_Yayasan.pdf', base64: '' });
  const [ktp, setKtp] = useState<{ name: string; base64: string }>({ name: 'Foto_KTP.jpg', base64: '' });

  const [formMsg, setFormMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchLoans = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/loans');
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
      } else if (loanId) {
        const found = loans.find((l) => l.id === loanId);
        if (found) {
          setSelectedLoanForLetter(found);
        }
      }
    };

    window.addEventListener('NOTIF_NAVIGATE', handleNotifNav);
    return () => window.removeEventListener('NOTIF_NAVIGATE', handleNotifNav);
  }, [loans]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<{ name: string; base64: string }>>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setter({
          name: file.name,
          base64: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormMsg(null);

    const docPayload = [
      { type: 'slip_gaji', file_name: slipGaji.name, base64: slipGaji.base64 },
      { type: 'mutasi_rekening', file_name: mutasi.name, base64: mutasi.base64 },
      { type: 'sk_pegawai', file_name: skPegawai.name, base64: skPegawai.base64 },
      { type: 'ktp', file_name: ktp.name, base64: ktp.base64 },
    ];

    try {
      const res = await api.post('/loans', {
        nominal_pengajuan: nominal,
        tenor_bulan: tenor,
        keperluan_pinjaman: keperluan,
        no_rekening_muamalat: noRekening,
        nama_rekening: namaRekening,
        documents: docPayload,
      });

      if (res.data.success) {
        setFormMsg({ type: 'success', text: res.data.message });
        setShowModal(false);
        setKeperluan('');
        fetchLoans();
      }
    } catch (err: any) {
      setFormMsg({ 
        type: 'error', 
        text: err.response?.data?.message || 'Gagal mengajukan pinjaman. Cek kembali data Anda.' 
      });
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

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="kopkar-gradient rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <span className="bg-white/20 backdrop-blur-md text-emerald-100 text-xs font-semibold px-3 py-1 rounded-full border border-white/10 inline-block mb-2">
              Unit Simpan Pinjam Koperasi Al-Azhar BSD
            </span>
            <h2 className="text-2xl font-black tracking-tight">
              Assalamu'alaikum, {user?.name}!
            </h2>
            <p className="text-emerald-100/90 text-sm mt-1 max-w-xl">
              Portal mandiri pengajuan kredit pinjaman bagi tenaga pendidik dan karyawan Al-Azhar BSD dengan evaluasi sistem objektif metode SMART.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 bg-white text-kopkar-900 hover:bg-emerald-50 px-6 py-3.5 rounded-2xl font-extrabold text-sm shadow-lg transition transform hover:-translate-y-0.5"
          >
            <PlusCircle className="w-5 h-5 text-kopkar-800" />
            <span>+ Ajukan Pinjaman Baru</span>
          </button>
        </div>

        {/* Member Profile Snapshot */}
        <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
            <span className="text-emerald-200 block text-[10px] uppercase font-bold">Unit Kerja</span>
            <span className="font-bold text-sm">Unit {user?.unit_kerja || 'LAKHAR'}</span>
          </div>
          <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
            <span className="text-emerald-200 block text-[10px] uppercase font-bold">Status Kepegawaian</span>
            <span className="font-bold text-sm">{user?.status_pegawai || 'TETAP'} ({user?.masa_kerja_tahun || 6} Thn)</span>
          </div>
          <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
            <span className="text-emerald-200 block text-[10px] uppercase font-bold">Rekening Bank Muamalat</span>
            <span className="font-bold text-sm font-mono">{user?.no_rekening_muamalat || '3910000280'}</span>
          </div>
          <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
            <span className="text-emerald-200 block text-[10px] uppercase font-bold">Plafon Maksimal</span>
            <span className="font-bold text-sm text-gold-300">Rp 20.000.000,- (24 Bln)</span>
          </div>
        </div>
      </div>

      {/* Message Alert */}
      {formMsg && (
        <div className={`p-4 rounded-2xl border text-sm font-semibold flex items-center gap-3 ${
          formMsg.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-rose-50 border-rose-300 text-rose-800'
        }`}>
          {formMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
          {formMsg.text}
        </div>
      )}

      {/* Applications List & Full Lifecycle Tracking */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg">Riwayat Permohonan &amp; Tracking Linimasa</h3>
            <p className="text-xs text-slate-500">Pantau proses verifikasi berkas, perhitungan SMART, otorisasi ketua, hingga pelepasan dana</p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            Total: {loans.length} Permohonan
          </span>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-slate-400">
            <Clock className="w-8 h-8 mx-auto animate-spin mb-2" />
            <p className="text-xs font-medium">Memuat data permohonan...</p>
          </div>
        ) : loans.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Belum Ada Pengajuan Pinjaman</p>
            <p className="text-xs text-slate-500 mt-0.5">Klik tombol "+ Ajukan Pinjaman Baru" di atas untuk mengisi formulir permohonan kredit.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {loans.map((loan) => (
              <div
                key={loan.id}
                className="p-6 rounded-3xl border border-slate-200 hover:border-kopkar-300 hover:shadow-lg transition bg-white space-y-5"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-kopkar-800 bg-kopkar-50 px-2.5 py-0.5 rounded-md border border-kopkar-200">
                        {loan.application_number}
                      </span>
                      <StatusBadge status={loan.status} />
                    </div>

                    <h4 className="font-black text-xl text-slate-900">
                      {formatCurrency(loan.approved_nominal || loan.nominal_pengajuan)}
                      <span className="text-xs font-semibold text-slate-500 ml-2">
                        / {loan.approved_tenor || loan.tenor_bulan} Bulan
                      </span>
                    </h4>

                    <p className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-500">Keperluan:</span> {loan.keperluan_pinjaman}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {['approved', 'disbursed'].includes(loan.status) && (
                      <button
                        onClick={() => setSelectedLoanForInstallments(loan.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition"
                      >
                        <Calendar className="w-4 h-4 text-gold-300" />
                        <span>Jadwal &amp; Tagihan Angsuran</span>
                      </button>
                    )}

                    {['approved', 'disbursed'].includes(loan.status) ? (
                      <button
                        onClick={() => setSelectedLoanForLetter(loan)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-kopkar-800 hover:bg-kopkar-700 text-white font-bold text-xs shadow-md transition"
                      >
                        <Download className="w-4 h-4 text-gold-300" />
                        <span>Unduh e-SK (PDF)</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        title="e-SK akan terbit otomatis setelah disetujui resmi oleh Ketua Koperasi"
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs cursor-not-allowed border border-slate-200"
                      >
                        <Download className="w-4 h-4 text-slate-300" />
                        <span>e-SK Belum Terbit</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 4-STAGE USER-FRIENDLY TIMELINE */}
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Progres Permohonan Anda:
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    
                    {/* Stage 1: Pengajuan */}
                    <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>1. Permohonan Masuk</span>
                      </div>
                      <p className="text-[10px] text-slate-500">{formatDate(loan.created_at)}</p>
                      <p className="text-[10px] text-slate-700 font-medium">Formulir &amp; berkas diterima</p>
                    </div>

                    {/* Stage 2: Pengecekan Berkas oleh Petugas */}
                    <div className={`p-3 rounded-2xl border space-y-1 ${
                      ['verified', 'smart_calculated', 'forwarded_to_chairman', 'approved', 'disbursed'].includes(loan.status)
                        ? 'bg-emerald-50/80 border-emerald-200'
                        : loan.status === 'revision_required'
                        ? 'bg-amber-50 border-amber-300'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}>
                      <div className="flex items-center gap-1.5 font-extrabold text-[11px] text-slate-800">
                        {['verified', 'smart_calculated', 'forwarded_to_chairman', 'approved', 'disbursed'].includes(loan.status) ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : loan.status === 'revision_required' ? (
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>2. Pengecekan Berkas</span>
                      </div>
                      <p className="text-[10px] text-slate-500">{formatDate(loan.verified_at)}</p>
                      <p className="text-[10px] text-slate-700 font-medium">
                        {loan.status === 'revision_required'
                          ? '⚠️ Harap lengkapi berkas'
                          : loan.verified_at
                          ? 'Berkas dinyatakan lengkap'
                          : 'Sedang diperiksa petugas'
                        }
                      </p>
                    </div>

                    {/* Stage 3: Review & Keputusan Ketua (Gabungan SMART + forward + approved/rejected) */}
                    <div className={`p-3 rounded-2xl border space-y-1 ${
                      ['approved', 'disbursed'].includes(loan.status)
                        ? 'bg-emerald-50/80 border-emerald-200'
                        : loan.status === 'rejected'
                        ? 'bg-rose-50 border-rose-200'
                        : ['smart_calculated', 'forwarded_to_chairman'].includes(loan.status)
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}>
                      <div className="flex items-center gap-1.5 font-extrabold text-[11px] text-slate-800">
                        {['approved', 'disbursed'].includes(loan.status) ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : loan.status === 'rejected' ? (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        ) : ['smart_calculated', 'forwarded_to_chairman'].includes(loan.status) ? (
                          <Clock className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>3. Review &amp; Keputusan</span>
                      </div>
                      <p className="text-[10px] text-slate-500">{formatDate(loan.approved_at)}</p>
                      <p className={`text-[10px] font-medium ${
                        loan.status === 'rejected' ? 'text-rose-700' :
                        ['smart_calculated', 'forwarded_to_chairman'].includes(loan.status) ? 'text-blue-700' :
                        loan.status === 'approved' || loan.status === 'disbursed' ? 'text-emerald-800 font-bold' :
                        'text-slate-600'
                      }`}>
                        {loan.status === 'rejected'
                          ? 'Tidak disetujui'
                          : ['approved', 'disbursed'].includes(loan.status)
                          ? '✓ Disetujui Ketua Koperasi'
                          : ['smart_calculated', 'forwarded_to_chairman'].includes(loan.status)
                          ? 'Sedang diproses ketua'
                          : 'Menunggu proses'
                        }
                      </p>
                    </div>

                    {/* Stage 4: Pencairan Dana */}
                    <div className={`p-3 rounded-2xl border space-y-1 ${
                      loan.status === 'disbursed'
                        ? 'bg-emerald-600 border-emerald-700 shadow-sm'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}>
                      <div className={`flex items-center gap-1.5 font-extrabold text-[11px] ${loan.status === 'disbursed' ? 'text-white' : 'text-slate-800'}`}>
                        {loan.status === 'disbursed' ? (
                          <DollarSign className="w-3.5 h-3.5 text-yellow-300" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>4. Pencairan Dana</span>
                      </div>
                      <p className={`text-[10px] ${loan.status === 'disbursed' ? 'text-emerald-100' : 'text-slate-500'}`}>
                        {formatDate(loan.disbursed_at)}
                      </p>
                      <p className={`text-[10px] font-medium ${loan.status === 'disbursed' ? 'text-emerald-50' : 'text-slate-600'}`}>
                        {loan.status === 'disbursed' ? 'Dana telah masuk rekening' : 'Menunggu pencairan'}
                      </p>
                    </div>

                  </div>
                </div>

                {/* Detail Permohonan — Collapsible, user-friendly (NO SMART jargon) */}
                <details className="pt-3 border-t border-slate-100">
                  <summary className="text-[11px] font-bold text-kopkar-800 cursor-pointer select-none hover:underline flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> Lihat Detail Permohonan
                  </summary>
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px] uppercase">Plafon Diajukan</span>
                        <span className="font-bold text-slate-900">{formatCurrency(loan.nominal_pengajuan)}</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px] uppercase">Tenor</span>
                        <span className="font-bold text-slate-900">{loan.tenor_bulan} Bulan</span>
                      </div>
                      {loan.approved_nominal && (
                        <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                          <span className="text-emerald-600 block text-[10px] uppercase font-bold">Plafon Disetujui</span>
                          <span className="font-extrabold text-emerald-900">{formatCurrency(loan.approved_nominal)}</span>
                        </div>
                      )}
                      {loan.approved_tenor && (
                        <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                          <span className="text-emerald-600 block text-[10px] uppercase font-bold">Tenor Disetujui</span>
                          <span className="font-extrabold text-emerald-900">{loan.approved_tenor} Bulan</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px] uppercase">Keperluan</span>
                      <span className="font-medium text-slate-800">{loan.keperluan_pinjaman}</span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px] uppercase">Rekening Pencairan</span>
                      <span className="font-mono font-bold text-slate-800">{loan.no_rekening_muamalat}</span>
                      <span className="text-slate-600 ml-1">(a.n. {loan.nama_rekening})</span>
                    </div>

                    {loan.status === 'rejected' && loan.approval_notes && (
                      <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                        <span className="text-rose-600 block text-[10px] uppercase font-bold">Alasan Tidak Disetujui</span>
                        <span className="font-medium text-rose-800">{loan.approval_notes}</span>
                      </div>
                    )}

                    {loan.status === 'revision_required' && loan.verification_notes && (
                      <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 space-y-1">
                        <span className="text-amber-800 block text-[10px] uppercase font-extrabold">✏️ Catatan Penyesuaian &amp; Perbaikan dari Petugas</span>
                        <span className="font-semibold text-amber-950 block">{loan.verification_notes}</span>
                      </div>
                    )}

                    {/* Linimasa Audit Log */}
                    {loan.logs && loan.logs.length > 0 && (
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5 mt-2">
                        <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block">
                          📋 Riwayat Catatan Penyesuaian &amp; Status (Linimasa):
                        </span>
                        <div className="space-y-1 divide-y divide-slate-200/60">
                          {loan.logs.map((log) => (
                            <div key={log.id} className="pt-1 flex items-start gap-1.5 text-[11px]">
                              <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                                log.action === 'revision_requested' ? 'bg-amber-500' :
                                log.action === 'approved' || log.action === 'disbursed' ? 'bg-emerald-500' :
                                log.action === 'rejected' ? 'bg-rose-500' : 'bg-blue-500'
                              }`} />
                              <div className="flex-1">
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="font-bold text-slate-800">{log.user?.name || 'Petugas Simpin'}</span>
                                  <span className="text-slate-400 font-mono text-[9px]">{formatDate(log.created_at)}</span>
                                </div>
                                <p className="text-slate-700 font-medium text-[11px] mt-0.5">{log.notes}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {loan.status === 'disbursed' && (
                      <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                        <span className="text-emerald-700 block text-[10px] uppercase font-bold">✓ Info Pencairan</span>
                        <span className="font-medium text-emerald-900">
                          Dana {formatCurrency(loan.disbursed_amount)} dicairkan {formatDate(loan.disbursed_at)}
                        </span>
                      </div>
                    )}
                  </div>
                </details>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* MODAL FORMULIR PENGAJUAN PINJAMAN ANGGOTA */}
      {/* ========================================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
            <div className="kopkar-gradient p-6 text-white flex justify-between items-center">
              <div>
                <span className="bg-white/20 text-emerald-100 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">Formulir Permohonan</span>
                <h3 className="font-extrabold text-lg mt-0.5">Pengajuan Pinjaman Koperasi</h3>
                <p className="text-xs text-emerald-200">Isi data pinjaman dan lampirkan berkas persyaratan Anda</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white text-lg font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleApply} className="p-6 space-y-4 text-xs max-h-[82vh] overflow-y-auto">
              
              {/* Section 1: Rencana Pinjaman */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 text-kopkar-800">
                  <CreditCard className="w-4 h-4" /> 1. Rencana Pinjaman (Plafon &amp; Tenor)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Nominal Pinjaman (Maks. Rp 20.000.000,-)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 font-bold text-slate-400 text-sm">Rp</span>
                      <input
                        type="text"
                        required
                        value={nominal ? nominal.toLocaleString('id-ID') : ''}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '');
                          const val = raw ? Math.min(Number(raw), 20000000) : 0;
                          setNominal(val);
                        }}
                        placeholder="10.000.000"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm font-black text-emerald-950 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition"
                      />
                    </div>
                    <span className="text-[10px] font-extrabold text-emerald-700 mt-1 block">
                      Terbilang: {formatCurrency(nominal)}
                    </span>

                    {/* Quick Nominal Presets */}
                    <div className="flex gap-1 mt-2">
                      {[5000000, 10000000, 15000000, 20000000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setNominal(amt)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-extrabold border transition ${
                            nominal === amt
                              ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {amt / 1000000} Jt
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Jangka Waktu Cicilan (Tenor)
                    </label>
                    <select
                      value={tenor}
                      onChange={(e) => setTenor(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800"
                    >
                      <option value={6}>6 Bulan</option>
                      <option value={10}>10 Bulan</option>
                      <option value={12}>12 Bulan (1 Tahun)</option>
                      <option value={18}>18 Bulan</option>
                      <option value={24}>24 Bulan (2 Tahun - Maksimal)</option>
                    </select>
                  </div>
                </div>

                {/* Realtime Live Simulation Output (1% flat per month) */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950 via-kopkar-900 to-slate-900 text-white space-y-2.5 shadow-md border border-emerald-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-gold-300 animate-pulse" /> Simulasi Angsuran (Bunga 1%/bln Flat)
                    </span>
                    <span className="bg-white/20 text-[10px] font-mono font-bold px-2 py-0.5 rounded text-white">
                      {tenor} Bulan
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm">
                      <span className="text-emerald-200 block text-[9px] uppercase font-bold">Total Bunga</span>
                      <span className="font-bold text-white text-[11px]">{formatCurrency(nominal * 0.01 * tenor)}</span>
                    </div>
                    <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm">
                      <span className="text-emerald-200 block text-[9px] uppercase font-bold">Total Pengembalian</span>
                      <span className="font-bold text-white text-[11px]">{formatCurrency(nominal + (nominal * 0.01 * tenor))}</span>
                    </div>
                    <div className="bg-gold-500/20 border border-gold-400/40 p-2 rounded-xl backdrop-blur-sm">
                      <span className="text-gold-300 block text-[9px] uppercase font-bold">Angsuran / Bulan</span>
                      <span className="font-black text-gold-200 text-xs">
                        {formatCurrency(Math.ceil((nominal + (nominal * 0.01 * tenor)) / tenor))}
                      </span>
                    </div>
                  </div>

                  <details className="text-[10px] pt-1 border-t border-white/10">
                    <summary className="cursor-pointer text-emerald-300 font-bold hover:underline select-none">
                      Lihat Pratinjau Jadwal {tenor} Bulan Cicilan
                    </summary>
                    <div className="mt-2 space-y-1 max-h-28 overflow-y-auto pr-1">
                      {Array.from({ length: tenor }).map((_, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white/10 px-2.5 py-1 rounded text-[10px] font-mono">
                          <span>Bulan ke-{idx + 1}</span>
                          <span className="font-bold text-gold-200">
                            {formatCurrency(Math.ceil((nominal + (nominal * 0.01 * tenor)) / tenor))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Keperluan Pinjaman
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={keperluan}
                    onChange={(e) => setKeperluan(e.target.value)}
                    placeholder="Tuliskan tujuan penggunaan dana (misal: Biaya pendidikan anak, renovasi, pengobatan)..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              {/* Section 2: Rekening Bank Muamalat */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 text-kopkar-800">
                  <Building className="w-4 h-4" /> 2. Rekening Bank Muamalat (Pencairan Dana)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">No. Rekening Muamalat</label>
                    <input
                      type="text"
                      required
                      value={noRekening}
                      onChange={(e) => setNoRekening(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Nama Pemilik Rekening</label>
                    <input
                      type="text"
                      required
                      value={namaRekening}
                      onChange={(e) => setNamaRekening(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Upload 4 Berkas Persyaratan (Real Base64) */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 text-kopkar-800">
                  <UploadCloud className="w-4 h-4" /> 3. Unggah Berkas Persyaratan Asli (PDF/JPG)
                </h4>

                <div className="space-y-2.5">
                  {/* File 1: Slip Gaji */}
                  <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 block">1. Slip Gaji Bulan Terakhir</span>
                      <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <File className="w-3 h-3 text-emerald-600" /> {slipGaji.name}
                      </span>
                    </div>
                    <label className="cursor-pointer px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl font-bold text-[11px] text-slate-700 shadow-xs">
                      Pilih File
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(e, setSlipGaji)}
                      />
                    </label>
                  </div>

                  {/* File 2: Mutasi Tabungan */}
                  <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 block">2. Mutasi Tabungan / Simpanan Muamalat</span>
                      <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <File className="w-3 h-3 text-emerald-600" /> {mutasi.name}
                      </span>
                    </div>
                    <label className="cursor-pointer px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl font-bold text-[11px] text-slate-700 shadow-xs">
                      Pilih File
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(e, setMutasi)}
                      />
                    </label>
                  </div>

                  {/* File 3: SK Pegawai */}
                  <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 block">3. Surat Keputusan (SK) Kepegawaian Yayasan</span>
                      <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <File className="w-3 h-3 text-emerald-600" /> {skPegawai.name}
                      </span>
                    </div>
                    <label className="cursor-pointer px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl font-bold text-[11px] text-slate-700 shadow-xs">
                      Pilih File
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(e, setSkPegawai)}
                      />
                    </label>
                  </div>

                  {/* File 4: Foto KTP */}
                  <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 block">4. Foto Kartu Tanda Penduduk (KTP)</span>
                      <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <File className="w-3 h-3 text-emerald-600" /> {ktp.name}
                      </span>
                    </div>
                    <label className="cursor-pointer px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl font-bold text-[11px] text-slate-700 shadow-xs">
                      Pilih File
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(e, setKtp)}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl kopkar-gradient text-white font-extrabold shadow-md hover:opacity-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? 'Mengirim...' : 'Kirim Permohonan Pinjaman'}
                  <ArrowRight className="w-4 h-4" />
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

      {/* Loan Installments Schedule & Payment Proof Upload Modal */}
      <InstallmentsModal
        isOpen={!!selectedLoanForInstallments}
        onClose={() => setSelectedLoanForInstallments(null)}
        loanId={selectedLoanForInstallments}
        userRole="anggota"
        onRefreshParent={fetchLoans}
      />
    </div>
  );
};
