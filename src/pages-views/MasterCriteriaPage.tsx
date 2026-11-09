'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Criterion, SubCriterion } from '../types';
import { 
  Sliders, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Scale, 
  Layers, 
  RefreshCw,
  Plus,
  X
} from 'lucide-react';

export const MasterCriteriaPage: React.FC = () => {
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Criteria Modal State
  const [isCriteriaModalOpen, setIsCriteriaModalOpen] = useState<boolean>(false);
  const [editingCriterion, setEditingCriterion] = useState<Criterion | null>(null);
  const [critCode, setCritCode] = useState<string>('');
  const [critName, setCritName] = useState<string>('');
  const [critType, setCritType] = useState<'benefit' | 'cost'>('benefit');
  const [critRawWeight, setCritRawWeight] = useState<number>(20);
  const [critDesc, setCritDesc] = useState<string>('');

  // Sub-Criteria Modal State
  const [isSubModalOpen, setIsSubModalOpen] = useState<boolean>(false);
  const [selectedParentCriterion, setSelectedParentCriterion] = useState<Criterion | null>(null);
  const [editingSub, setEditingSub] = useState<SubCriterion | null>(null);
  const [subLabel, setSubLabel] = useState<string>('');
  const [subScore, setSubScore] = useState<number>(100);

  // Fast Weight Normalizer Modal
  const [isWeightModalOpen, setIsWeightModalOpen] = useState<boolean>(false);
  const [fastWeights, setFastWeights] = useState<{ id: number; raw_weight: number }[]>([]);

  const fetchCriteria = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/criteria');
      if (res.data.success) {
        setCriteria(res.data.data);
        setFastWeights(res.data.data.map((c: Criterion) => ({ id: c.id, raw_weight: Number(c.raw_weight) })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCriteria();
  }, []);

  const totalRawWeight = criteria.reduce((acc, c) => acc + Number(c.raw_weight), 0);
  const totalNormalized = criteria.reduce((acc, c) => acc + Number(c.normalized_weight), 0);

  // ==========================================
  // CRITERIA HANDLERS
  // ==========================================
  const handleOpenCreateCriterion = () => {
    setEditingCriterion(null);
    setCritCode(`C${criteria.length + 1}`);
    setCritName('');
    setCritType('benefit');
    setCritRawWeight(20);
    setCritDesc('');
    setIsCriteriaModalOpen(true);
  };

  const handleOpenEditCriterion = (c: Criterion) => {
    setEditingCriterion(c);
    setCritCode(c.code);
    setCritName(c.name);
    setCritType(c.type);
    setCritRawWeight(Number(c.raw_weight));
    setCritDesc(c.description || '');
    setIsCriteriaModalOpen(true);
  };

  const handleSaveCriterion = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      if (editingCriterion) {
        const res = await api.put(`/criteria/${editingCriterion.id}`, {
          code: critCode,
          name: critName,
          type: critType,
          raw_weight: critRawWeight,
          description: critDesc,
        });
        if (res.data.success) {
          setMsg({ type: 'success', text: res.data.message });
          setIsCriteriaModalOpen(false);
          fetchCriteria();
        }
      } else {
        const res = await api.post('/criteria', {
          code: critCode,
          name: critName,
          type: critType,
          raw_weight: critRawWeight,
          description: critDesc,
        });
        if (res.data.success) {
          setMsg({ type: 'success', text: res.data.message });
          setIsCriteriaModalOpen(false);
          fetchCriteria();
        }
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Gagal menyimpan kriteria.' });
    }
  };

  const handleDeleteCriterion = async (c: Criterion) => {
    if (!window.confirm(`Yakin ingin menghapus Kriteria ${c.code} (${c.name})? Seluruh bobot kriteria lainnya akan otomatis dinormalisasi ulang.`)) {
      return;
    }
    try {
      const res = await api.delete(`/criteria/${c.id}`);
      if (res.data.success) {
        setMsg({ type: 'success', text: res.data.message });
        fetchCriteria();
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Gagal menghapus kriteria.' });
    }
  };

  // ==========================================
  // SUB-CRITERIA HANDLERS
  // ==========================================
  const handleOpenCreateSub = (parent: Criterion) => {
    setSelectedParentCriterion(parent);
    setEditingSub(null);
    setSubLabel('');
    setSubScore(100);
    setIsSubModalOpen(true);
  };

  const handleOpenEditSub = (parent: Criterion, sub: SubCriterion) => {
    setSelectedParentCriterion(parent);
    setEditingSub(sub);
    setSubLabel(sub.label);
    setSubScore(Number(sub.score_value));
    setIsSubModalOpen(true);
  };

  const handleSaveSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParentCriterion) return;
    setMsg(null);

    try {
      if (editingSub) {
        const res = await api.put(`/sub-criteria/${editingSub.id}`, {
          label: subLabel,
          score_value: subScore,
        });
        if (res.data.success) {
          setMsg({ type: 'success', text: res.data.message });
          setIsSubModalOpen(false);
          fetchCriteria();
        }
      } else {
        const res = await api.post(`/criteria/${selectedParentCriterion.id}/sub-criteria`, {
          label: subLabel,
          score_value: subScore,
        });
        if (res.data.success) {
          setMsg({ type: 'success', text: res.data.message });
          setIsSubModalOpen(false);
          fetchCriteria();
        }
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Gagal menyimpan sub-kriteria.' });
    }
  };

  const handleDeleteSub = async (sub: SubCriterion) => {
    if (!window.confirm(`Hapus parameter sub-kriteria "${sub.label}"?`)) return;
    try {
      const res = await api.delete(`/sub-criteria/${sub.id}`);
      if (res.data.success) {
        setMsg({ type: 'success', text: res.data.message });
        fetchCriteria();
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Gagal menghapus sub-kriteria.' });
    }
  };

  // ==========================================
  // FAST WEIGHT NORMALIZATION
  // ==========================================
  const handleSaveFastWeights = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/criteria/weights', { weights: fastWeights });
      if (res.data.success) {
        setMsg({ type: 'success', text: res.data.message });
        setIsWeightModalOpen(false);
        fetchCriteria();
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: 'Gagal memperbarui bobot kriteria.' });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-slate-200/90 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-emerald-700" />
              Modul Master SPK Dinamis
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Master Kriteria & Sub-Kriteria SMART
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Kelola parameter kriteria multi-atribut, ubah bobot penilaian dengan normalisasi otomatis ($\sum w_j = 1.0$), serta sesuaikan skala batas sub-kriteria.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsWeightModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition"
          >
            <Sliders className="w-4 h-4 text-slate-600" />
            <span>Normalisasi Bobot Cepat</span>
          </button>

          <button
            onClick={handleOpenCreateCriterion}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm hover:shadow transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Tambah Kriteria Baru</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[11px]">Jumlah Kriteria Aktif</span>
            <span className="font-black text-2xl text-slate-900">{criteria.length} Kriteria</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[11px]">Total Bobot Awal (Σ Wj)</span>
            <span className="font-black text-2xl text-slate-900">{totalRawWeight.toFixed(0)}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 font-bold">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[11px]">Status Normalisasi (Σ wj)</span>
            <span className="font-black text-2xl text-emerald-800">{totalNormalized.toFixed(2)} (100%)</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Message Alert */}
      {msg && (
        <div className={`p-4 rounded-2xl border text-sm font-semibold flex items-center gap-3 ${
          msg.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-rose-50 border-rose-300 text-rose-800'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
          {msg.text}
        </div>
      )}

      {/* Criteria & Sub-Criteria Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {criteria.map((c) => (
          <div 
            key={c.id} 
            className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 hover:border-emerald-500/50 hover:shadow-md transition space-y-5 flex flex-col justify-between"
          >
            <div className="space-y-4">
              
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-base text-emerald-900 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                    {c.code}
                  </span>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 leading-snug">{c.name}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">{c.description || 'Tidak ada deskripsi'}</p>
                  </div>
                </div>

                <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                  c.type === 'benefit' 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  Tipe: {c.type}
                </span>
              </div>

              {/* Weight Highlights */}
              <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Bobot Awal (Wj)</span>
                  <span className="font-bold text-lg text-slate-900">{Number(c.raw_weight).toFixed(0)}</span>
                </div>

                <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200">
                  <span className="text-emerald-800 block text-[10px] uppercase font-bold">Bobot Ternormalisasi (wj)</span>
                  <span className="font-extrabold text-lg text-emerald-900">{Number(c.normalized_weight).toFixed(4)} ({Math.round(Number(c.normalized_weight) * 100)}%)</span>
                </div>
              </div>

              {/* Sub-Criteria Section */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Parameter Skala Sub-Kriteria ({c.sub_criteria?.length || 0}):
                  </span>
                  <button
                    onClick={() => handleOpenCreateSub(c)}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Sub
                  </button>
                </div>

                <div className="space-y-1.5">
                  {c.sub_criteria && c.sub_criteria.length > 0 ? (
                    c.sub_criteria.map((sub) => (
                      <div 
                        key={sub.id} 
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 transition text-xs"
                      >
                        <span className="text-slate-700 font-medium">{sub.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                            {Number(sub.score_value).toFixed(0)}
                          </span>
                          <button
                            onClick={() => handleOpenEditSub(c, sub)}
                            className="p-1 text-slate-400 hover:text-slate-800 transition"
                            title="Edit Sub-Kriteria"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSub(sub)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                            title="Hapus Sub-Kriteria"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-3 bg-slate-50 rounded-xl text-slate-400 text-xs italic">
                      Belum ada parameter sub-kriteria
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Card Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => handleOpenEditCriterion(c)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Kriteria
              </button>

              <button
                onClick={() => handleDeleteCriterion(c)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* ========================================== */}
      {/* MODAL 1: CREATE / EDIT CRITERION */}
      {/* ========================================== */}
      {isCriteriaModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-lg text-white">
                  {editingCriterion ? `Edit Kriteria ${editingCriterion.code}` : 'Tambah Kriteria Baru'}
                </h3>
                <p className="text-xs text-emerald-200">Normalisasi bobot dieksekusi otomatis oleh sistem</p>
              </div>
              <button onClick={() => setIsCriteriaModalOpen(false)} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCriterion} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Kode</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={critCode}
                    onChange={(e) => setCritCode(e.target.value)}
                    placeholder="C1, C2..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 uppercase"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 uppercase mb-1">Tipe Sifat</label>
                  <select
                    value={critType}
                    onChange={(e) => setCritType(e.target.value as 'benefit' | 'cost')}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-800"
                  >
                    <option value="benefit">Benefit (Semakin Besar Semakin Baik)</option>
                    <option value="cost">Cost (Semakin Kecil Semakin Baik)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Nama Kriteria</label>
                <input
                  type="text"
                  required
                  value={critName}
                  onChange={(e) => setCritName(e.target.value)}
                  placeholder="Contoh: Sisa Take Home Pay (THP)"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Bobot Awal (Wj)</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={100}
                  step={1}
                  value={critRawWeight}
                  onChange={(e) => setCritRawWeight(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold text-emerald-900"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Nilai bobot mentah sebelum normalisasi (misal: 30, 20, 15).
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Deskripsi / Penjelasan</label>
                <textarea
                  rows={2}
                  value={critDesc}
                  onChange={(e) => setCritDesc(e.target.value)}
                  placeholder="Keterangan tolok ukur kriteria ini..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCriteriaModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm transition-all"
                >
                  Simpan Kriteria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2: CREATE / EDIT SUB-CRITERION */}
      {/* ========================================== */}
      {isSubModalOpen && selectedParentCriterion && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-lg text-white">
                  {editingSub ? 'Edit Sub-Kriteria' : 'Tambah Sub-Kriteria'}
                </h3>
                <p className="text-xs text-emerald-200">Untuk Kriteria: {selectedParentCriterion.code} - {selectedParentCriterion.name}</p>
              </div>
              <button onClick={() => setIsSubModalOpen(false)} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSub} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Label / Kondisi Parameter</label>
                <input
                  type="text"
                  required
                  value={subLabel}
                  onChange={(e) => setSubLabel(e.target.value)}
                  placeholder="Contoh: Sisa THP ≥ 60% atau Pegawai Tetap > 5 Tahun"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Nilai Skala Parameter (Score)</label>
                <select
                  value={subScore}
                  onChange={(e) => setSubScore(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold text-emerald-900 text-sm"
                >
                  <option value={100}>100 (Sangat Baik / Tertinggi)</option>
                  <option value={75}>75 (Baik / Menengah Atas)</option>
                  <option value={50}>50 (Cukup / Menengah)</option>
                  <option value={25}>25 (Kurang / Terendah)</option>
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Nilai skala standar SMART: 25, 50, 75, atau 100.
                </span>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSubModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm transition-all"
                >
                  Simpan Sub-Kriteria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 3: FAST WEIGHT NORMALIZATION */}
      {/* ========================================== */}
      {isWeightModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-lg text-white">Normalisasi Bobot Kriteria Cepat</h3>
                <p className="text-xs text-emerald-200">Sistem otomatis menghitung wj = Wj / Σ Wk</p>
              </div>
              <button onClick={() => setIsWeightModalOpen(false)} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFastWeights} className="p-6 space-y-3 text-xs">
              {criteria.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <span className="font-black text-emerald-800 text-sm">{c.code}</span> - <span className="font-bold text-slate-800">{c.name}</span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={fastWeights.find(w => w.id === c.id)?.raw_weight || c.raw_weight}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setFastWeights(fastWeights.map(w => w.id === c.id ? { ...w, raw_weight: val } : w));
                    }}
                    className="w-16 p-2 rounded-xl border border-slate-300 font-bold text-center text-sm font-mono"
                  />
                </div>
              ))}

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsWeightModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm transition-all"
                >
                  Terapkan &amp; Normalisasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
