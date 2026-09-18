import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Mail, ArrowRight, User, Award, FileSpreadsheet, CheckCircle2, Sparkles } from 'lucide-react';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('anggota');
  const [email, setEmail] = useState('achmad.sobari@alazhar.org');
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
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950 via-slate-950 to-black flex items-center justify-center p-4 sm:p-6 md:p-8">
      
      {/* Main Container Card */}
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-800/20">
        
        {/* LEFT COLUMN: Brand Hero Banner */}
        <div className="md:w-5/12 bg-gradient-to-br from-emerald-900 via-kopkar-900 to-slate-950 p-8 md:p-10 text-white flex flex-col justify-between relative overflow-hidden shrink-0">
          
          {/* Ambient Glows */}
          <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none"></div>
          <div className="absolute -left-10 -bottom-10 w-44 h-44 rounded-full bg-gold-500/10 blur-3xl pointer-events-none"></div>

          {/* Top Brand Header */}
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-black text-2xl text-white shadow-xl">
                A
              </div>
              <div>
                <span className="text-[10px] font-extrabold tracking-widest text-emerald-400 uppercase block">KOPKAR</span>
                <span className="text-base font-black tracking-tight text-white block leading-none">AL-AZHAR BSD</span>
              </div>
            </div>

            <div className="pt-2">
              <h1 className="text-xl font-extrabold text-white leading-tight">
                Sistem Penunjang Keputusan <span className="text-emerald-300">SMART</span>
              </h1>
              <p className="text-xs text-emerald-200/80 mt-1 leading-relaxed">
                Platform Evaluasi Kelayakan Pinjaman Kredit &amp; Penerbitan e-SK Terverifikasi QR Code.
              </p>
            </div>
          </div>

          {/* Middle Feature Highlights */}
          <div className="relative z-10 my-8 space-y-3">
            {[
              { title: 'Perhitungan SMART Objektif', desc: 'Analisis kriteria & bobot otomatis', icon: Sparkles },
              { title: 'e-SK Tanda Tangan Digital', desc: 'QR Code verifikasi dokumen sah', icon: ShieldCheck },
              { title: 'Monitoring Alur Kredit', desc: 'Tracking transparan permohonan', icon: FileSpreadsheet },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <item.icon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">{item.title}</h4>
                  <p className="text-[10px] text-emerald-200/70">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Footer Note */}
          <div className="relative z-10 pt-4 border-t border-white/10 text-[10px] text-emerald-200/60">
            Koperasi Konsumen Karyawan Al-Azhar BSD &copy; 2026
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Login Form */}
        <div className="md:w-7/12 p-8 md:p-10 bg-white flex flex-col justify-between">
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Masuk ke Portal</h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Silakan pilih peran akun demo atau masukkan kredensial Anda.
              </p>
            </div>

            {/* DEMO ROLE SELECTOR PILLS */}
            <div className="mb-6 space-y-2">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                ⚡ Pilih Peran Akun (Demo Pengujian Skripsi):
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { role: 'anggota' as UserRole, label: 'Anggota', email: 'achmad.sobari@alazhar.org', badge: 'Pemohon' },
                  { role: 'petugas_simpin' as UserRole, label: 'Petugas', email: 'petugas.simpin@alazhar.org', badge: 'Verifikator' },
                  { role: 'ketua_koperasi' as UserRole, label: 'Ketua', email: 'ketua.koperasi@alazhar.org', badge: 'Approver' },
                ].map((item) => {
                  const isSelected = selectedRole === item.role;
                  return (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => handleSelectRole(item.role)}
                      className={`p-2.5 rounded-2xl text-left border transition relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-600/20 shadow-sm'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {item.badge}
                        </span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>
                      <span className={`text-xs font-extrabold block truncate ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                {error}
              </div>
            )}

            {/* FORM INPUTS */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email / NIK Anggota
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email atau NIK..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 text-xs font-bold text-slate-900 transition bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
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
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 text-xs font-bold text-slate-900 transition bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-3 py-3.5 rounded-xl bg-gradient-to-r from-emerald-700 to-kopkar-800 hover:from-emerald-800 hover:to-kopkar-900 text-white font-extrabold text-xs shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Memproses Login...</span>
                ) : (
                  <>
                    <span>Masuk ke Sistem</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 text-center">
            <span className="text-[10px] text-slate-400 font-medium">
              Sistem Terproteksi Autentikasi Laravel Sanctum
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
