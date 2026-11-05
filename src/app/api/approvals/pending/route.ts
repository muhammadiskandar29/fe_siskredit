import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== 'ketua_koperasi') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const loans = await prisma.loanApplication.findMany({
      where: {
        status: {
          in: ['forwarded_to_chairman', 'smart_calculated', 'verified', 'approved', 'disbursed'],
        },
      },
      include: {
        user: true,
        evaluation: true,
        documents: true,
      },
      orderBy: { id: 'desc' },
    });

    const formatted = loans.map((loan) => ({
      ...loan,
      application_number: loan.nomor_pengajuan,
      keperluan_pinjaman: loan.tujuan_pinjaman,
      smart_evaluation: loan.evaluation,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}
