import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
    }

    const { id } = await params;
    const installmentId = parseInt(id);
    const body = await req.json().catch(() => ({}));
    const { bukti_transfer } = body;

    const installment = await prisma.loanInstallment.update({
      where: { id: installmentId },
      data: {
        status: 'pending_verification',
        bukti_transfer: bukti_transfer || null,
        paid_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Bukti pembayaran angsuran berhasil diunggah. Menunggu verifikasi petugas.',
      data: installment,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}
