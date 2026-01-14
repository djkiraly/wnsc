import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET active partners
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tier = searchParams.get('tier');

    const partners = await prisma.partner.findMany({
      where: {
        isActive: true,
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
