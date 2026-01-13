import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { sendVerificationEmail } from '@/lib/gmail';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, recaptchaToken } = body;

    // Verify reCAPTCHA
    const recaptchaResult = await verifyRecaptcha(recaptchaToken);
    if (!recaptchaResult.success) {
      return NextResponse.json(
        { error: 'reCAPTCHA verification failed. Please try again.' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Please fill in all required fields.' },
        { status: 400 }
      );
    }

    // Validate name
    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters.' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain uppercase, lowercase, and numbers.' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      // Don't reveal if account exists for security
      return NextResponse.json(
        { error: 'Unable to create account. Please try a different email.' },
        { status: 400 }
      );
    }

    // Generate verification token (URL-safe)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'EDITOR', // Default role for new registrations
        active: false, // Inactive until approved
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
        approved: false,
      },
    });

    // Send verification email
    let emailSent = false;
    let emailError: string | null = null;
    try {
      const result = await sendVerificationEmail(user.email, user.name, verificationToken);
      emailSent = result?.success ?? false;
      if (!emailSent) {
        emailError = result?.error || 'Email service returned failure';
        console.error('Verification email failed:', emailError);
      }
    } catch (err) {
      console.error('Failed to send verification email:', err);
      emailError = err instanceof Error ? err.message : 'Unknown error';
    }

    return NextResponse.json({
      success: true,
      emailSent,
      emailError: emailError || undefined,
      message: emailSent
        ? 'Registration successful. Please check your email to verify your account.'
        : 'Registration successful, but we could not send the verification email. Please contact an administrator or use the resend option.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}
