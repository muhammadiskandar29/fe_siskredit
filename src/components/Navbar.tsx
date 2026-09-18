import React from 'react';
import { useAuth } from '../context/AuthContext';
import { NotificationDropdown } from './NotificationDropdown';
import { Shield, User as UserIcon, LogOut, RefreshCw, Building } from 'lucide-react';
import { UserRole } from '../types';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<Props> = ({ activeTab, setActiveTab }) => {
  const { user, logout, switchRoleQuick } = useAuth();

  const getRoleLabel = (role?: UserRole) => {
    switch (role) {
      case 'anggota': return 'Anggota (Pemohon)';
      case 'petugas_simpin': return 'Petugas Simpin (Admin)';
      case 'ketua_koperasi': return 'Ketua Koperasi (Approver)';
      default: return 'Pengguna';
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-kopkar-800 flex items-center justify-center text-white font-black text-xl shadow-md border border-emerald-500/30">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white tracking-tight text-lg">
                  KOPKAR <span className="text-emerald-400">AL-AZHAR BSD</span>
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  SPK SMART
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Sistem Penunjang Keputusan Kelayakan Kredit
              </p>
            </div>
          </div>

          {/* Right Side: Notification Dropdown + Quick Role Switcher + Profile */}
          <div className="flex items-center gap-3">

            {/* Realtime Notification Dropdown */}
            <NotificationDropdown
              onNavigate={(targetUrl) => {
                if (targetUrl?.includes('criteria')) {
                  setActiveTab('criteria_master');
                } else if (targetUrl?.includes('rbac')) {
                  setActiveTab('rbac');
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
            <div className="hidden md:flex items-center bg-slate-800 p-1 rounded-2xl border border-slate-700 text-xs">
              <span className="px-2 font-bold text-slate-400 flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin-slow" /> Role Demo:
              </span>
              <button
                onClick={() => switchRoleQuick('anggota')}
                className={`px-2.5 py-1 rounded-xl font-bold transition ${user?.role === 'anggota' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
              >
                Anggota
              </button>
              <button
                onClick={() => switchRoleQuick('petugas_simpin')}
                className={`px-2.5 py-1 rounded-xl font-bold transition ${user?.role === 'petugas_simpin' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
              >
                Petugas Simpin
              </button>
              <button
                onClick={() => switchRoleQuick('ketua_koperasi')}
                className={`px-2.5 py-1 rounded-xl font-bold transition ${user?.role === 'ketua_koperasi' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
              >
                Ketua Koperasi
              </button>
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <div className="font-extrabold text-xs text-white leading-tight">{user?.name}</div>
                <div className="text-[10px] font-extrabold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md inline-block mt-0.5 border border-emerald-500/30">
                  {getRoleLabel(user?.role)}
                </div>
              </div>
              <button
                onClick={logout}
                title="Keluar / Logout"
                className="p-2 rounded-2xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition border border-slate-800 hover:border-rose-500/30"
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
