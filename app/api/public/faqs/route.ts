import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET active FAQs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const faqs = await prisma.fAQ.findMany({
      where: {
        isActive: true,
        ...(category ? { category } : {}),
      },
      orderBy: [
        { category: 'asc' },
        { sortOrder: 'asc' },
      ],
    });

    return NextResponse.json({ success: true, data: faqs });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch FAQs' },
      { status: 500 }
    );
  }
}
