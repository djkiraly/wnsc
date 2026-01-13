import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, hashPassword, hasRole } from '@/lib/auth';

// GET all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user, ['ADMIN', 'SUPER_ADMIN'])) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const users = await prisma.user.findMany({
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
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST create new user (admin only)
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !hasRole(currentUser, ['ADMIN', 'SUPER_ADMIN'])) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.email || !body.name || !body.password) {
      return NextResponse.json(
        { success: false, error: 'Email, name, and password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (body.password.length < 12) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 12 characters' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already in use' },
        { status: 400 }
      );
    }

    // Only SUPER_ADMIN can create ADMIN or SUPER_ADMIN users
    if (
      (body.role === 'ADMIN' || body.role === 'SUPER_ADMIN') &&
      currentUser.role !== 'SUPER_ADMIN'
    ) {
      return NextResponse.json(
        { success: false, error: 'Only Super Admins can create Admin users' },
        { status: 403 }
      );
    }

    const passwordHash = await hashPassword(body.password);

    const user = await prisma.user.create({
      data: {
        email: body.email.toLowerCase(),
        name: body.name,
        role: body.role || 'EDITOR',
        memberStatus: body.memberStatus || 'VISITOR',
        phone: body.phone || null,
        address: body.address || null,
        city: body.city || null,
        state: body.state || null,
        zip: body.zip || null,
        bio: body.bio || null,
        passwordHash,
        active: body.active !== false,
      },
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
      },
    });

    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
