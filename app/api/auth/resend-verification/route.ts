import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/gmail';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required.' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with that email, a verification link has been sent.',
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'Your email is already verified. You can log in once an administrator approves your account.',
        alreadyVerified: true,
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
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
        console.error('Resend verification email failed:', emailError);
      }
    } catch (err) {
      console.error('Failed to send verification email:', err);
      emailError = err instanceof Error ? err.message : 'Unknown error';
    }

    if (!emailSent) {
      return NextResponse.json(
        {
          success: false,
          error: emailError || 'Failed to send verification email. Please contact an administrator.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Failed to resend verification email.' },
      { status: 500 }
    );
  }
}
