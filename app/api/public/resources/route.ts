import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET public resources
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const resources = await prisma.resource.findMany({
      where: {
        isPublic: true,
        ...(category ? { category } : {}),
      },
      orderBy: [
        { category: 'asc' },
        { title: 'asc' },
      ],
    });

    return NextResponse.json({ success: true, data: resources });
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}
