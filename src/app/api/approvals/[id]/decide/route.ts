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
    const body = await req.json();
    const { decision, approved_nominal, approved_tenor, approval_notes } = body;

    const loan = await prisma.loanApplication.findUnique({
      where: { id: loanId },
      include: { user: true },
    });

    if (!loan) {
      return NextResponse.json({ success: false, message: 'Data tidak ditemukan' }, { status: 404 });
    }

    const isApproved = decision === 'approved';
    const now = new Date();
    const token = `KOPKAR-${Math.random().toString(36).substring(2, 12).toUpperCase()}-${String(loanId).padStart(4, '0')}`;

    const updated = await prisma.loanApplication.update({
      where: { id: loanId },
      data: {
        status: isApproved ? 'approved' : 'rejected',
        catat_approval: approval_notes || (isApproved ? 'Disetujui Ketua Koperasi' : 'Ditolak Ketua Koperasi'),
        verification_token: isApproved ? token : loan.verification_token,
        approved_at: isApproved ? now : null,
      },
    });

    // Create Approval Log
    await prisma.approvalLog.create({
      data: {
        loan_application_id: loanId,
        approver_id: user.id,
        action: isApproved ? 'approve' : 'reject',
        notes: approval_notes,
      },
    });

    // Notify applicant
    await prisma.notification.create({
      data: {
        user_id: loan.user_id,
        title: isApproved ? 'Permohonan Pinjaman Disetujui' : 'Permohonan Pinjaman Ditolak',
        message: isApproved
          ? `Selamat! Permohonan pinjaman ${loan.nomor_pengajuan} telah disetujui resmi oleh Ketua Koperasi.`
          : `Mohon maaf, permohonan pinjaman ${loan.nomor_pengajuan} belum dapat disetujui.`,
        type: isApproved ? 'success' : 'danger',
        link: `/loans/${loan.id}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: isApproved
        ? 'Permohonan berhasil disetujui secara digital'
        : 'Permohonan berhasil ditolak',
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}
