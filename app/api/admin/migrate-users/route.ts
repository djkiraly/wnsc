import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, hasRole } from '@/lib/auth';

/**
 * POST - Migrate existing users to have emailVerified and approved set to true
 * This is a one-time migration for users created before the registration system was added
 * Only Super Admins can run this
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Only Super Admins can run this migration.' },
        { status: 401 }
      );
    }

    // Find all users who have no emailVerificationToken and are not yet marked verified/approved
    // These are legacy users who existed before the registration system
    const legacyUsers = await prisma.user.findMany({
      where: {
        OR: [
          { emailVerified: false },
          { approved: false },
        ],
        // Legacy users won't have a verification token
        emailVerificationToken: null,
      },
    });

    // Update all legacy users to be verified and approved
    const result = await prisma.user.updateMany({
      where: {
        id: { in: legacyUsers.map((u) => u.id) },
      },
      data: {
        emailVerified: true,
        approved: true,
        approvedById: currentUser.id,
        approvedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${result.count} legacy users.`,
      count: result.count,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to migrate users' },
      { status: 500 }
    );
  }
}

/**
 * GET - Check how many users need migration
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !hasRole(currentUser, ['ADMIN', 'SUPER_ADMIN'])) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const legacyUsersCount = await prisma.user.count({
      where: {
        OR: [
          { emailVerified: false },
          { approved: false },
        ],
        emailVerificationToken: null,
      },
    });

    return NextResponse.json({
      success: true,
      legacyUsersCount,
      needsMigration: legacyUsersCount > 0,
    });
  } catch (error) {
    console.error('Error checking migration status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check migration status' },
      { status: 500 }
    );
  }
}
