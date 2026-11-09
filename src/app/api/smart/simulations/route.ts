import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { SmartEngineService } from '@/lib/smartEngine';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
    }

    const body = await req.json();

    // Support Bulk / Batch Import (e.g. 150 records)
    if (body.batch && Array.isArray(body.batch)) {
      const records = [];
      for (const item of body.batch) {
        if (!item.candidate_name) continue;
        const res = await SmartEngineService.calculateManualSimulation(item);
        records.push(res);
      }
      await SmartEngineService.reRankAll();

      return NextResponse.json({
        success: true,
        message: `Berhasil memproses ${records.length} data alternatif simulasi riset dengan metode SMART.`,
        data: records,
        count: records.length,
      });
    }

    const evaluation = await SmartEngineService.calculateManualSimulation(body);

    return NextResponse.json({
      success: true,
      message: `Kandidat alternatif simulasi (${evaluation.candidate_name}) berhasil ditambahkan dan dinilai dengan metode SMART.`,
      data: evaluation,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
    }

    // Delete all manual simulation alternatives
    const deleted = await prisma.smartEvaluation.deleteMany({
      where: { is_manual_simulation: true },
    });

    await SmartEngineService.reRankAll();

    return NextResponse.json({
      success: true,
      message: `Berhasil menghapus ${deleted.count} data alternatif simulasi riset. Matriks telah diperbarui.`,
      count: deleted.count,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}
