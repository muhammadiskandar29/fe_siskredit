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
    const installments = await prisma.loanInstallment.findMany({
      where: { loan_application_id: parseInt(id) },
      orderBy: { angsuran_ke: 'asc' },
    });

    const loan = await prisma.loanApplication.findUnique({
      where: { id: parseInt(id) },
      include: { user: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        loan,
        installments,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}
