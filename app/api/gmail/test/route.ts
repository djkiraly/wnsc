import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { sendEmail } from '@/lib/gmail';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user, ['SUPER_ADMIN'])) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email address is required' },
        { status: 400 }
      );
    }

    const result = await sendEmail(
      email,
      'WNSC Test Email',
      `
        <h2>Test Email</h2>
        <p>This is a test email from the Western Nebraska Sports Council admin panel.</p>
        <p>If you received this, your Gmail integration is working correctly!</p>
        <p><small>Sent at: ${new Date().toISOString()}</small></p>
      `
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send test email' },
      { status: 500 }
    );
  }
}
