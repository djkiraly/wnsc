import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { partnerSchema } from '@/middleware/validation';
import { getCurrentUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';

// GET single partner
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const partner = await prisma.partner.findUnique({
      where: { id },
    });

    if (!partner) {
      return NextResponse.json(
        { success: false, error: 'Partner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: partner });
  } catch (error) {
    console.error('Error fetching partner:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch partner' },
      { status: 500 }
    );
  }
}

// PUT update partner
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validation = partnerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if partner exists
    const existingPartner = await prisma.partner.findUnique({ where: { id } });
    if (!existingPartner) {
      return NextResponse.json(
        { success: false, error: 'Partner not found' },
        { status: 404 }
      );
    }

    // Generate new slug if name changed
    let slug = existingPartner.slug;
    if (data.name !== existingPartner.name) {
      slug = slugify(data.name);
      const slugExists = await prisma.partner.findFirst({
        where: { slug, NOT: { id } },
      });
      if (slugExists) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    const partner = await prisma.partner.update({
      where: { id },
      data: {
        name: data.name,
        slug,
        description: data.description || null,
        logoUrl: data.logoUrl || null,
        website: data.website || null,
        tier: data.tier || 'COMMUNITY',
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
    });

    return NextResponse.json({ success: true, data: partner });
  } catch (error) {
    console.error('Error updating partner:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update partner' },
      { status: 500 }
    );
  }
}

// DELETE partner
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if partner exists
    const existingPartner = await prisma.partner.findUnique({ where: { id } });
    if (!existingPartner) {
      return NextResponse.json(
        { success: false, error: 'Partner not found' },
        { status: 404 }
      );
    }

    await prisma.partner.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Partner deleted' });
  } catch (error) {
    console.error('Error deleting partner:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete partner' },
      { status: 500 }
    );
  }
}
