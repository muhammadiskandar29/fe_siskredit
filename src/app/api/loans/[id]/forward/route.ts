import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

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

    const loan = await prisma.loanApplication.update({
      where: { id: loanId },
      data: { status: 'forwarded_to_chairman' },
      include: { user: true },
    });

    // Notify Ketua Koperasi
    const ketuaUsers = await prisma.user.findMany({
      where: { role: 'ketua_koperasi' },
    });
    for (const k of ketuaUsers) {
      await prisma.notification.create({
        data: {
          user_id: k.id,
          title: 'Pengajuan Siap Approval',
          message: `Permohonan pinjaman ${loan.nomor_pengajuan} atas nama ${loan.user.name} telah selesai dinilai dan siap diotorisasi.`,
          type: 'loan',
          link: `/approvals/${loan.id}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Permohonan pinjaman berhasil diteruskan ke Ketua Koperasi',
      data: loan,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}
