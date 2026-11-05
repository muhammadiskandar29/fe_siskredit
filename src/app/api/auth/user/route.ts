import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthenticated' },
        { status: 401 }
      );
    }

    const permissions =
      user.role === 'petugas_simpin'
        ? ['manage_criteria', 'calculate_smart', 'verify_documents', 'view_reports', 'manage_users']
        : user.role === 'ketua_koperasi'
        ? ['approve_loans', 'disburse_funds', 'view_reports']
        : ['apply_loan', 'view_my_loans', 'view_installments'];

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          nik: user.nik,
          name: user.name,
          email: user.email,
          role: user.role,
          unit_kerja: user.unit_kerja,
          status_pegawai: user.status_pegawai,
          masa_kerja_tahun: user.masa_kerja_tahun,
          no_hp: user.no_hp,
          no_rekening_muamalat: user.no_rekening_muamalat,
          nama_rekening: user.nama_rekening,
        },
        permissions,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Server Error' },
      { status: 500 }
    );
  }
}
