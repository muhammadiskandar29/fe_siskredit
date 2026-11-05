import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'OK',
    application: 'SPK Koperasi SMART Al-Azhar BSD (Fullstack Next.js Node)',
    timestamp: new Date().toISOString(),
  });
}
