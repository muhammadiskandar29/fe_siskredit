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
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-kopkar-100 text-kopkar-800 text-xs font-extrabold px-3 py-1 rounded-full border border-kopkar-300 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-kopkar-800" />
            Keamanan Sistem
          </span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Dynamic Role-Based Access Control (RBAC)
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Kelola matriks hak akses fungsionalitas dan otorisasi menu per peran pengguna secara dinamis.
        </p>
      </div>

      {msg && (
        <div className={`p-4 rounded-2xl border text-sm font-semibold flex items-center gap-3 ${
          msg.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-rose-50 border-rose-300 text-rose-800'
        }`}>
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          {msg.text}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Col: Roles List */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
            Daftar Peran Pengguna (Roles)
          </h3>

          <div className="space-y-2">
            {roles.map((r) => (
              <button
                key={r.id}
                onClick={() => handleSelectRole(r)}
                className={`w-full text-left p-4 rounded-2xl border transition flex items-center justify-between ${
                  selectedRole?.id === r.id ? 'bg-kopkar-50 border-kopkar-400 text-kopkar-900 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div>
                  <div className="font-bold text-sm">{r.display_name}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">{r.name}</div>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                  {r.permissions?.length || 0} Izin
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Col: Permissions Matrix */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Hak Akses untuk Peran: <span className="text-kopkar-800 underline">{selectedRole?.display_name}</span>
              </h3>
              <p className="text-xs text-slate-500">Centang izin modul yang diperbolehkan untuk peran ini</p>
            </div>

            <button
              onClick={handleSavePermissions}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl kopkar-gradient text-white font-extrabold text-xs shadow-md hover:opacity-95 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Hak Akses'}</span>
            </button>
          </div>

          <div className="space-y-6">
            {Object.keys(permissionsGrouped).map((groupKey) => (
              <div key={groupKey} className="space-y-2">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Modul Group: {groupKey}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {permissionsGrouped[groupKey].map((perm: any) => {
                    const isChecked = selectedPermissions.includes(perm.id);
                    return (
                      <div
                        key={perm.id}
                        onClick={() => handleTogglePermission(perm.id)}
                        className={`p-3 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                          isChecked ? 'bg-emerald-50/70 border-emerald-400 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition ${
                          isChecked ? 'bg-kopkar-800 border-kopkar-800 text-white' : 'bg-white border-slate-300'
                        }`}>
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="font-bold text-xs">{perm.display_name}</div>
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
