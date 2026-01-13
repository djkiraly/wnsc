import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/gmail';
import crypto from 'crypto';

// POST - Manually verify user's email (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !hasRole(currentUser, ['ADMIN', 'SUPER_ADMIN'])) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'verify'; // 'verify' or 'resend'

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (action === 'resend') {
      // Generate new verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await prisma.user.update({
        where: { id },
        data: {
          emailVerificationToken: verificationToken,
          emailVerificationExpires: verificationExpires,
        },
      });

      // Send verification email
      try {
        const result = await sendVerificationEmail(user.email, user.name, verificationToken);
        if (result?.success) {
          return NextResponse.json({
            success: true,
            message: 'Verification email sent successfully',
          });
        } else {
          const errorMsg = result?.error || 'Unknown email error';
          console.error('Admin resend verification email failed:', errorMsg);
          return NextResponse.json(
            { success: false, error: `Failed to send email: ${errorMsg}` },
            { status: 500 }
          );
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error('Failed to send verification email:', errorMsg, err);
        return NextResponse.json(
          { success: false, error: `Failed to send email: ${errorMsg}` },
          { status: 500 }
        );
      }
    }

    // Manual verification
    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'Email is already verified',
        alreadyVerified: true,
      });
    }

    await prisma.user.update({
      where: { id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User email verified successfully',
    });
  } catch (error) {
    console.error('Error verifying user email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify email' },
      { status: 500 }
    );
  }
}
