import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
    }

    const criteria = await prisma.criterion.findMany({
      orderBy: { order_num: 'asc' },
    });

    const evaluations = await prisma.smartEvaluation.findMany({
      where: { is_delete: 0 },
      include: {
        loanApplication: {
          include: { user: true },
        },
      },
      orderBy: { rank: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: {
        criteria,
        evaluations,
        summary: {
          total_applicants: evaluations.length,
          highly_recommended: evaluations.filter((e) => e.final_score >= 75.0).length,
          conditional: evaluations.filter((e) => e.final_score >= 50.0 && e.final_score < 75.0).length,
          not_recommended: evaluations.filter((e) => e.final_score < 50.0).length,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}
