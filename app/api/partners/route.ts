import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { partnerSchema } from '@/middleware/validation';
import { getCurrentUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';

// GET all partners
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const tier = searchParams.get('tier');

    const partners = await prisma.partner.findMany({
      where: {
        ...(isActive === 'true' ? { isActive: true } : {}),
        ...(tier ? { tier: tier as 'PRESENTING' | 'GOLD' | 'SILVER' | 'BRONZE' | 'COMMUNITY' } : {}),
      },
      orderBy: [
        { tier: 'asc' },
        { sortOrder: 'asc' },
      ],
    });

    return NextResponse.json({ success: true, data: partners });
  } catch (error) {
    console.error('Error fetching partners:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch partners' },
      { status: 500 }
    );
  }
}

// POST new partner (authenticated)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = partnerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Generate unique slug
    let slug = data.slug || slugify(data.name);
    const existingSlug = await prisma.partner.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const partner = await prisma.partner.create({
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

    return NextResponse.json({ success: true, data: partner }, { status: 201 });
  } catch (error) {
    console.error('Error creating partner:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create partner' },
      { status: 500 }
    );
  }
}
