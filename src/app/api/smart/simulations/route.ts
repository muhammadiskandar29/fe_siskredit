import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { SmartEngineService } from '@/lib/smartEngine';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
    }

    const body = await req.json();
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
