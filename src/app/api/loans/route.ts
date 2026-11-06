import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (user.role === 'anggota') {
      where.user_id = user.id;
    }
    if (status) {
      where.status = status;
    }

    let formatted: any[] = [];
    try {
      const loans = await prisma.loanApplication.findMany({
        where,
        include: {
          user: true,
          documents: true,
          evaluation: true,
          approvalLogs: {
            include: { approver: true },
          },
        },
        orderBy: { id: 'desc' },
      });

      // Format fields for frontend compatibility
      formatted = loans.map((loan) => ({
        ...loan,
        application_number: loan.nomor_pengajuan,
        keperluan_pinjaman: loan.tujuan_pinjaman,
        verification_notes: loan.catat_verifikasi,
        approval_notes: loan.catat_approval,
        smart_evaluation: loan.evaluation,
        logs: loan.approvalLogs,
      }));
    } catch (dbErr) {
      const { DEMO_LOANS } = await import('@/lib/demoData');
      if (user.role === 'anggota') {
        formatted = DEMO_LOANS.filter((l) => l.user_id === user.id);
      } else {
        formatted = DEMO_LOANS;
      }
    }

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error('Error fetching loans:', error);
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}


export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
    }

    const body = await req.json();
    const {
      nominal_pengajuan,
      tenor_bulan,
      keperluan_pinjaman,
      no_rekening_muamalat,
      nama_rekening,
      sisa_thp_persen,
      simpanan_wajib,
      documents,
    } = body;

    const count = await prisma.loanApplication.count();
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const appNumber = `PINJ-${yearMonth}-${String(count + 1).padStart(3, '0')}`;
    const verificationToken = `TOKEN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const loan = await prisma.loanApplication.create({
      data: {
        user_id: user.id,
        nomor_pengajuan: appNumber,
        nominal_pengajuan: parseFloat(nominal_pengajuan),
        tenor_bulan: parseInt(tenor_bulan),
        tujuan_pinjaman: keperluan_pinjaman || 'Kebutuhan Pribadi / Multiguna',
        sisa_thp_persen: parseFloat(sisa_thp_persen || '50'),
        simpanan_wajib: parseFloat(simpanan_wajib || '2500000'),
        status_pegawai: user.status_pegawai || 'TETAP',
        masa_kerja_tahun: user.masa_kerja_tahun || 5,
        riwayat_pinjaman: 'Lancar / Anggota Baru',
        status: 'pending',
        verification_token: verificationToken,
      },
    });

    // Save attached documents (if any)
    if (documents && Array.isArray(documents)) {
      for (const doc of documents) {
        if (doc && doc.base64) {
          await prisma.loanDocument.create({
            data: {
              loan_application_id: loan.id,
              document_type: doc.type || 'dokumen_pendukung',
              file_path: doc.base64,
              original_filename: doc.name || 'document.pdf',
            },
          });
        }
      }
    }

    // Create notification for Petugas Simpin
    const petugasUsers = await prisma.user.findMany({
      where: { role: 'petugas_simpin' },
    });
    for (const p of petugasUsers) {
      await prisma.notification.create({
        data: {
          user_id: p.id,
          title: 'Pengajuan Pinjaman Baru',
          message: `Anggota ${user.name} mengajukan pinjaman sebesar Rp ${Number(nominal_pengajuan).toLocaleString('id-ID')}`,
          type: 'loan',
          link: `/loans/${loan.id}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Permohonan pinjaman berhasil diajukan',
      data: loan,
    });
  } catch (error: any) {
    console.error('Error creating loan:', error);
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}
