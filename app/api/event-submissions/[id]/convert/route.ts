import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// POST - Convert submission to event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get the submission
    const submission = await prisma.eventSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (submission.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Only approved submissions can be converted to events' },
        { status: 400 }
      );
    }

    // Generate unique slug
    let baseSlug = generateSlug(submission.title);
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.event.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create the event
    const event = await prisma.event.create({
      data: {
        title: submission.title,
        slug,
        description: submission.description,
        category: submission.category,
        startDate: submission.startDate,
        endDate: submission.endDate,
        location: submission.location,
        venueName: submission.venueName,
        contactName: submission.submitterName,
        contactEmail: submission.submitterEmail,
        contactPhone: submission.submitterPhone,
        status: 'DRAFT', // Start as draft for admin to review/publish
        published: false,
        createdById: user.id,
      },
    });

    // Update submission status to indicate it's been converted
    await prisma.eventSubmission.update({
      where: { id },
      data: {
        reviewNotes: `Converted to event: ${event.id}`,
      },
    });

    return NextResponse.json({
      success: true,
      event,
      message: 'Submission converted to event successfully',
    });
  } catch (error) {
    console.error('Error converting submission:', error);
    return NextResponse.json(
      { error: 'Failed to convert submission' },
      { status: 500 }
    );
  }
}
