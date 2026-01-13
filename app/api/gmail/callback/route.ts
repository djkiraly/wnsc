import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getCurrentUser, hasRole } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { encrypt } from '@/lib/encryption';

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;

  try {
    // Verify user is still authenticated and is SUPER_ADMIN
    const user = await getCurrentUser();
    if (!user || !hasRole(user, ['SUPER_ADMIN'])) {
      return NextResponse.redirect(
        new URL('/admin/settings?tab=email&error=unauthorized', baseUrl)
      );
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/admin/settings?tab=email&error=${encodeURIComponent(error)}`, baseUrl)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/admin/settings?tab=email&error=missing_params', baseUrl)
      );
    }

    // Retrieve and validate state
    const storedStateSetting = await prisma.setting.findUnique({
      where: { key: 'gmail_oauth_state' },
    });

    if (!storedStateSetting) {
      return NextResponse.redirect(
        new URL('/admin/settings?tab=email&error=invalid_state', baseUrl)
      );
    }

    const storedState = JSON.parse(storedStateSetting.value);

    // Verify state matches and hasn't expired
    if (storedState.state !== state || Date.now() > storedState.expiresAt) {
      // Clean up expired state
      await prisma.setting.delete({ where: { key: 'gmail_oauth_state' } });
      return NextResponse.redirect(
        new URL('/admin/settings?tab=email&error=state_mismatch', baseUrl)
      );
    }

    const { clientId, clientSecret } = storedState;
    const redirectUri = `${baseUrl}/api/gmail/callback`;

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return NextResponse.redirect(
        new URL('/admin/settings?tab=email&error=no_refresh_token', baseUrl)
      );
    }

    // Get user info to know which email was authorized
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const connectedEmail = userInfo.data.email || '';

    // Store credentials (encrypted) in database
    await Promise.all([
      prisma.setting.upsert({
        where: { key: 'gmail_client_id' },
        update: { value: clientId },
        create: { key: 'gmail_client_id', value: clientId },
      }),
      prisma.setting.upsert({
        where: { key: 'gmail_client_secret' },
        update: { value: encrypt(clientSecret) },
        create: { key: 'gmail_client_secret', value: encrypt(clientSecret) },
      }),
      prisma.setting.upsert({
        where: { key: 'gmail_refresh_token' },
        update: { value: encrypt(tokens.refresh_token) },
        create: { key: 'gmail_refresh_token', value: encrypt(tokens.refresh_token) },
      }),
      prisma.setting.upsert({
        where: { key: 'gmail_connected_email' },
        update: { value: connectedEmail },
        create: { key: 'gmail_connected_email', value: connectedEmail },
      }),
      prisma.setting.upsert({
        where: { key: 'gmail_connected_at' },
        update: { value: new Date().toISOString() },
        create: { key: 'gmail_connected_at', value: new Date().toISOString() },
      }),
      // Clean up OAuth state
      prisma.setting.delete({ where: { key: 'gmail_oauth_state' } }),
    ]);

    return NextResponse.redirect(
      new URL('/admin/settings?tab=email&success=connected', baseUrl)
    );
  } catch (error) {
    console.error('Gmail callback error:', error);
    return NextResponse.redirect(
      new URL('/admin/settings?tab=email&error=callback_failed', baseUrl)
    );
  }
}
