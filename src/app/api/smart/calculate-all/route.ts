import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { SmartEngineService } from '@/lib/smartEngine';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || (user.role !== 'petugas_simpin' && user.role !== 'ketua_koperasi')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const result = await SmartEngineService.calculateAllBatch();

    return NextResponse.json({
      success: true,
      message: 'Kalkulasi metode SMART berhasil dijalankan untuk seluruh permohonan aktif.',
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}
