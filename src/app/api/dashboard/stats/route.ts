import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
    }

    if (user.role === 'anggota') {
      const myLoans = await prisma.loanApplication.findMany({
        where: { user_id: user.id },
        orderBy: { id: 'desc' },
      });

      return NextResponse.json({
        success: true,
        data: {
          role: 'anggota',
          total_applications: myLoans.length,
          active_loans: myLoans.filter((l) => l.status === 'approved' || l.status === 'disbursed').length,
          pending_loans: myLoans.filter((l) => ['pending', 'verified', 'smart_calculated', 'forwarded_to_chairman'].includes(l.status)).length,
          rejected_loans: myLoans.filter((l) => l.status === 'rejected').length,
          latest_application: myLoans[0] || null,
        },
      });
    }

    // Admin / Ketua Koperasi
    const allLoans = await prisma.loanApplication.findMany({
      include: { user: true },
    });
    const evaluations = await prisma.smartEvaluation.findMany({
      where: { is_delete: 0 },
    });
    const totalMembers = await prisma.user.count({
      where: { role: 'anggota' },
    });

    return NextResponse.json({
      success: true,
      data: {
        role: user.role,
        total_members: totalMembers,
        total_applications: allLoans.length,
        pending_verification: allLoans.filter((l) => l.status === 'pending').length,
        ready_for_approval: allLoans.filter((l) => l.status === 'smart_calculated' || l.status === 'forwarded_to_chairman').length,
        total_approved: allLoans.filter((l) => l.status === 'approved' || l.status === 'disbursed').length,
        total_rejected: allLoans.filter((l) => l.status === 'rejected').length,
        total_approved_amount: allLoans
          .filter((l) => l.status === 'approved' || l.status === 'disbursed')
          .reduce((sum, l) => sum + l.nominal_pengajuan, 0),
        smart_summary: {
          highly_recommended: evaluations.filter((e) => e.final_score >= 75.0).length,
          conditional: evaluations.filter((e) => e.final_score >= 50.0 && e.final_score < 75.0).length,
          not_recommended: evaluations.filter((e) => e.final_score < 50.0).length,
        },
      },
    });
  } catch (error: any) {
    if (error?.digest === 'NEXT_PRERENDER_INTERRUPTED') {
      throw error;
    }
    console.error('Stats error:', error);
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}
