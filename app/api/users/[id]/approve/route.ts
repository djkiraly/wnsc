import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { sendAccountApprovedEmail, sendAccountRejectedEmail } from '@/lib/gmail';

// POST - Approve user
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

    // Get the user
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return NextResponse.json(
        { success: false, error: 'User has not verified their email address' },
        { status: 400 }
      );
    }

    // Check if already approved
    if (user.approved) {
      return NextResponse.json(
        { success: false, error: 'User is already approved' },
        { status: 400 }
      );
    }

    // Approve the user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        approved: true,
        approvedById: currentUser.id,
        approvedAt: new Date(),
        active: true, // Also activate the account
        rejectionReason: null,
      },
    });

    // Send approval email
    try {
      await sendAccountApprovedEmail(user.email, user.name);
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError);
      // Don't fail the approval if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'User approved successfully',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error approving user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to approve user' },
      { status: 500 }
    );
  }
}

// DELETE - Reject user
export async function DELETE(
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
    const reason = body.reason || '';

    // Get the user
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user with rejection
    await prisma.user.update({
      where: { id },
      data: {
        approved: false,
        active: false,
        rejectionReason: reason || null,
      },
    });

    // Send rejection email
    try {
      await sendAccountRejectedEmail(user.email, user.name, reason);
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'User registration rejected',
    });
  } catch (error) {
    console.error('Error rejecting user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reject user' },
      { status: 500 }
    );
  }
}
