import { google } from 'googleapis';
import prisma from './prisma';
import { decrypt } from './encryption';

interface GmailCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  senderEmail: string;
}

// Cache for credentials to avoid repeated DB queries
let credentialsCache: GmailCredentials | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

async function getGmailCredentials(): Promise<GmailCredentials> {
  // Check cache
  if (credentialsCache && Date.now() - cacheTimestamp < CACHE_TTL) {
    return credentialsCache;
  }

  // Try database first
  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: [
          'gmail_client_id',
          'gmail_client_secret',
          'gmail_refresh_token',
          'gmail_connected_email',
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

  // If database has credentials, use them (with decryption)
  if (
    settingsMap.gmail_client_id &&
    settingsMap.gmail_client_secret &&
    settingsMap.gmail_refresh_token
  ) {
    credentialsCache = {
      clientId: settingsMap.gmail_client_id,
      clientSecret: decrypt(settingsMap.gmail_client_secret),
      refreshToken: decrypt(settingsMap.gmail_refresh_token),
      senderEmail:
        settingsMap.gmail_connected_email || process.env.ADMIN_EMAIL || '',
    };
    cacheTimestamp = Date.now();
    return credentialsCache;
  }

  // Fallback to environment variables
  if (
    process.env.GMAIL_CLIENT_ID &&
    process.env.GMAIL_CLIENT_SECRET &&
    process.env.GMAIL_REFRESH_TOKEN
  ) {
    credentialsCache = {
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      senderEmail: process.env.ADMIN_EMAIL || '',
    };
    cacheTimestamp = Date.now();
    return credentialsCache;
  }

  throw new Error('Gmail credentials not configured');
}

// Export function to invalidate cache (used after OAuth flow)
export function invalidateCredentialsCache() {
  credentialsCache = null;
  cacheTimestamp = 0;
}

/**
 * Create a MIME message for the Gmail API
 */
function createMimeMessage(
  from: string,
  to: string,
  subject: string,
  html: string,
  text?: string
): string {
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substr(2)}`;

  const messageParts = [
    `From: Western Nebraska Sports Council <${from}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    text || html.replace(/<[^>]*>/g, ''), // Strip HTML for plain text
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    html,
    '',
    `--${boundary}--`,
  ];

  return messageParts.join('\r\n');
}

/**
 * Encode message for Gmail API (URL-safe base64)
 */
function encodeMessage(message: string): string {
  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<{ success: boolean; messageId?: string | null; error?: string }> {
  try {
    const credentials = await getGmailCredentials();

    const oauth2Client = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret
    );

    oauth2Client.setCredentials({
      refresh_token: credentials.refreshToken,
    });

    // Use Gmail API directly instead of SMTP
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const message = createMimeMessage(
      credentials.senderEmail,
      to,
      subject,
      html,
      text
    );

    const encodedMessage = encodeMessage(message);

    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log(`Email sent successfully to ${to} from ${credentials.senderEmail}, messageId: ${result.data.id}`);
    return { success: true, messageId: result.data.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to send email:', errorMessage, error);
    return { success: false, error: errorMessage };
  }
}

export async function sendContactNotification(contact: {
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  inquiryType: string;
  message: string;
}) {
  const html = `
    <h2>New Contact Form Submission</h2>
    <p><strong>Name:</strong> ${contact.name}</p>
    <p><strong>Email:</strong> ${contact.email}</p>
    ${contact.phone ? `<p><strong>Phone:</strong> ${contact.phone}</p>` : ''}
    ${contact.organization ? `<p><strong>Organization:</strong> ${contact.organization}</p>` : ''}
    <p><strong>Inquiry Type:</strong> ${contact.inquiryType.replace('_', ' ')}</p>
    <p><strong>Message:</strong></p>
    <p>${contact.message}</p>
  `;

  return sendEmail(
    process.env.NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || '',
    'New Contact Form Submission',
    html
  );
}

export async function sendTaskAssignmentEmail(
  userEmail: string,
  userName: string,
  task: {
    title: string;
    description?: string;
    dueDate?: Date;
  }
) {
  const html = `
    <h2>New Task Assignment</h2>
    <p>Hi ${userName},</p>
    <p>You have been assigned a new task:</p>
    <p><strong>Task:</strong> ${task.title}</p>
    ${task.description ? `<p><strong>Description:</strong> ${task.description}</p>` : ''}
    ${task.dueDate ? `<p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>` : ''}
    <p>Please log in to the admin portal to view details.</p>
  `;

  return sendEmail(userEmail, 'New Task Assignment', html);
}

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;

  const html = `
    <h2>Password Reset Request</h2>
    <p>You requested to reset your password for the Western Nebraska Sports Council admin portal.</p>
    <p>Click the link below to reset your password:</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `;

  return sendEmail(email, 'Password Reset Request', html);
}

export async function sendWelcomeEmail(
  email: string,
  name: string,
  tempPassword: string
) {
  const loginUrl = `${process.env.NEXTAUTH_URL}/login`;

  const html = `
    <h2>Welcome to Western Nebraska Sports Council</h2>
    <p>Hi ${name},</p>
    <p>Your admin account has been created. Here are your login credentials:</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Temporary Password:</strong> ${tempPassword}</p>
    <p>Please log in and change your password immediately:</p>
    <p><a href="${loginUrl}">${loginUrl}</a></p>
  `;

  return sendEmail(email, 'Welcome to WNSC Admin Portal', html);
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
) {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (!baseUrl) {
    console.error('NEXTAUTH_URL or NEXT_PUBLIC_SITE_URL environment variable is not set');
    return { success: false, error: 'Site URL not configured' };
  }
  const verifyUrl = `${baseUrl}/verify-email?token=${token}`;
  console.log(`Sending verification email to ${email}, verify URL: ${verifyUrl}`);

  const html = `
    <h2>Verify Your Email Address</h2>
    <p>Hi ${name},</p>
    <p>Thank you for registering with the Western Nebraska Sports Council.</p>
    <p>Please click the link below to verify your email address:</p>
    <p><a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Verify Email Address</a></p>
    <p>Or copy and paste this link into your browser:</p>
    <p><a href="${verifyUrl}">${verifyUrl}</a></p>
    <p>This link will expire in 24 hours.</p>
    <p><strong>What happens next?</strong></p>
    <ol>
      <li>Click the link above to verify your email</li>
      <li>An administrator will review your registration</li>
      <li>You'll receive an email once your account is approved</li>
    </ol>
    <p>If you didn't create this account, please ignore this email.</p>
  `;

  return sendEmail(email, 'Verify Your Email - WNSC', html);
}

export async function sendAccountApprovedEmail(email: string, name: string) {
  const loginUrl = `${process.env.NEXTAUTH_URL}/login`;

  const html = `
    <h2>Your Account Has Been Approved!</h2>
    <p>Hi ${name},</p>
    <p>Great news! Your Western Nebraska Sports Council account has been approved by an administrator.</p>
    <p>You can now sign in to the admin portal:</p>
    <p><a href="${loginUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Sign In to Your Account</a></p>
    <p>Or copy and paste this link into your browser:</p>
    <p><a href="${loginUrl}">${loginUrl}</a></p>
    <p>Welcome to the team!</p>
  `;

  return sendEmail(email, 'Account Approved - WNSC', html);
}

export async function sendAccountRejectedEmail(
  email: string,
  name: string,
  reason?: string
) {
  const html = `
    <h2>Account Registration Update</h2>
    <p>Hi ${name},</p>
    <p>We regret to inform you that your registration request for the Western Nebraska Sports Council admin portal has not been approved at this time.</p>
    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
    <p>If you believe this was a mistake or have questions, please contact us.</p>
    <p>Thank you for your interest in the Western Nebraska Sports Council.</p>
  `;

  return sendEmail(email, 'Account Registration Update - WNSC', html);
}

export async function sendNewRegistrationNotification(user: {
  name: string;
  email: string;
}) {
  const adminUrl = `${process.env.NEXTAUTH_URL}/admin/users`;

  const html = `
    <h2>New User Registration</h2>
    <p>A new user has registered and is awaiting approval:</p>
    <p><strong>Name:</strong> ${user.name}</p>
    <p><strong>Email:</strong> ${user.email}</p>
    <p>Please review their registration in the admin panel:</p>
    <p><a href="${adminUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Review Registrations</a></p>
  `;

  return sendEmail(
    process.env.NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || '',
    'New User Registration Pending Approval - WNSC',
    html
  );
}
