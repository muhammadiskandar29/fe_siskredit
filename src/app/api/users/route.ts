import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser, hashPassword } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== 'petugas_simpin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: { id: 'desc' },
      select: {
        id: true,
        nik: true,
        name: true,
        email: true,
        role: true,
        unit_kerja: true,
        status_pegawai: true,
        masa_kerja_tahun: true,
        no_hp: true,
        no_rekening_muamalat: true,
        nama_rekening: true,
        created_at: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: users,
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
    const {
      nik,
      name,
      email,
      password,
      role,
      unit_kerja,
      status_pegawai,
      masa_kerja_tahun,
      no_hp,
      no_rekening_muamalat,
      nama_rekening,
    } = body;

    const hashedPassword = await hashPassword(password || 'password');

    const newUser = await prisma.user.create({
      data: {
        nik: nik || `NIK-${Math.floor(100000 + Math.random() * 900000)}`,
        name,
        email,
        password: hashedPassword,
        role: role || 'anggota',
        unit_kerja: unit_kerja || 'LAKHAR',
        status_pegawai: status_pegawai || 'TETAP',
        masa_kerja_tahun: parseInt(masa_kerja_tahun || 5),
        no_hp: no_hp || '',
        no_rekening_muamalat: no_rekening_muamalat || '',
        nama_rekening: nama_rekening || name,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Anggota / Pengguna baru berhasil didaftarkan',
      data: newUser,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}
