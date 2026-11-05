import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
    }

    const criteria = await prisma.criterion.findMany({
      include: {
        subCriteria: {
          orderBy: { order_num: 'asc' },
        },
      },
      orderBy: { order_num: 'asc' },
    });

    const totalRaw = criteria.reduce((sum, c) => sum + c.weight, 0);

    const formatted = criteria.map((c) => ({
      ...c,
      raw_weight: c.weight,
      sub_criteria: c.subCriteria.map((s) => ({
        ...s,
        score_value: s.score,
      })),
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
      meta: {
        total_raw_weight: totalRaw,
        total_criteria: criteria.length,
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
    await renormalizeCriteria();

    return NextResponse.json({
      success: true,
      message: 'Kriteria berhasil ditambahkan',
      data: criterion,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}

export async function renormalizeCriteria() {
  const allCriteria = await prisma.criterion.findMany();
  const total = allCriteria.reduce((sum, c) => sum + c.weight, 0);
  if (total > 0) {
    for (const c of allCriteria) {
      const norm = Math.round((c.weight / total) * 10000) / 10000;
      await prisma.criterion.update({
        where: { id: c.id },
        data: { normalized_weight: norm },
      });
    }
  }
}
