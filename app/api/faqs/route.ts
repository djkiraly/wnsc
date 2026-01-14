import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { faqSchema } from '@/middleware/validation';
import { getCurrentUser } from '@/lib/auth';

// GET all FAQs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const category = searchParams.get('category');

    const faqs = await prisma.fAQ.findMany({
      where: {
        ...(isActive === 'true' ? { isActive: true } : {}),
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

// POST new FAQ (authenticated)
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
    const validation = faqSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    const faq = await prisma.fAQ.create({
      data: {
        question: data.question,
        answer: data.answer,
        category: data.category || 'General',
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
    });

    return NextResponse.json({ success: true, data: faq }, { status: 201 });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create FAQ' },
      { status: 500 }
    );
  }
}
