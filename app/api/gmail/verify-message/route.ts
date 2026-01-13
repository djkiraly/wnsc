import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getCurrentUser, hasRole } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user, ['SUPER_ADMIN'])) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { messageId } = await request.json();

    if (!messageId) {
      return NextResponse.json(
        { success: false, error: 'Message ID is required' },
        { status: 400 }
      );
    }

    // Get credentials from database
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'gmail_client_id',
            'gmail_client_secret',
            'gmail_refresh_token',
          ],
        },
      },
    });

    const settingsMap = settings.reduce(
      (acc, s) => {
        acc[s.key] = s.value;
        return acc;
      },
      {} as Record<string, string>
    );

    if (!settingsMap.gmail_client_id || !settingsMap.gmail_client_secret || !settingsMap.gmail_refresh_token) {
      return NextResponse.json(
        { success: false, error: 'Gmail not configured' },
        { status: 400 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      settingsMap.gmail_client_id,
      decrypt(settingsMap.gmail_client_secret)
    );

    oauth2Client.setCredentials({
      refresh_token: decrypt(settingsMap.gmail_refresh_token),
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Try to get the message
    const message = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'metadata',
      metadataHeaders: ['To', 'Subject', 'Date'],
    });

    const headers = message.data.payload?.headers || [];
    const getHeader = (name: string) => headers.find(h => h.name === name)?.value || '';

    return NextResponse.json({
      success: true,
      message: {
        id: message.data.id,
        threadId: message.data.threadId,
        labelIds: message.data.labelIds,
        to: getHeader('To'),
        subject: getHeader('Subject'),
        date: getHeader('Date'),
        snippet: message.data.snippet,
      },
    });
  } catch (error) {
    console.error('Verify message error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
