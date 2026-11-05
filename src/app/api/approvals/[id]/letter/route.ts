import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
    }

    const { id } = await params;
    const loanId = parseInt(id);

    const loan = await prisma.loanApplication.findUnique({
      where: { id: loanId },
      include: {
        user: true,
        evaluation: true,
      },
    });

    if (!loan) {
      return NextResponse.json({ success: false, message: 'Data tidak ditemukan' }, { status: 404 });
    }

    const letterData = {
      letter_number: `SK-KREDIT/${new Date().getFullYear()}/${String(loan.id).padStart(4, '0')}`,
      date: (loan.approved_at || new Date()).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      cooperative_name: 'Koperasi Konsumen Karyawan Perguruan Al-Azhar BSD',
      applicant: {
        name: loan.user.name,
        nik: loan.user.nik,
        unit_kerja: loan.user.unit_kerja || 'LAKHAR',
        status_pegawai: loan.user.status_pegawai || 'Pegawai Tetap',
        masa_kerja: `${loan.user.masa_kerja_tahun || 5} Tahun`,
      },
      loan_details: {
        approved_nominal: loan.nominal_pengajuan,
        approved_tenor: loan.tenor_bulan,
        keperluan: loan.tujuan_pinjaman,
        no_rekening: loan.user.no_rekening_muamalat || '3910000280',
        nama_rekening: loan.user.nama_rekening || loan.user.name,
      },
      smart_score: loan.evaluation?.final_score || 85.5,
      smart_recommendation: loan.evaluation?.recommendation || 'Sangat Layak (Disetujui Penuh)',
      verification_token: loan.verification_token,
      verification_url: `https://kopkar-alazhar-bsd.org/verify/${loan.verification_token}`,
      approver: {
        name: 'Arrizal Muhaemin Yunus, M.Pd',
        title: 'Ketua Koperasi Karyawan Al-Azhar BSD',
      },
    };

    return NextResponse.json({
      success: true,
      data: letterData,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}
