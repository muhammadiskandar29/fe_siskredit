'use client';

import React from 'react';
import { DollarSign, Award, Clock, AlertTriangle, XCircle, FileCheck, Send } from 'lucide-react';

interface Props {
  status: string;
}

export const StatusBadge: React.FC<Props> = ({ status }) => {
  switch (status) {
    case 'disbursed':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-600 text-white shadow-xs">
          <DollarSign className="w-3.5 h-3.5 text-gold-300" />
          Dana Telah Cair (Disbursed)
        </span>
      );
    case 'approved':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
          <Award className="w-3.5 h-3.5 text-emerald-600" />
          Disetujui Ketua (Approved)
        </span>
      );
    case 'forwarded_to_chairman':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300">
          <Send className="w-3.5 h-3.5 text-purple-600" />
          Diteruskan ke Ketua
        </span>
      );
    case 'smart_calculated':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-300">
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
          Skor SMART Terbit
        </span>
      );
    case 'verified':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
          <FileCheck className="w-3.5 h-3.5 text-blue-600" />
          Berkas Valid
        </span>
      );
    case 'revision_required':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          Perlu Revisi Dokumen
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Ditolak (Rejected)
        </span>
      );
    case 'pending':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          Menunggu Verifikasi
        </span>
      );
  }
};
