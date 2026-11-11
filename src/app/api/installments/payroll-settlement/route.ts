import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || (user.role !== 'petugas_simpin' && user.role !== 'ketua_koperasi')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    // Find all disbursed loans with potong_gaji
    const loans = await prisma.loanApplication.findMany({
      where: {
        status: { in: ['disbursed', 'approved'] },
        metode_pembayaran: 'potong_gaji',
      },
      include: {
        user: true,
        installments: {
          orderBy: { angsuran_ke: 'asc' },
        },
      },
      orderBy: { id: 'asc' },
    });

    const items = [];
    let totalNominal = 0;
    let totalLunas = 0;
    let totalBelumLunas = 0;

    for (const loan of loans) {
      // Find installment matching month and year or next unpaid
      const inst = loan.installments.find((ins) => {
        const d = new Date(ins.jatuh_tempo);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
      }) || loan.installments.find(ins => ins.status === 'unpaid');

      if (inst) {
        totalNominal += inst.nominal_angsuran;
        if (inst.status === 'paid') {
          totalLunas++;
        } else {
          totalBelumLunas++;
        }

        items.push({
          installment_id: inst.id,
          loan_id: loan.id,
          nomor_pengajuan: loan.nomor_pengajuan,
          user_id: loan.user_id,
          nama: loan.user.name,
          nik: loan.user.nik,
          unit_kerja: loan.user.unit_kerja || 'Unit LAKHAR',
          rekening_muamalat: loan.user.no_rekening_muamalat || '-',
          angsuran_ke: inst.angsuran_ke,
          total_tenor: loan.tenor_bulan,
          nominal_angsuran: inst.nominal_angsuran,
          jatuh_tempo: inst.jatuh_tempo,
          status: inst.status,
          paid_at: inst.paid_at,
          confirmed_at: inst.confirmed_at,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        periode_bulan: month,
        periode_tahun: year,
        total_peminjam: items.length,
        total_nominal: totalNominal,
        total_lunas: totalLunas,
        total_belum_lunas: totalBelumLunas,
        items,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== 'petugas_simpin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { installment_ids, month, year, catatan_settlement } = body;

    const now = new Date();
    let updatedCount = 0;

    if (Array.isArray(installment_ids) && installment_ids.length > 0) {
      const result = await prisma.loanInstallment.updateMany({
        where: {
          id: { in: installment_ids.map((id: any) => parseInt(id)) },
          status: { not: 'paid' },
        },
        data: {
          status: 'paid',
          metode_bayar: 'potong_gaji',
          paid_at: now,
          confirmed_at: now,
        },
      });
      updatedCount = result.count;
    } else {
      // Settle all unpaid payroll installments for this month/year
      const m = parseInt(month || String(now.getMonth() + 1));
      const y = parseInt(year || String(now.getFullYear()));

      const loans = await prisma.loanApplication.findMany({
        where: {
          status: 'disbursed',
          metode_pembayaran: 'potong_gaji',
        },
        include: {
          installments: {
            where: { status: { not: 'paid' } },
          },
        },
      });

      const idsToUpdate: number[] = [];
      for (const l of loans) {
        const inst = l.installments.find(ins => {
          const d = new Date(ins.jatuh_tempo);
          return d.getMonth() + 1 === m && d.getFullYear() === y;
        }) || l.installments[0];

        if (inst) {
          idsToUpdate.push(inst.id);
        }
      }

      if (idsToUpdate.length > 0) {
        const res = await prisma.loanInstallment.updateMany({
          where: { id: { in: idsToUpdate } },
          data: {
            status: 'paid',
            metode_bayar: 'potong_gaji',
            paid_at: now,
            confirmed_at: now,
          },
        });
        updatedCount = res.count;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil menyelesaikan pemotongan payroll untuk ${updatedCount} tagihan anggota. Status berhasil diperbarui menjadi Lunas (Potong Gaji).`,
      count: updatedCount,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}
