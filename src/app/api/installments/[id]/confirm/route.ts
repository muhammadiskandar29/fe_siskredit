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
    const installmentId = parseInt(id);

    const installment = await prisma.loanInstallment.update({
      where: { id: installmentId },
      data: {
        status: 'paid',
        confirmed_at: new Date(),
      },
      include: {
        loanApplication: {
          include: { user: true },
        },
      },
    });

    // Notify member
    await prisma.notification.create({
      data: {
        user_id: installment.loanApplication.user_id,
        title: 'Angsuran Berhasil Dikonfirmasi',
        message: `Pembayaran angsuran ke-${installment.angsuran_ke} sebesar Rp ${installment.nominal_angsuran.toLocaleString('id-ID')} telah dikonfirmasi sah lunas oleh petugas simpin.`,
        type: 'success',
        link: `/loans/${installment.loan_application_id}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Pembayaran angsuran berhasil dikonfirmasi lunas',
      data: installment,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}
