import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: { user_id: user.id },
      orderBy: { id: 'desc' },
      take: 30,
    });

    const unreadCount = await prisma.notification.count({
      where: { user_id: user.id, is_read: false },
    });

    const formatted = notifications.map((n) => ({
      ...n,
      target_url: n.link,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
      unread_count: unreadCount,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}
