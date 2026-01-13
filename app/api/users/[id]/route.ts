import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, hashPassword, hasRole } from '@/lib/auth';

// GET single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Users can view their own profile, admins can view any
    if (id !== currentUser.id && !hasRole(currentUser, ['ADMIN', 'SUPER_ADMIN'])) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        memberStatus: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        bio: true,
        active: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PATCH update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Users can update their own profile, admins can update others
    const isOwnProfile = id === currentUser.id;
    const isAdmin = hasRole(currentUser, ['ADMIN', 'SUPER_ADMIN']);
    const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

    if (!isOwnProfile && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Non-super-admins cannot change role or active status of admin users
    if (!isOwnProfile && !isSuperAdmin) {
      const targetUser = await prisma.user.findUnique({ where: { id } });
      if (targetUser?.role === 'ADMIN' || targetUser?.role === 'SUPER_ADMIN') {
        return NextResponse.json(
          { success: false, error: 'Cannot modify admin users' },
          { status: 403 }
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    // Basic profile fields - anyone can update their own, admins can update others
    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone || null;
    if (body.address !== undefined) updateData.address = body.address || null;
    if (body.city !== undefined) updateData.city = body.city || null;
    if (body.state !== undefined) updateData.state = body.state || null;
    if (body.zip !== undefined) updateData.zip = body.zip || null;
    if (body.bio !== undefined) updateData.bio = body.bio || null;

    // Email - can update own or admin can update others
    if (body.email !== undefined) {
      const emailLower = body.email.toLowerCase();
      // Check if email is already in use by another user
      const existingUser = await prisma.user.findUnique({
        where: { email: emailLower },
      });
      if (existingUser && existingUser.id !== id) {
        return NextResponse.json(
          { success: false, error: 'Email already in use' },
          { status: 400 }
        );
      }
      updateData.email = emailLower;
    }

    // Admin-only fields
    if (isAdmin && !isOwnProfile) {
      if (body.active !== undefined) updateData.active = body.active;
      if (body.memberStatus !== undefined) updateData.memberStatus = body.memberStatus;
    }

    // Super Admin only fields
    if (isSuperAdmin && !isOwnProfile) {
      if (body.role !== undefined) updateData.role = body.role;
    }

    // Users can update their own member status (except officer positions)
    if (isOwnProfile && body.memberStatus !== undefined) {
      const officerRoles = ['PRESIDENT', 'VICE_PRESIDENT', 'TREASURER', 'SECRETARY'];
      if (!officerRoles.includes(body.memberStatus)) {
        updateData.memberStatus = body.memberStatus;
      }
    }

    // Password update
    if (body.password) {
      if (body.password.length < 12) {
        return NextResponse.json(
          { success: false, error: 'Password must be at least 12 characters' },
          { status: 400 }
        );
      }
      updateData.passwordHash = await hashPassword(body.password);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        memberStatus: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        bio: true,
        active: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE user (admin only)
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

    // Cannot delete yourself
    if (id === currentUser.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Check if target is admin (only SUPER_ADMIN can delete admins)
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (
      (targetUser.role === 'ADMIN' || targetUser.role === 'SUPER_ADMIN') &&
      currentUser.role !== 'SUPER_ADMIN'
    ) {
      return NextResponse.json(
        { success: false, error: 'Only Super Admins can delete Admin users' },
        { status: 403 }
      );
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
