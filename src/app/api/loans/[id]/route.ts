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
    const loan = await prisma.loanApplication.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: true,
        documents: true,
        evaluation: true,
        approvalLogs: {
          include: { approver: true },
        },
      },
    });

    if (!loan) {
      return NextResponse.json({ success: false, message: 'Data tidak ditemukan' }, { status: 404 });
    }

    const formatted = {
      ...loan,
      application_number: loan.nomor_pengajuan,
      keperluan_pinjaman: loan.tujuan_pinjaman,
      verification_notes: loan.catat_verifikasi,
      approval_notes: loan.catat_approval,
      smart_evaluation: loan.evaluation,
      logs: loan.approvalLogs,
    };

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}
