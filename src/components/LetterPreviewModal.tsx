'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { LoanApplication } from '../types';
import { 
  Printer, 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Minimize2, 
  Maximize2,
  ShieldCheck,
  Award,
  Download,
  ExternalLink
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  loan: LoanApplication | null;
}

interface LetterData {
  letter_number: string;
  date: string;
  cooperative_name: string;
  applicant: {
    name: string;
    nik: string;
    unit_kerja: string;
    status_pegawai: string;
    masa_kerja: string;
  };
  loan_details: {
    approved_nominal: number;
    approved_tenor: number;
    keperluan: string;
    no_rekening: string;
    nama_rekening: string;
  };
  smart_score: number;
  smart_recommendation: string;
  qr_code_data_uri?: string;
  verification_token?: string;
  verification_url?: string;
  approver: {
    name: string;
    title: string;
  };
}

export const LetterPreviewModal: React.FC<Props> = ({ isOpen, onClose, loan }) => {
  const [letterData, setLetterData] = useState<LetterData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(90);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && loan) {
      setIsMinimized(false);
      setZoomLevel(90);
      setLetterData(null);
      fetchLetter();
    }
  }, [isOpen, loan]);

  const fetchLetter = async () => {
    if (!loan) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/approvals/${loan.id}/letter`);
      if (res.data.success) {
        setLetterData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching letter details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !loan) return null;

  const formatCurrency = (val?: number) => {
    if (!val) return 'Rp 0';
    return 'Rp ' + Number(val).toLocaleString('id-ID');
  };

  const terbilangApprox = (val?: number) => {
    if (!val) return '';
    if (val >= 1000000) return `(${(val / 1000000).toLocaleString('id-ID')} Juta Rupiah)`;
    if (val >= 1000) return `(${(val / 1000).toLocaleString('id-ID')} Ribu Rupiah)`;
    return '';
  };

  // Minimized floating bubble
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-slate-900 text-white shadow-2xl border border-emerald-500/30 hover:bg-slate-800 transition"
        >
          <Award className="w-5 h-5 text-yellow-400" />
          <div className="text-left text-xs">
            <span className="font-extrabold block">{loan.letter_number || loan.application_number}</span>
            <span className="text-[10px] text-slate-400">Klik untuk buka kembali</span>
          </div>
          <Maximize2 className="w-4 h-4 ml-2 text-slate-400" />
        </button>
      </div>
    );
  }

  const letterNo = letterData?.letter_number || loan.letter_number || 'SK-KREDIT/2026/08/0001';
  const approverName = letterData?.approver?.name || 'Arrizal Muhaemin Yunus, M.Pd';
  const approvedNominal = letterData?.loan_details?.approved_nominal || loan.approved_nominal || loan.nominal_pengajuan;
  const approvedTenor = letterData?.loan_details?.approved_tenor || loan.approved_tenor || loan.tenor_bulan;
  const applicantName = letterData?.applicant?.name || loan.user?.name || '';
  const applicantNik = letterData?.applicant?.nik || loan.user?.nik || '';
  const unitKerja = letterData?.applicant?.unit_kerja || loan.user?.unit_kerja || '';
  const statusPegawai = letterData?.applicant?.status_pegawai || loan.status_pegawai || '';
  const masaKerja = letterData?.applicant?.masa_kerja || (loan.masa_kerja_tahun + ' Tahun');
  const keperluan = letterData?.loan_details?.keperluan || loan.keperluan_pinjaman || '';
  const noRekening = letterData?.loan_details?.no_rekening || loan.no_rekening_muamalat || '';
  const namaRekening = letterData?.loan_details?.nama_rekening || loan.nama_rekening || '';
  const smartScore = letterData?.smart_score || loan.smart_evaluation?.final_score || 0;
  const smartRec = letterData?.smart_recommendation || loan.smart_evaluation?.recommendation || '';
  const letterDate = letterData?.date || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const verificationUrl = letterData?.verification_url;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-3 sm:p-4 overflow-y-auto">
      
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full my-4 flex flex-col border border-slate-200 overflow-hidden">
        
        {/* Toolbar */}
        <div className="bg-slate-900 text-white px-5 py-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-xs shadow-md">SK</div>
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                Surat Keputusan Persetujuan Pinjaman (e-SK)
                <span className="text-[10px] font-bold bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  Resmi & Terverifikasi Digital
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">{letterNo}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700 text-xs gap-0.5">
              <button onClick={() => setZoomLevel(z => Math.max(z - 10, 50))} className="p-1.5 hover:bg-slate-700 rounded-md text-slate-300 hover:text-white transition">
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setZoomLevel(90)} className="px-2 py-1 font-mono text-[11px] font-bold text-emerald-300 hover:bg-slate-700 rounded transition">
                {zoomLevel}%
              </button>
              <button onClick={() => setZoomLevel(z => Math.min(z + 10, 130))} className="p-1.5 hover:bg-slate-700 rounded-md text-slate-300 hover:text-white transition">
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {verificationUrl && (
              <a
                href={verificationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Verifikasi
              </a>
            )}

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak / PDF
            </button>

            <button onClick={() => setIsMinimized(true)} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition">
              <Minimize2 className="w-3.5 h-3.5" />
            </button>

            <button onClick={onClose} className="p-2 rounded-lg bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* A4 Document Canvas */}
        <div className="bg-slate-200/70 p-6 overflow-y-auto flex justify-center">
          
          {isLoading ? (
            <div className="text-center py-24 text-slate-500 text-xs">
              <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <span>Menyiapkan e-SK dengan QR Code Verifikasi Digital...</span>
            </div>
          ) : (

            /* A4 Document */
            <div
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center', minWidth: '680px' }}
              className="bg-white shadow-2xl w-[680px] text-[11px] text-slate-800 leading-relaxed print:shadow-none"
            >
              {/* ===== KOP SURAT ===== */}
              <div className="border-b-4 border-slate-900 pb-4 px-10 pt-8 flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-600 flex items-center justify-center text-white font-black text-4xl shadow-md shrink-0">A</div>
                <div className="flex-1 text-center space-y-0.5">
                  <div className="font-black text-[15px] text-slate-900 uppercase tracking-tight">
                    Koperasi Konsumen Karyawan Perguruan Al-Azhar BSD
                  </div>
                  <div className="text-[11px] font-bold text-emerald-800">
                    Unit Simpan Pinjam — Badan Hukum No. 518/08-BH/Diskop/2004
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Jl. Puspita Raya No. 2, Lengkong Gudang, Kec. Serpong, Kota Tangerang Selatan 15321
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Email: kopkar@al-azhar.or.id | Telp. (021) 5370161
                  </div>
                </div>
                <div className="w-20 h-20 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex flex-col items-center justify-center text-center p-2 shrink-0">
                  <ShieldCheck className="w-7 h-7 text-emerald-700 mb-1" />
                  <span className="text-[8px] font-extrabold text-emerald-800 uppercase leading-tight">KOPKAR SAH</span>
                </div>
              </div>
              <div className="border-b border-slate-900 mx-10 mt-1"></div>

              {/* ===== JUDUL DOKUMEN ===== */}
              <div className="text-center py-5 px-10 space-y-1">
                <div className="font-black text-[13px] text-slate-900 uppercase tracking-wide underline underline-offset-4">
                  Surat Keputusan Persetujuan Pinjaman Kredit
                </div>
                <div className="font-mono text-[11px] font-bold text-slate-600">Nomor: {letterNo}</div>
              </div>

              {/* ===== BODY SURAT ===== */}
              <div className="px-10 space-y-4 text-justify text-[11px] text-slate-700">
                <p>
                  Berdasarkan hasil verifikasi kelengkapan berkas permohonan kredit anggota dan komputasi objektif sistem pendukung keputusan metode{' '}
                  <strong>Simple Multi-Attribute Rating Technique (SMART)</strong>, Pengurus Koperasi Karyawan Al-Azhar BSD
                  dengan ini menerbitkan keputusan persetujuan pemberian pinjaman kepada anggota berikut:
                </p>

                {/* Data Pemohon */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-800 text-white text-[10px] font-extrabold uppercase px-4 py-1.5 tracking-wide">
                    Data Identitas Pemohon
                  </div>
                  <div className="p-4 space-y-1.5">
                    {[
                      ['Nama Lengkap', applicantName],
                      ['Nomor Induk Kependudukan (NIK)', applicantNik],
                      ['Unit Kerja', `Unit ${unitKerja}`],
                      ['Status & Masa Kerja', `${statusPegawai} — ${masaKerja}`],
                    ].map(([label, val]) => (
                      <div key={label} className="grid grid-cols-[200px_1fr] gap-2">
                        <span className="font-semibold text-slate-500">{label}</span>
                        <span className="font-bold text-slate-900 flex items-center gap-1">
                          <span className="text-slate-400">:</span> {val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <p>
                  Dengan rincian fasilitas pinjaman yang disetujui sebagai berikut:
                </p>

                {/* Rincian Pinjaman */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg overflow-hidden">
                  <div className="bg-emerald-800 text-white text-[10px] font-extrabold uppercase px-4 py-1.5 tracking-wide">
                    Fasilitas Pinjaman yang Disetujui
                  </div>
                  <div className="p-4 space-y-1.5">
                    {[
                      ['Plafon Pinjaman Disetujui', `${formatCurrency(approvedNominal)} ${terbilangApprox(approvedNominal)}`],
                      ['Jangka Waktu (Tenor)', `${approvedTenor} Bulan`],
                      ['Tujuan Keperluan Dana', keperluan],
                      ['Rekening Tujuan Pencairan', `Bank Muamalat ${noRekening} (a.n. ${namaRekening})`],
                      ['Skor Indeks SMART', `${smartScore} / 100 (${smartRec || 'Sangat Layak'})`],
                    ].map(([label, val]) => (
                      <div key={label} className="grid grid-cols-[200px_1fr] gap-2">
                        <span className="font-semibold text-emerald-900">{label}</span>
                        <span className={`font-bold text-slate-900 flex items-center gap-1 ${label === 'Plafon Pinjaman Disetujui' ? 'text-emerald-900 text-[13px]' : ''} ${label === 'Skor Indeks SMART' ? 'text-emerald-800' : ''}`}>
                          <span className="text-slate-400">:</span> {val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <p>
                  Demikian Surat Keputusan Persetujuan Pinjaman Kredit ini diterbitkan secara sah dan digital
                  oleh Pengurus Koperasi untuk dipergunakan sebagaimana mestinya dan menjadi dasar pelepasan
                  dana kredit kepada anggota yang bersangkutan.
                </p>
              </div>

              {/* ===== TANDA TANGAN & QR CODE ===== */}
              <div className="px-10 pt-6 pb-10 flex items-end justify-between gap-6">
                
                {/* LEFT: Brief Verification Metadata */}
                <div className="text-[9px] text-slate-500 space-y-1.5 max-w-[240px]">
                  <div className="font-extrabold text-emerald-800 uppercase flex items-center gap-1.5 text-[10px]">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Dokumen Resmı &amp; Terverifikasi</span>
                  </div>
                  <p className="text-[9px] text-slate-500 leading-relaxed">
                    Surat Keputusan ini disetujui secara resmi oleh Pengurus Koperasi. Pindai/Scan QR Code di sebelah kanan untuk memverifikasi integritas dan keaslian dokumen ini secara publik.
                  </p>
                  {letterData?.verification_token && (
                    <div className="font-mono text-[8px] text-slate-400 bg-slate-50 p-1.5 rounded border border-slate-200">
                      Token: {letterData.verification_token}
                    </div>
                  )}
                </div>

                {/* RIGHT: Ketua Tanda Tangan DIGITAL dengan QR CODE sebagai TTD Resmi */}
                <div className="text-center space-y-1 min-w-[220px]">
                  <p className="text-[11px] text-slate-600">
                    Tangerang Selatan, {letterDate}
                  </p>
                  <p className="font-bold text-slate-800 text-[11px]">
                    Ketua Koperasi Karyawan Al-Azhar BSD,
                  </p>

                  {/* Digital Signature Area (QR Code as Official Digital Signature) */}
                  <div className="h-28 flex flex-col items-center justify-center relative my-1">
                    {/* Circular Stempel Overlay */}
                    <div className="absolute w-24 h-24 rounded-full border-2 border-dashed border-emerald-600/30 flex items-center justify-center -rotate-12 pointer-events-none z-10">
                      <span className="text-[6px] font-extrabold text-emerald-700/30 uppercase text-center leading-tight">
                        KOPKAR<br/>AL-AZHAR<br/>BSD
                      </span>
                    </div>

                    {/* QR Code Tanda Tangan Digital */}
                    {letterData?.qr_code_data_uri ? (
                      <img
                        src={letterData.qr_code_data_uri}
                        alt="Tanda Tangan Digital QR Ketua Koperasi"
                        className="w-20 h-20 object-contain relative z-0 p-1 bg-white border-2 border-emerald-600/40 rounded-xl shadow-md"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-slate-100 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-[8px] text-slate-400 text-center font-mono">
                        QR Digital TTD
                      </div>
                    )}
                  </div>

                  <p className="font-extrabold text-[12px] text-slate-900 underline underline-offset-2">
                    {approverName}
                  </p>
                  <p className="text-[9px] font-extrabold text-emerald-800 uppercase tracking-tight flex items-center justify-center gap-1">
                    <span className="text-emerald-600">✓</span> Tanda Tangan Digital Sah
                  </p>
                </div>

              </div>
              {/* Footer line */}
              <div className="border-t border-slate-200 mx-10 pb-6 pt-2 text-center text-[8px] text-slate-400 font-mono">
                Dokumen ini diterbitkan secara digital oleh sistem SPK Koperasi Al-Azhar BSD. Keaslian dapat diverifikasi dengan memindai QR Code di atas.
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
