# Setup Instructions

## Environment Variables Setup

Copy the `.env.example` file to `.env.local` and fill in your actual values:

```bash
cp .env.example .env.local
```

### Required Environment Variables

#### 1. Database (Neon.tech)

Sign up at https://neon.tech and create a new project:

```env
DATABASE_URL="postgresql://username:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
```

#### 2. Authentication Secrets

Generate secure random strings (minimum 32 characters):

```bash
# On Linux/Mac:
openssl rand -base64 32

# On Windows (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

```env
JWT_SECRET="your-generated-secret-here"
SESSION_SECRET="another-generated-secret-here"
NEXTAUTH_SECRET="yet-another-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"  # Change to your domain in production
```

#### 3. Google reCAPTCHA v3

1. Visit https://www.google.com/recaptcha/admin/create
2. Choose reCAPTCHA v3
3. Add your domains (localhost for development)
4. Get your site key and secret key

```env
RECAPTCHA_SITE_KEY="your-recaptcha-site-key"
RECAPTCHA_SECRET_KEY="your-recaptcha-secret-key"
```

#### 4. Gmail API (for sending emails)

1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: https://developers.google.com/oauthplayground
5. Go to https://developers.google.com/oauthplayground
   - Click settings (gear icon) → Use your own OAuth credentials
   - Enter your Client ID and Client Secret
   - In Step 1, enter scope: https://mail.google.com/
   - Click "Authorize APIs"
   - In Step 2, click "Exchange authorization code for tokens"
   - Copy the refresh token

```env
GMAIL_CLIENT_ID="your-gmail-client-id"
GMAIL_CLIENT_SECRET="your-gmail-client-secret"
GMAIL_REDIRECT_URI="https://developers.google.com/oauthplayground"
GMAIL_REFRESH_TOKEN="your-refresh-token"
```

#### 5. Email Addresses

```env
ADMIN_EMAIL="admin@westernnebraskasports.org"
NOTIFICATION_EMAIL="notifications@westernnebraskasports.org"
```

## Database Setup

1. Generate Prisma Client:
```bash
npm run prisma:generate
```

2. Create initial migration:
```bash
npm run prisma:migrate
```

3. Seed the database with sample data:
```bash
npm run prisma:seed
```

## Running the Application

### Development Mode
```bash
npm run dev
```

Visit http://localhost:3000

### Production Mode
```bash
# Build the application
npm run build

# Start production server
npm start
```

## Default Admin Account

After seeding, you can log in with:

- **URL**: http://localhost:3000/admin/login
- **Email**: admin@westernnebraskasports.org
- **Password**: admin123456

**⚠️ CRITICAL**: Change this password immediately after first login!

## Troubleshooting

### Database Connection Issues

If you get connection errors:
1. Verify your DATABASE_URL is correct
2. Check if your IP is whitelisted in Neon.tech (they usually allow all by default)
3. Ensure SSL mode is enabled in the connection string

### Gmail API Issues

If emails aren't sending:
1. Verify all Gmail credentials are correct
2. Make sure the Gmail account has "Less secure app access" disabled (OAuth is more secure)
3. Check that the refresh token hasn't expired
4. Review console logs for specific error messages

### reCAPTCHA Issues

If reCAPTCHA validation fails:
1. Verify your site key and secret key are correct
2. Make sure localhost is added to allowed domains for development
3. Check browser console for reCAPTCHA errors

## Production Deployment

See `DEPLOYMENT.md` for detailed production deployment instructions including:
- NGINX/Caddy configuration
- PM2 setup
- SSL certificates
- Environment variables for production
