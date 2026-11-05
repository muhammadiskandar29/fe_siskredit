'use client';

import React, { useState } from 'react';
import { api } from '../services/api';
import { UserPlus, X, CheckCircle2, AlertCircle, User, Mail, Shield, Building, Lock } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RegisterMemberModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [nik, setNik] = useState('');
  const [unitKerja, setUnitKerja] = useState('SD');
  const [password, setPassword] = useState('password');

  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMsg(null);

    try {
      const res = await api.post('/users', {
        name,
        email,
        nik,
        unit_kerja: unitKerja,
        password,
        role: 'anggota',
      });

      if (res.data.success) {
        setMsg({ type: 'success', text: res.data.message });
        setName('');
        setEmail('');
        setNik('');
        setPassword('password');
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setMsg({
        type: 'error',
        text: err.response?.data?.message || 'Gagal mendaftarkan akun Anggota baru. Cek kembali data Anda.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-kopkar-900 text-white p-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white shadow-md">
              <UserPlus className="w-5 h-5 text-gold-300" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-300 block">
                Petugas &amp; Administrator
              </span>
              <h3 className="font-black text-base text-white leading-none mt-0.5">
                Registrasi Akun Kreditur / Anggota
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {msg && (
            <div className={`p-3.5 rounded-2xl border font-bold flex items-center gap-2 ${
              msg.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}>
              {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              <span>{msg.text}</span>
            </div>
          )}

          {/* 1. Nama Lengkap */}
          <div>
            <label className="block font-extrabold text-slate-700 uppercase mb-1">
              1. Nama Lengkap Anggota
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="misal: Bambang Hermawan, S.Pd"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
              />
            </div>
          </div>

          {/* 2. Email */}
          <div>
            <label className="block font-extrabold text-slate-700 uppercase mb-1">
              2. Alamat Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="misal: bambang@alazhar.org"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
              />
            </div>
          </div>

          {/* 3. NIK / No. Anggota */}
          <div>
            <label className="block font-extrabold text-slate-700 uppercase mb-1">
              3. NIK / No. Anggota Koperasi
            </label>
            <div className="relative">
              <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                placeholder="misal: 3674019283740001"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
              />
            </div>
          </div>

          {/* 4. Unit Kerja */}
          <div>
            <label className="block font-extrabold text-slate-700 uppercase mb-1">
              4. Unit Kerja / Sekolah
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <select
                value={unitKerja}
                onChange={(e) => setUnitKerja(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
              >
                <option value="TK">Unit TK Al-Azhar BSD</option>
                <option value="SD">Unit SD Al-Azhar BSD</option>
                <option value="SMP">Unit SMP Al-Azhar BSD</option>
                <option value="SMA">Unit SMA Al-Azhar BSD</option>
                <option value="LAKHAR">Unit LAKHAR / Sekretariat</option>
              </select>
            </div>
          </div>

          {/* 5. Password */}
          <div>
            <label className="block font-extrabold text-slate-700 uppercase mb-1">
              5. Password Default
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {isLoading ? 'Mendaftarkan...' : 'Daftarkan Akun Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
