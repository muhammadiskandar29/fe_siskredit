'use client';

import React, { useState } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { LoginPage } from '../pages-views/LoginPage';
import { Navbar } from './Navbar';
import { MemberDashboard } from '../pages-views/MemberDashboard';
import { AdminDashboard } from '../pages-views/AdminDashboard';
import { ChairmanDashboard } from '../pages-views/ChairmanDashboard';
import { MasterCriteriaPage } from '../pages-views/MasterCriteriaPage';
import { SmartLabPage } from '../pages-views/SmartLabPage';
import {
  CreditCard,
  Cpu,
  Award,
  SlidersHorizontal,
  FlaskConical
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('tab');
      if (p) return p;
    }
    return 'dashboard';
  });
  const [currentFrame, setCurrentFrame] = useState<'operasional' | 'lab_riset'>(() => {
    if (typeof window !== 'undefined') {
      const v = new URLSearchParams(window.location.search).get('view');
      if (v === 'smart_lab') return 'lab_riset';
    }
    return 'operasional';
  });

  // Initialize activeTab based on user role and query params
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      const viewParam = urlParams.get('view');
      if (viewParam === 'smart_lab') setCurrentFrame('lab_riset');
      if (tabParam) {
        setActiveTab(tabParam);
        return;
      }
    }

    if (user) {
      if (user.role === 'anggota' && (activeTab === 'dashboard' || activeTab === '')) {
        setActiveTab('member_portal');
      } else if (user.role === 'petugas_simpin' && (activeTab === 'dashboard' || activeTab === '')) {
        setActiveTab('admin_engine');
      } else if (user.role === 'ketua_koperasi' && (activeTab === 'dashboard' || activeTab === '')) {
        setActiveTab('chairman_approval');
      }
    }
  }, [user]);



  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 mx-auto flex items-center justify-center font-black text-2xl shadow-lg">
            A
          </div>
          <p className="text-xs font-semibold text-emerald-300">Memuat Sistem SPK SMART...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  const isStaff = user.role === 'petugas_simpin' || user.role === 'ketua_koperasi';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentFrame={currentFrame}
        setCurrentFrame={setCurrentFrame}
      />

      {/* RENDER FRAME 2: LABORATORIUM RISET SPK SMART (SIMULASI PENELITIAN) */}
      {currentFrame === 'lab_riset' && isStaff ? (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <SmartLabPage onBackToOperational={() => setCurrentFrame('operasional')} />
        </main>
      ) : (
        /* RENDER FRAME 1: OPERASIONAL KOPERASI (3 ROLE PENGGUNA) */
        <>
          {/* Secondary Sub-Navbar for Navigation */}
          <div className="bg-white border-b border-slate-200/80 shadow-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 overflow-x-auto py-2.5 text-xs">

              <div className="flex items-center gap-2 shrink-0">
                {/* Portal Permohonan Pinjaman Tab (Khusus Anggota) */}
                {user.role === 'anggota' && (
                  <button
                    onClick={() => setActiveTab('member_portal')}
                    className={`px-4 py-2 rounded-xl flex items-center gap-2 transition font-semibold ${
                      activeTab === 'member_portal' || (activeTab === 'dashboard' && user.role === 'anggota') 
                        ? 'bg-emerald-600 text-white shadow-xs' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Portal Anggota</span>
                  </button>
                )}

                {/* Verifikasi & Scoring SPK Tab (Khusus Petugas Simpin) */}
                {user.role === 'petugas_simpin' && (
                  <button
                    onClick={() => setActiveTab('admin_engine')}
                    className={`px-4 py-2 rounded-xl flex items-center gap-2 transition font-semibold ${
                      activeTab === 'admin_engine' || (activeTab === 'dashboard' && user.role === 'petugas_simpin') 
                        ? 'bg-emerald-600 text-white shadow-xs' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Cpu className="w-4 h-4" />
                    <span>Verifikasi & Scoring SPK</span>
                  </button>
                )}

                {/* Master Kriteria Tab (Khusus Petugas Simpin) */}
                {user.role === 'petugas_simpin' && (
                  <button
                    onClick={() => setActiveTab('criteria_master')}
                    className={`px-4 py-2 rounded-xl flex items-center gap-2 transition font-semibold ${
                      activeTab === 'criteria_master' 
                        ? 'bg-emerald-600 text-white shadow-xs' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>Master Kriteria</span>
                  </button>
                )}

                {/* Dashboard Otorisasi & Approval Tab (Khusus Ketua Koperasi) */}
                {user.role === 'ketua_koperasi' && (
                  <button
                    onClick={() => setActiveTab('chairman_approval')}
                    className={`px-4 py-2 rounded-xl flex items-center gap-2 transition font-semibold ${
                      activeTab === 'chairman_approval' || (activeTab === 'dashboard' && user.role === 'ketua_koperasi') 
                        ? 'bg-emerald-600 text-white shadow-xs' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    <span>Otorisasi & Approval</span>
                  </button>
                )}
              </div>

              {/* Direct Access to Frame 2 (Lab Riset SPK Simulasi) */}
              {isStaff && (
                <button
                  onClick={() => setCurrentFrame('lab_riset')}
                  className="px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition font-semibold shrink-0 ml-auto"
                  title="Buka interface simulasi perhitungan SMART untuk pengujian penelitian"
                >
                  <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Lab Riset SPK (Simulasi) &rarr;</span>
                </button>
              )}

            </div>
          </div>

          {/* Main Content Area */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {activeTab === 'criteria_master' && user.role === 'petugas_simpin' ? (
              <MasterCriteriaPage />
            ) : activeTab === 'admin_engine' || (activeTab === 'dashboard' && user.role === 'petugas_simpin') ? (
              <AdminDashboard />
            ) : activeTab === 'chairman_approval' || (activeTab === 'dashboard' && user.role === 'ketua_koperasi') ? (
              <ChairmanDashboard />
            ) : (
              <MemberDashboard />
            )}
          </main>
        </>
      )}

      {/* Corporate Consulting Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 <strong>Koperasi Konsumen Karyawan Al-Azhar BSD</strong> — Hak Cipta Dilindungi.</p>
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Terproteksi e-SK QR Code Digital Signature</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default function MainApp() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
