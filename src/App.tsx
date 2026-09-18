import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { Navbar } from './components/Navbar';
import { MemberDashboard } from './pages/MemberDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ChairmanDashboard } from './pages/ChairmanDashboard';
import { RbacPage } from './pages/RbacPage';
import { MasterCriteriaPage } from './pages/MasterCriteriaPage';
import {
  CreditCard,
  Cpu,
  Award,
  Shield,
  SlidersHorizontal
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, isAuthenticated, isLoading, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Initialize activeTab based on user role / permissions
  React.useEffect(() => {
    if (user) {
      if (user.role === 'anggota' && activeTab === 'dashboard') {
        setActiveTab('member_portal');
      } else if (user.role === 'petugas_simpin' && activeTab === 'dashboard') {
        setActiveTab('admin_engine');
      } else if (user.role === 'ketua_koperasi' && activeTab === 'dashboard') {
        setActiveTab('chairman_approval');
      }
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl kopkar-gradient mx-auto flex items-center justify-center font-black text-2xl animate-bounce">
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Secondary Sub-Navbar for Dynamic RBAC Navigation */}
      <div className="bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto py-2.5 text-xs font-bold">

          {/* Portal Permohonan Pinjaman Tab */}
          {(hasPermission('loan.create') || hasPermission('loan.view_own') || user.role === 'anggota') && (
            <button
              onClick={() => setActiveTab('member_portal')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition ${
                activeTab === 'member_portal' || (activeTab === 'dashboard' && user.role === 'anggota') ? 'bg-kopkar-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Portal Permohonan Pinjaman</span>
            </button>
          )}

          {/* Verifikasi & Engine SMART Tab (Petugas Simpin / Any User with loan.view_all or loan.verify) */}
          {(hasPermission('loan.view_all') || hasPermission('loan.verify') || hasPermission('smart.calculate') || user.role === 'petugas_simpin') && (
            <button
              onClick={() => setActiveTab('admin_engine')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition ${
                activeTab === 'admin_engine' || (activeTab === 'dashboard' && user.role === 'petugas_simpin') ? 'bg-kopkar-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Verifikasi &amp; Engine SMART</span>
            </button>
          )}

          {/* Dashboard Otorisasi & Approval Tab (Ketua Koperasi / Any User with loan.approve) */}
          {(hasPermission('loan.approve') || user.role === 'ketua_koperasi') && (
            <button
              onClick={() => setActiveTab('chairman_approval')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition ${
                activeTab === 'chairman_approval' || (activeTab === 'dashboard' && user.role === 'ketua_koperasi') ? 'bg-kopkar-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Award className="w-4 h-4 text-gold-400" />
              <span>Dashboard Otorisasi &amp; Approval</span>
            </button>
          )}

          {/* Master Kriteria Tab */}
          {(hasPermission('criteria.manage') || user.role === 'petugas_simpin' || user.role === 'admin') && (
            <button
              onClick={() => setActiveTab('criteria_master')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition ${
                activeTab === 'criteria_master' ? 'bg-kopkar-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Master Kriteria &amp; Sub-Kriteria</span>
            </button>
          )}

          {/* Manajemen RBAC Tab */}
          {(hasPermission('users.manage') || user.role === 'petugas_simpin' || user.role === 'admin') && (
            <button
              onClick={() => setActiveTab('rbac')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition ${
                activeTab === 'rbac' ? 'bg-kopkar-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Manajemen RBAC &amp; Pengguna</span>
            </button>
          )}

        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'rbac' && (hasPermission('users.manage') || user.role === 'petugas_simpin' || user.role === 'admin') ? (
          <RbacPage />
        ) : activeTab === 'criteria_master' && (hasPermission('criteria.manage') || user.role === 'petugas_simpin' || user.role === 'admin') ? (
          <MasterCriteriaPage />
        ) : activeTab === 'admin_engine' || (activeTab === 'dashboard' && user.role === 'petugas_simpin') ? (
          <AdminDashboard />
        ) : activeTab === 'chairman_approval' || (activeTab === 'dashboard' && user.role === 'ketua_koperasi') ? (
          <ChairmanDashboard />
        ) : (
          <MemberDashboard />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 <strong>Koperasi Karyawan Al-Azhar BSD</strong> — SPK Kelayakan Kredit Metode SMART</p>
          <p className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Arsitektur: Laravel 10 API + TypeScript React SPA + Dynamic RBAC
          </p>
        </div>
      </footer>

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
