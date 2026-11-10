import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { SmartEngineService } from '@/lib/smartEngine';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
    }

    let formatted: any[] = [];
    let totalRaw = 100;
    try {
      const criteria = await prisma.criterion.findMany({
        include: {
          subCriteria: {
            orderBy: { order_num: 'asc' },
          },
        },
        orderBy: { order_num: 'asc' },
      });

      totalRaw = criteria.reduce((sum, c) => sum + c.weight, 0);
      formatted = criteria.map((c) => ({
        ...c,
        raw_weight: c.weight,
        sub_criteria: c.subCriteria.map((s) => ({
          ...s,
          score_value: s.score,
        })),
      }));
    } catch (dbErr) {
      const { DEMO_CRITERIA } = await import('@/lib/demoData');
      formatted = DEMO_CRITERIA;
      totalRaw = 100;
    }

    return NextResponse.json({
      success: true,
      data: formatted,
      meta: {
        total_raw_weight: totalRaw,
        total_criteria: formatted.length,
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

    const { code, name, type, raw_weight, description } = await req.json();

    const maxOrder = await prisma.criterion.aggregate({
      _max: { order_num: true },
    });
    const nextOrder = (maxOrder._max.order_num || 0) + 1;

    const criterion = await prisma.criterion.create({
      data: {
        code: code.toUpperCase().trim(),
        name,
        type: type || 'benefit',
        weight: parseFloat(raw_weight || 20),
        normalized_weight: 0,
        order_num: nextOrder,
      },
    });

    // Re-normalize all weights
    await SmartEngineService.renormalizeCriteria();

    return NextResponse.json({
      success: true,
      message: 'Kriteria berhasil ditambahkan',
      data: criterion,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}
