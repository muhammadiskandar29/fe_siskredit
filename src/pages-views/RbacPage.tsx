'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Role } from '../types';
import { Shield, Key, Check, Users, Lock, Save, CheckCircle2 } from 'lucide-react';

export const RbacPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissionsGrouped, setPermissionsGrouped] = useState<Record<string, any[]>>({});
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resRoles, resPerms] = await Promise.all([
        api.get('/rbac/roles'),
        api.get('/rbac/permissions')
      ]);

      if (resRoles.data.success) {
        setRoles(resRoles.data.data);
        if (resRoles.data.data.length > 0 && !selectedRole) {
          const first = resRoles.data.data[0];
          setSelectedRole(first);
          setSelectedPermissions(first.permissions?.map((p: any) => p.id) || []);
        }
      }

      if (resPerms.data.success) {
        setPermissionsGrouped(resPerms.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setSelectedPermissions(role.permissions?.map((p) => p.id) || []);
    setMsg(null);
  };

  const handleTogglePermission = (permId: number) => {
    if (selectedPermissions.includes(permId)) {
      setSelectedPermissions(selectedPermissions.filter(id => id !== permId));
    } else {
      setSelectedPermissions([...selectedPermissions, permId]);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setIsSaving(true);
    setMsg(null);

    try {
      const res = await api.put(`/rbac/roles/${selectedRole.id}/permissions`, {
        permission_ids: selectedPermissions,
      });

      if (res.data.success) {
        setMsg({ type: 'success', text: res.data.message });
        fetchData();
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: 'Gagal memperbarui hak akses peran.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-emerald-50 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-700" />
            Keamanan Sistem &amp; Otorisasi
          </span>
          <span className="bg-slate-100 text-slate-700 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-slate-200">
            Akses Eksklusif: Super Admin
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Dynamic Role-Based Access Control (RBAC)
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
          Super Admin dapat memetakan hak akses fungsionalitas dan otorisasi menu per peran pengguna secara dinamis tanpa perlu mengubah baris kode.
        </p>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-3 ${
          msg.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-rose-50 border-rose-300 text-rose-800'
        }`}>
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{msg.text}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Col: Roles List */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
          <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
            Daftar Peran Pengguna (Roles)
          </h3>

          <div className="space-y-2">
            {roles.map((r) => (
              <button
                key={r.id}
                onClick={() => handleSelectRole(r)}
                className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between ${
                  selectedRole?.id === r.id 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs' 
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div>
                  <div className={`font-bold text-xs ${selectedRole?.id === r.id ? 'text-white' : 'text-slate-900'}`}>
                    {r.display_name}
                  </div>
                  <div className={`text-[10px] font-mono mt-0.5 ${selectedRole?.id === r.id ? 'text-emerald-300' : 'text-slate-500'}`}>
                    {r.name}
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                  selectedRole?.id === r.id 
                    ? 'bg-slate-800 text-emerald-300 border-slate-700' 
                    : 'bg-white text-slate-500 border-slate-200'
                }`}>
                  {r.permissions?.length || 0} Izin
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Col: Permissions Matrix */}
        <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Hak Akses untuk: <span className="text-emerald-700 font-extrabold">{selectedRole?.display_name}</span>
              </h3>
              <p className="text-[11px] text-slate-500">Centang atau hilangkan centang izin modul yang diperbolehkan untuk peran ini.</p>
            </div>

            <button
              onClick={handleSavePermissions}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Hak Akses'}</span>
            </button>
          </div>

          <div className="space-y-6">
            {Object.keys(permissionsGrouped).map((groupKey) => (
              <div key={groupKey} className="space-y-2">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Kategori: {groupKey}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {permissionsGrouped[groupKey].map((perm: any) => {
                    const isChecked = selectedPermissions.includes(perm.id);
                    return (
                      <div
                        key={perm.id}
                        onClick={() => handleTogglePermission(perm.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition flex items-center gap-3 ${
                          isChecked 
                            ? 'bg-emerald-50/70 border-emerald-500 text-slate-900 shadow-xs' 
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/80'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-md flex items-center justify-center border transition shrink-0 ${
                          isChecked ? 'bg-emerald-700 border-emerald-700 text-white' : 'bg-white border-slate-300'
                        }`}>
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">{perm.display_name}</div>
                          <div className="font-mono text-[10px] text-slate-400">{perm.name}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
};
