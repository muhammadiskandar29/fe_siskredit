'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, ArrowRight, Check } from 'lucide-react';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('petugas_simpin');
  const [email, setEmail] = useState('petugas.simpin@alazhar.org');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login gagal. Periksa kembali email dan password Anda.');
    }
  };

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    if (role === 'anggota') {
      setEmail('achmad.sobari@alazhar.org');
    } else if (role === 'petugas_simpin') {
      setEmail('petugas.simpin@alazhar.org');
    } else if (role === 'ketua_koperasi') {
      setEmail('ketua.koperasi@alazhar.org');
    }
    setPassword('password');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Container Card */}
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-slate-200">
        
        {/* Left Column: Brand & Context */}
        <div className="md:w-5/12 bg-slate-950 p-8 sm:p-10 text-white flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-lg text-white">
                A
              </div>
              <div>
                <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Koperasi Karyawan</div>
                <div className="text-base font-bold text-white tracking-tight">Al-Azhar BSD</div>
              </div>
            </div>

            <div className="space-y-3">
              <span className="inline-block text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-800/60">
                Sistem Pendukung Keputusan
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                Kelayakan Pemberian Kredit Pinjaman
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                Penerapan Metode SMART untuk rekomendasi plafon dan tenor pinjaman secara objektif, transparan, dan akuntabel.
              </p>
            </div>
          </div>

          <div className="pt-8 mt-8 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Terintegrasi Digital Approval &amp; e-SK Terverifikasi</span>
          </div>
        </div>

        {/* Right Column: Clean Login Form */}
        <div className="md:w-7/12 p-8 sm:p-10 bg-white flex flex-col justify-between">
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Masuk ke Sistem</h2>
              <p className="text-xs text-slate-500 mt-1">
                Gunakan tombol akses cepat peran akun atau masukkan email terdaftar.
              </p>
            </div>

            {/* Quick Role Switcher */}
            <div className="mb-6">
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Akses Cepat Pengujian:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { role: 'petugas_simpin' as UserRole, label: 'Petugas', sub: 'Evaluator Simpin' },
                  { role: 'ketua_koperasi' as UserRole, label: 'Ketua', sub: 'Approver e-SK' },
                  { role: 'anggota' as UserRole, label: 'Anggota', sub: 'Pemohon Kredit' },
                ].map((item) => {
                  const isSelected = selectedRole === item.role;
                  return (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => handleSelectRole(item.role)}
                      className={`p-2.5 rounded-xl text-left border transition ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950 ring-1 ring-emerald-600'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/70 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-semibold text-slate-400 uppercase truncate">{item.sub}</span>
                        {isSelected && <Check className="w-3 h-3 text-emerald-600 shrink-0" />}
                      </div>
                      <div className="text-xs font-bold mt-0.5 text-slate-900 truncate">{item.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email atau NIK
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@alazhar.org"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Memproses...</span>
                ) : (
                  <>
                    <span>Masuk ke Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
            Koperasi Konsumen Karyawan Al-Azhar BSD &copy; 2026
          </div>
        </div>

      </div>
    </div>
  );
};

