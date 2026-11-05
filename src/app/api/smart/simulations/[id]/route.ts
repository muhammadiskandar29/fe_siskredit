import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { SmartEngineService } from '@/lib/smartEngine';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    body.id = id;

    const evaluation = await SmartEngineService.calculateManualSimulation(body);

    return NextResponse.json({
      success: true,
      message: `Kandidat alternatif simulasi (${evaluation.candidate_name}) berhasil diperbarui.`,
      data: evaluation,
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
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.smartEvaluation.delete({
      where: { id: parseInt(id) },
    });

    await SmartEngineService.reRankAll();

    return NextResponse.json({
      success: true,
      message: 'Kandidat alternatif simulasi berhasil dihapus dari matriks perangkingan.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}
