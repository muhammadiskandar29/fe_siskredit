'use client';

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { NotificationDropdown } from './NotificationDropdown';
import { Shield, User as UserIcon, LogOut, RefreshCw, Building2, FlaskConical } from 'lucide-react';
import { UserRole } from '../types';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentFrame: 'operasional' | 'lab_riset';
  setCurrentFrame: (frame: 'operasional' | 'lab_riset') => void;
}

export const Navbar: React.FC<Props> = ({ activeTab, setActiveTab, currentFrame, setCurrentFrame }) => {
  const { user, logout, switchRoleQuick } = useAuth();

  const getRoleLabel = (role?: UserRole) => {
    switch (role) {
      case 'anggota': return 'Anggota (Pemohon)';
      case 'petugas_simpin': return 'Petugas Simpin (Admin)';
      case 'ketua_koperasi': return 'Ketua Koperasi (Approver)';
      default: return 'Pengguna';
    }
  };

  const isStaff = user?.role === 'petugas_simpin' || user?.role === 'ketua_koperasi';

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-4">

          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-black text-sm shadow-md ring-1 ring-white/20">
              KA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white tracking-tight text-sm sm:text-base">
                  KOPKAR <span className="text-emerald-400 font-black">AL-AZHAR BSD</span>
                </span>
                <span className="bg-emerald-950/80 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-800/80 tracking-wide uppercase">
                  SPK SMART
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Sistem Penunjang Keputusan Kelayakan Kredit
              </p>
            </div>
          </div>

          {/* Middle: Frame Selector (Operasional 3 Role vs Lab Riset Simulasi) */}
          <div className="flex items-center bg-slate-950/90 p-1 rounded-xl border border-slate-800 text-xs shadow-inner">
            <button
              onClick={() => setCurrentFrame('operasional')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                currentFrame === 'operasional'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Interface Operasional 3 User: Anggota, Petugas Simpin, dan Ketua Koperasi"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Operasional Koperasi</span>
              <span className="sm:hidden">Operasional</span>
            </button>

            {/* Lab Riset SPK: Simulasi Akademik */}
            {isStaff && (
              <button
                onClick={() => setCurrentFrame('lab_riset')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                  currentFrame === 'lab_riset'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Laboratorium Simulasi Komputasi SMART"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lab Riset SPK</span>
                <span className="sm:hidden">Lab Riset</span>
              </button>
            )}
          </div>

          {/* Right Side: Notification Dropdown + Role Simulator + Profile */}
          <div className="flex items-center gap-3 shrink-0">

            {/* Realtime Notification Dropdown */}
            <NotificationDropdown
              onNavigate={(targetUrl) => {
                setCurrentFrame('operasional');
                if (targetUrl?.includes('criteria')) {
                  setActiveTab('criteria_master');
                } else {
                  setActiveTab('dashboard');
                }

                // Dispatch global custom event for Dashboard modals to open
                window.dispatchEvent(
                  new CustomEvent('NOTIF_NAVIGATE', {
                    detail: { targetUrl },
                  })
                );

                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* Quick Demo Role Switcher */}
            {currentFrame === 'operasional' && (
              <div className="hidden lg:flex items-center bg-slate-950/90 p-1 rounded-xl border border-slate-800 text-xs">
                <span className="px-2 text-slate-400 font-medium text-[11px]">
                  Mode:
                </span>
                <button
                  onClick={() => switchRoleQuick('petugas_simpin')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    user?.role === 'petugas_simpin' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Petugas
                </button>
                <button
                  onClick={() => switchRoleQuick('ketua_koperasi')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    user?.role === 'ketua_koperasi' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Ketua
                </button>
                <button
                  onClick={() => switchRoleQuick('anggota')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    user?.role === 'anggota' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Anggota
                </button>
              </div>
            )}

            {/* User Profile */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-700/80 text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="text-right hidden md:block">
                <div className="font-semibold text-xs text-white leading-tight truncate max-w-[160px]">
                  {user?.name}
                </div>
                <div className="text-[10px] font-semibold text-emerald-400 mt-0.5">
                  {getRoleLabel(user?.role)}
                </div>
              </div>
              <button
                onClick={logout}
                title="Keluar / Logout"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition border border-transparent hover:border-slate-700"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};
