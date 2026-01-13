import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { getCurrentUser } from '@/lib/auth';

// POST - Create new event submission (public)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      category,
      startDate,
      endDate,
      location,
      venueName,
      submitterName,
      submitterEmail,
      submitterPhone,
      organization,
      expectedAttendees,
      additionalNotes,
      recaptchaToken,
    } = body;

    // Verify reCAPTCHA
    const recaptchaResult = await verifyRecaptcha(recaptchaToken);
    if (!recaptchaResult.success) {
      return NextResponse.json(
        { error: 'reCAPTCHA verification failed. Please try again.' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!title || !description || !category || !startDate || !endDate || !location || !submitterName || !submitterEmail) {
      return NextResponse.json(
        { error: 'Please fill in all required fields.' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(submitterEmail)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    // Get IP address and user agent
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? (forwardedFor.split(',')[0] ?? 'unknown').trim() : 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create the submission
    const submission = await prisma.eventSubmission.create({
      data: {
        title,
        description,
        category,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location,
        venueName: venueName || null,
        submitterName,
        submitterEmail,
        submitterPhone: submitterPhone || null,
        organization: organization || null,
        expectedAttendees: expectedAttendees || null,
        additionalNotes: additionalNotes || null,
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Event submitted successfully',
      id: submission.id,
    });
  } catch (error) {
    console.error('Event submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit event. Please try again.' },
      { status: 500 }
    );
  }
}

// GET - List event submissions (admin only)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where = status && status !== 'all' ? { status: status as any } : {};

    const submissions = await prisma.eventSubmission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}
