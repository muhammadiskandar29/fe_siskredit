import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== 'petugas_simpin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const pending = await prisma.loanInstallment.findMany({
      where: { status: 'pending_verification' },
      include: {
        loanApplication: {
          include: { user: true },
        },
      },
      orderBy: { id: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: pending,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}
