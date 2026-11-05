import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { renormalizeCriteria } from '../route';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== 'petugas_simpin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { weights } = await req.json(); // array of { id, raw_weight }

    if (Array.isArray(weights)) {
      for (const item of weights) {
        await prisma.criterion.update({
          where: { id: parseInt(item.id) },
          data: { weight: parseFloat(item.raw_weight) },
        });
      }
    }

    await renormalizeCriteria();

    return NextResponse.json({
      success: true,
      message: 'Bobot kriteria berhasil diperbarui dan dinormalisasi',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}
