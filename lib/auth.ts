import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from './prisma';
import { JWT_SECRET, SESSION_DURATION } from './jwt-config';

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  expiresAt: Date;
  [key: string]: unknown;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createSession(userId: string, email: string, role: string) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  const session: SessionPayload = { userId, email, role, expiresAt };

  const token = await new SignJWT(session)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });

  return token;
}

export async function verifySession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as SessionPayload;
  } catch (error) {
    console.error('Session verification failed:', error);
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export async function getCurrentUser() {
  const session = await verifySession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
    },
  });

  return user;
}

export function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get('session')?.value;
  return !!token;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user || !user.active) {
    throw new Error('Unauthorized');
  }
  return user;
}

export function hasRole(user: { role: string }, allowedRoles: string[]): boolean {
  return allowedRoles.includes(user.role);
}
