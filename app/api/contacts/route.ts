import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { verifyRecaptcha } from '@/lib/recaptcha';

// POST - Create new contact (public)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      organization,
      inquiryType,
      message,
      eventId,
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
    if (!name || !email || !inquiryType || !message) {
      return NextResponse.json(
        { error: 'Please fill in all required fields.' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    // Validate inquiry type
    const validInquiryTypes = ['HOSTING_EVENT', 'PARTNERSHIP', 'GENERAL_INQUIRY', 'MEDIA'];
    if (!validInquiryTypes.includes(inquiryType)) {
      return NextResponse.json(
        { error: 'Invalid inquiry type.' },
        { status: 400 }
      );
    }

    // Get IP address and user agent
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? (forwardedFor.split(',')[0] ?? 'unknown').trim() : 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create the contact
    const contact = await prisma.contact.create({
      data: {
        name,
        email,
        phone: phone || null,
        organization: organization || null,
        inquiryType,
        message,
        eventId: eventId || null,
        ipAddress,
        userAgent,
        status: 'NEW',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you soon.',
      id: contact.id,
    });
  } catch (error) {
    console.error('Contact submission error:', error);
    return NextResponse.json(
      { error: 'Failed to send message. Please try again.' },
      { status: 500 }
    );
  }
}

// GET - List contacts (admin only)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where = status && status !== 'all' ? { status: status as any } : {};

    const contacts = await prisma.contact.findMany({
      where,
      include: {
        assignedTo: {
          select: { id: true, name: true },
        },
        event: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}
