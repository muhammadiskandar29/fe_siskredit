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

    if (!loan) {
      return NextResponse.json({ success: false, message: 'Data pinjaman tidak ditemukan' }, { status: 404 });
    }

    const principal = (loan as any).approved_nominal || loan.nominal_pengajuan;
    const tenor = (loan as any).approved_tenor || loan.tenor_bulan;
    const totalInterest = Math.round(principal * 0.01 * tenor);
    const totalRepayment = principal + totalInterest;
    const monthlyAmount = tenor > 0 ? Math.round(totalRepayment / tenor) : 0;

    // Normalizing installments to support both camelCase and snake_case
    const formattedInstallments = installments.map((i) => ({
      id: i.id,
      loan_application_id: i.loan_application_id,
      installment_number: i.angsuran_ke,
      angsuran_ke: i.angsuran_ke,
      due_date: i.jatuh_tempo.toISOString(),
      jatuh_tempo: i.jatuh_tempo.toISOString(),
      amount: i.nominal_angsuran,
      nominal_angsuran: i.nominal_angsuran,
      kode_unik: i.kode_unik || 0,
      total_with_code: i.nominal_angsuran + (i.kode_unik || 0),
      metode_bayar: i.metode_bayar || loan.metode_pembayaran || 'potong_gaji',
      status: i.status === 'paid' ? 'lunas' : i.status === 'pending_verification' ? 'menunggu_konfirmasi' : 'belum_lunas',
      raw_status: i.status,
      payment_proof_path: i.bukti_transfer,
      paid_at: i.paid_at ? i.paid_at.toISOString() : null,
      confirmed_at: i.confirmed_at ? i.confirmed_at.toISOString() : null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        loan_id: loan.id,
        application_number: loan.nomor_pengajuan,
        nomor_pengajuan: loan.nomor_pengajuan,
        applicant_name: loan.user?.name || '',
        nominal: principal,
        tenor: tenor,
        monthly_amount: monthlyAmount,
        total_interest: totalInterest,
        total_repayment: totalRepayment,
        metode_pembayaran: loan.metode_pembayaran || 'potong_gaji',
        status_pegawai: loan.status_pegawai || loan.user?.status_pegawai || 'tetap',
        loan,
        installments: formattedInstallments,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}
