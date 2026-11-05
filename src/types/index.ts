export type UserRole = 'anggota' | 'petugas_simpin' | 'ketua_koperasi';

export interface User {
  id: number;
  nik: string;
  name: string;
  email: string;
  role: UserRole;
  unit_kerja?: string;
  status_pegawai?: string;
  masa_kerja_tahun?: number;
  no_hp?: string;
  no_rekening_muamalat?: string;
  nama_rekening?: string;
  simpanan_wajib?: number;
  sisa_thp_persen?: number;
}

export interface Permission {
  id: number;
  name: string;
  group: string;
  display_name: string;
  description?: string;
}

export interface Role {
  id: number;
  name: UserRole;
  display_name: string;
  description?: string;
  permissions?: Permission[];
}

export interface SubCriterion {
  id: number;
  criterion_id: number;
  label: string;
  score_value: number;
  order_num: number;
}

export interface Criterion {
  id: number;
  code: string; // C1, C2, C3, C4, C5
  name: string;
  type: 'benefit' | 'cost';
  raw_weight: number;
  normalized_weight: number;
  description?: string;
  order_num: number;
  sub_criteria?: SubCriterion[];
}

export interface SmartEvaluation {
  id: number;
  loan_application_id?: number | null;
  alternative_code: string;
  is_manual_simulation?: boolean;
  candidate_name?: string;
  candidate_nik?: string;
  candidate_unit?: string;
  candidate_plafon?: number;
  val_c1: number;
  val_c2: number;
  val_c3: number;
  val_c4: number;
  val_c5: number;
  utility_c1: number;
  utility_c2: number;
  utility_c3: number;
  utility_c4: number;
  utility_c5: number;
  final_score: number;
  recommendation: string;
  rank: number;
  calculated_at: string;
  dynamic_scores?: Record<string, number>;
  loan_application?: LoanApplication;
}

export interface LoanDocument {
  id: number;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size?: string;
  mime_type?: string;
}

export interface ApprovalLog {
  id: number;
  loan_application_id: number;
  user_id: number;
  action: string;
  previous_status?: string;
  new_status: string;
  notes?: string;
  created_at: string;
  user?: User;
}

export interface LoanApplication {
  id: number;
  application_number: string;
  user_id: number;
  nominal_pengajuan: number;
  tenor_bulan: number;
  keperluan_pinjaman: string;
  no_rekening_muamalat: string;
  nama_rekening: string;
  sisa_thp_persen: number;
  simpanan_wajib: number;
  status_pegawai: string;
  masa_kerja_tahun: number;
  riwayat_pinjaman: string;
  status: 'draft' | 'pending' | 'verified' | 'revision_required' | 'smart_calculated' | 'forwarded_to_chairman' | 'approved' | 'rejected' | 'disbursed';
  verification_notes?: string;
  verified_at?: string;
  verified_by?: number;
  final_decision?: 'approved' | 'rejected';
  approved_nominal?: number;
  approved_tenor?: number;
  approval_notes?: string;
  letter_number?: string;
  approved_at?: string;
  approved_by?: number;
  disbursed_at?: string;
  disbursed_by?: number;
  disbursed_amount?: number;
  disbursement_ref_number?: string;
  disbursement_notes?: string;
  created_at: string;
  user?: User;
  documents?: LoanDocument[];
  smart_evaluation?: SmartEvaluation;
  logs?: ApprovalLog[];
  verifier?: User;
  approver?: User;
  disburser?: User;
}
