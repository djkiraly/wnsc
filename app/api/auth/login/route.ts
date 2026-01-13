import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/middleware/validation';
import { verifyPassword, createSession } from '@/lib/auth';
import { rateLimit } from '@/middleware/rateLimiter';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await rateLimit(request, 'login');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    
    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.active) {
      return NextResponse.json(
        { error: 'Your account has been deactivated. Please contact an administrator.' },
        { status: 403 }
      );
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: 'Please verify your email address before logging in. Check your inbox for the verification link.' },
        { status: 403 }
      );
    }

    // Check if account is approved
    if (!user.approved) {
      return NextResponse.json(
        { error: 'Your account is pending administrator approval. You will receive an email once approved.' },
        { status: 403 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Create session
    await createSession(user.id, user.email, user.role);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
