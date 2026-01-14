import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { faqSchema } from '@/middleware/validation';
import { getCurrentUser } from '@/lib/auth';

// GET single FAQ
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const faq = await prisma.fAQ.findUnique({
      where: { id },
    });

    if (!faq) {
      return NextResponse.json(
        { success: false, error: 'FAQ not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: faq });
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch FAQ' },
      { status: 500 }
    );
  }
}

// PUT update FAQ
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
    const validation = faqSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if FAQ exists
    const existingFaq = await prisma.fAQ.findUnique({ where: { id } });
    if (!existingFaq) {
      return NextResponse.json(
        { success: false, error: 'FAQ not found' },
        { status: 404 }
      );
    }

    const faq = await prisma.fAQ.update({
      where: { id },
      data: {
        question: data.question,
        answer: data.answer,
        category: data.category || 'General',
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
    });

    return NextResponse.json({ success: true, data: faq });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update FAQ' },
      { status: 500 }
    );
  }
}

// DELETE FAQ
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

    // Check if FAQ exists
    const existingFaq = await prisma.fAQ.findUnique({ where: { id } });
    if (!existingFaq) {
      return NextResponse.json(
        { success: false, error: 'FAQ not found' },
        { status: 404 }
      );
    }

    await prisma.fAQ.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'FAQ deleted' });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete FAQ' },
      { status: 500 }
    );
  }
}
