import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'spk-koperasi-secret-key-2026-alazhar-bsd';

export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (err) {
    return null;
  }
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function comparePassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

import { DEMO_USERS } from './demoData';

export async function getAuthenticatedUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    const cookieToken = req.cookies.get('spk_token')?.value;
    if (cookieToken) token = cookieToken;
  }

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    if (user) return user;
  } catch (err) {
    // Database unreachable fallback
  }

  // Return fallback user from DEMO_USERS
  const fallbackUser = Object.values(DEMO_USERS).find(
    (u) => u.email === payload.email || u.id === payload.userId
  );
  return fallbackUser || null;
}

