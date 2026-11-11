import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== 'ketua_koperasi') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const loanId = parseInt(id);

    const loan = await prisma.loanApplication.findUnique({
      where: { id: loanId },
      include: { user: true },
    });

    if (!loan) {
      return NextResponse.json({ success: false, message: 'Data tidak ditemukan' }, { status: 404 });
    }

    const now = new Date();
    const updated = await prisma.loanApplication.update({
      where: { id: loanId },
      data: {
        status: 'disbursed',
        disbursed_at: now,
      },
    });

    // Generate monthly installments schedule
    const tenor = loan.tenor_bulan;
    const monthlyAmount = Math.round(loan.nominal_pengajuan / tenor);

    // Delete any existing installments
    await prisma.loanInstallment.deleteMany({
      where: { loan_application_id: loanId },
    });

    for (let i = 1; i <= tenor; i++) {
      const dueDate = new Date(now);
      dueDate.setMonth(dueDate.getMonth() + i);
      // Set to 25th of month (standard cut-off penggajian Al-Azhar)
      dueDate.setDate(25);

      const kodeUnik = loan.metode_pembayaran === 'transfer_manual'
        ? ((loanId * 17 + i * 7) % 899 + 101)
        : 0;

      await prisma.loanInstallment.create({
        data: {
          loan_application_id: loanId,
          angsuran_ke: i,
          jatuh_tempo: dueDate,
          nominal_angsuran: monthlyAmount,
          kode_unik: kodeUnik,
          metode_bayar: loan.metode_pembayaran || 'potong_gaji',
          status: 'unpaid',
        },
      });
    }

    // Notify member
    await prisma.notification.create({
      data: {
        user_id: loan.user_id,
        title: 'Pencairan Dana Berhasil',
        message: `Dana pinjaman ${loan.nomor_pengajuan} sebesar Rp ${loan.nominal_pengajuan.toLocaleString('id-ID')} telah dicairkan ke rekening Bank Muamalat Anda.`,
        type: 'installment',
        link: `/loans/${loan.id}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Dana pinjaman berhasil dicairkan dan jadwal angsuran terbentuk',
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}
