# Creating Your .env.local File

Since `.env.local` files are blocked by git for security reasons, you need to create this file manually.

## Quick Start

1. Create a new file named `.env.local` in the root directory of the project
2. Copy the contents below into the file
3. Replace the placeholder values with your actual configuration

## Template

```env
# Database - Get this from Neon.tech
DATABASE_URL="postgresql://user:password@host.neon.tech/database?sslmode=require"

# Authentication Secrets - Generate random strings (32+ characters)
JWT_SECRET="REPLACE_WITH_RANDOM_STRING_32_CHARS_MIN"
SESSION_SECRET="REPLACE_WITH_ANOTHER_RANDOM_STRING"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="REPLACE_WITH_YET_ANOTHER_RANDOM_STRING"

# Google reCAPTCHA v3 - Get from https://www.google.com/recaptcha/admin
RECAPTCHA_SITE_KEY="your-site-key-here"
RECAPTCHA_SECRET_KEY="your-secret-key-here"

# Gmail API - Follow setup instructions in SETUP.md
GMAIL_CLIENT_ID="your-gmail-client-id"
GMAIL_CLIENT_SECRET="your-gmail-client-secret"
GMAIL_REDIRECT_URI="https://developers.google.com/oauthplayground"
GMAIL_REFRESH_TOKEN="your-refresh-token"

# Analytics (Optional)
NEXT_PUBLIC_GA_ID="UA-XXXXXXXXX-X"

# Upload Configuration
MAX_FILE_SIZE="5242880"
ALLOWED_FILE_TYPES="image/jpeg,image/png,application/pdf"

# Email Addresses
ADMIN_EMAIL="admin@westernnebraskasports.org"
NOTIFICATION_EMAIL="notifications@westernnebraskasports.org"

# Environment
NODE_ENV="development"
PORT="3000"
```

## How to Generate Secure Secrets

### On Windows (PowerShell)
```powershell
# Run this command 3 times to generate 3 different secrets
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### On Linux/Mac
```bash
# Run this command 3 times
openssl rand -base64 32
```

### Online Generator
You can also use: https://generate-secret.vercel.app/32

## Required Services Setup

### 1. Neon.tech (Database)
1. Sign up at https://neon.tech
2. Create a new project
3. Copy the connection string
4. Paste it as your `DATABASE_URL`

### 2. Google reCAPTCHA v3
1. Go to https://www.google.com/recaptcha/admin/create
2. Choose reCAPTCHA v3
3. Add domain: `localhost` (for development)
4. Get your Site Key and Secret Key

### 3. Gmail API (for sending emails)
1. Create project at https://console.cloud.google.com/
2. Enable Gmail API
3. Create OAuth 2.0 credentials
4. Follow detailed steps in SETUP.md

## Minimal Configuration (For Testing)

If you want to just test the app without setting up all services, use this minimal config:

```env
DATABASE_URL="postgresql://user:password@host.neon.tech/database?sslmode=require"
JWT_SECRET="test-secret-minimum-32-characters-long-for-development"
SESSION_SECRET="test-session-secret-for-development"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="test-nextauth-secret-for-development"

# These can be dummy values for testing (emails won't send)
GMAIL_CLIENT_ID="dummy"
GMAIL_CLIENT_SECRET="dummy"
GMAIL_REDIRECT_URI="dummy"
GMAIL_REFRESH_TOKEN="dummy"

# These can be dummy values (reCAPTCHA will be skipped in dev)
RECAPTCHA_SITE_KEY="dummy"
RECAPTCHA_SECRET_KEY="dummy"

ADMIN_EMAIL="admin@westernnebraskasports.org"
NOTIFICATION_EMAIL="notifications@westernnebraskasports.org"
NODE_ENV="development"
PORT="3000"
```

⚠️ **Note**: With dummy Gmail and reCAPTCHA values, those features won't work, but the app will still run.

## After Creating .env.local

Run these commands:

```bash
# Generate Prisma client
npm run prisma:generate

# Create database tables
npm run prisma:migrate

# Add sample data
npm run prisma:seed

# Start development server
npm run dev
```

Visit http://localhost:3000 to see your site!

## Troubleshooting

### "Cannot find module '@prisma/client'"
Run: `npm run prisma:generate`

### "Can't reach database server"
- Check your DATABASE_URL is correct
- Verify you have internet connection
- Check Neon.tech dashboard is accessible

### "Authentication failed"
- Verify you created the .env.local file in the root directory
- Check that JWT_SECRET and other secrets are at least 32 characters
- Restart your dev server after creating/modifying .env.local

## Security Reminder

- **NEVER** commit `.env.local` to git
- **NEVER** share your `.env.local` file publicly
- **ALWAYS** use different secrets for development and production
- **ALWAYS** change default passwords after first login
