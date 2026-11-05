import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { SmartEngineService } from '@/lib/smartEngine';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== 'petugas_simpin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const loanId = parseInt(id);
    const body = await req.json();
    const { val_c1, val_c2, val_c3, val_c4 } = body;

    const loan = await prisma.loanApplication.findUnique({
      where: { id: loanId },
    });

    if (!loan) {
      return NextResponse.json({ success: false, message: 'Pinjaman tidak ditemukan' }, { status: 404 });
    }

    const count = await prisma.smartEvaluation.count();
    const altCode = `A${count + 1}`;

    const evaluation = await SmartEngineService.calculateWithAssessedValues(
      loanId,
      loan.nominal_pengajuan,
      parseFloat(val_c1 ?? 75),
      parseFloat(val_c2 ?? 75),
      parseFloat(val_c3 ?? 75),
      parseFloat(val_c4 ?? 75),
      altCode
    );

    // Update status to smart_calculated
    await prisma.loanApplication.update({
      where: { id: loanId },
      data: { status: 'smart_calculated' },
    });

    return NextResponse.json({
      success: true,
      message: 'Penilaian SMART berhasil dihitung',
      data: evaluation,
    });
  } catch (error: any) {
    console.error('Error assessing smart:', error);
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}
