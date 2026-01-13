import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getCurrentUser, hasRole } from '@/lib/auth';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email',
];

export async function POST(request: NextRequest) {
  try {
    // SUPER_ADMIN only
    const user = await getCurrentUser();
    if (!user || !hasRole(user, ['SUPER_ADMIN'])) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Super Admin required' },
        { status: 403 }
      );
    }

    const { clientId, clientSecret } = await request.json();

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { success: false, error: 'Client ID and Client Secret are required' },
        { status: 400 }
      );
    }

    // Generate CSRF state token
    const state = crypto.randomBytes(32).toString('hex');

    // Store state and credentials temporarily (expires in 10 minutes)
    await prisma.setting.upsert({
      where: { key: 'gmail_oauth_state' },
      update: {
        value: JSON.stringify({
          state,
          clientId,
          clientSecret,
          expiresAt: Date.now() + 600000,
        }),
      },
      create: {
        key: 'gmail_oauth_state',
        value: JSON.stringify({
          state,
          clientId,
          clientSecret,
          expiresAt: Date.now() + 600000,
        }),
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;
    const redirectUri = `${baseUrl}/api/gmail/callback`;

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      state,
      prompt: 'consent', // Force consent to get refresh_token
    });

    return NextResponse.json({ success: true, authUrl });
  } catch (error) {
    console.error('Gmail auth error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start OAuth flow' },
      { status: 500 }
    );
  }
}
