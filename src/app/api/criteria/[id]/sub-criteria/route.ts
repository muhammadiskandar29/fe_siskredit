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
    const { label, score_value, order_num } = await req.json();

    const sub = await prisma.subCriterion.create({
      data: {
        criterion_id: parseInt(id),
        label,
        score: parseFloat(score_value || 1),
        order_num: parseInt(order_num || 1),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Sub-kriteria berhasil ditambahkan',
      data: sub,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}
