import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { renormalizeCriteria } from '../route';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== 'petugas_simpin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const { name, type, raw_weight } = await req.json();

    const updated = await prisma.criterion.update({
      where: { id: parseInt(id) },
      data: {
        name,
        type,
        weight: parseFloat(raw_weight),
      },
    });

    await renormalizeCriteria();

    return NextResponse.json({
      success: true,
      message: 'Kriteria berhasil diperbarui',
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== 'petugas_simpin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    await prisma.criterion.delete({
      where: { id: parseInt(id) },
    });

    await renormalizeCriteria();

    return NextResponse.json({
      success: true,
      message: 'Kriteria berhasil dihapus',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}
