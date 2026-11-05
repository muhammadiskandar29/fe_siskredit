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
    const { notes } = await req.json();

    const loan = await prisma.loanApplication.update({
      where: { id: loanId },
      data: {
        status: 'revision_required',
        catat_verifikasi: notes,
      },
      include: { user: true },
    });

    // Notify member
    await prisma.notification.create({
      data: {
        user_id: loan.user_id,
        title: 'Revisi Dokumen Diperlukan',
        message: `Catatan verifikator: "${notes || 'Mohon lengkapi berkas persyaratan'}"`,
        type: 'warning',
        link: `/loans/${loan.id}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Permintaan revisi berhasil dikirim ke anggota pemohon',
      data: loan,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}
