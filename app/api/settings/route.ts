import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getCurrentUser, hasRole } from '@/lib/auth';

// GET all settings
export async function GET() {
  try {
    const settings = await prisma.setting.findMany();
    const settingsMap = settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({ success: true, data: settingsMap });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST update settings (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user, ['ADMIN', 'SUPER_ADMIN'])) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Update each setting
    const updates = Object.entries(body).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    );

    await Promise.all(updates);

    // Revalidate pages that use settings
    revalidatePath('/');
    revalidatePath('/about');
    revalidatePath('/contact');
    revalidatePath('/events');

    return NextResponse.json({ success: true, message: 'Settings updated' });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
