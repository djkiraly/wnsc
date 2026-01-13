# Western Nebraska Sports Council Website

A professional dual-purpose website serving as both a public marketing platform and a private administrative portal for event and contact management.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL (Neon.tech) with Prisma 6
- **Authentication**: Local auth with JWT sessions
- **Email**: Gmail API
- **Analytics**: Recharts
- **Security**: reCAPTCHA v3, rate limiting
- **Styling**: Tailwind CSS

## Features

### Public Website
- Home page with hero section and featured events
- About page with mission and team information
- Events listing page with upcoming/past event separation
- Individual event detail pages with analytics tracking
- Event sharing functionality (native share API with clipboard fallback)
- Contact form with reCAPTCHA
- Resources page
- Newsletter signup

### Admin Portal
- Dashboard with key metrics
- Event management (CRUD operations)
- Calendar view
- Task management
- Contact inbox and management
- Notes system
- Analytics dashboard with charts
- User management (Admin/Super Admin only)
- Site settings

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Neon.tech account recommended)
- Gmail account for email notifications

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd wnsc-v2
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@neon.tech/wnsc"

# Authentication (generate secure random strings)
JWT_SECRET="your-secret-key-minimum-32-characters-long"
SESSION_SECRET="your-session-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# Google Services
RECAPTCHA_SITE_KEY="your-site-key"
RECAPTCHA_SECRET_KEY="your-secret-key"
GMAIL_CLIENT_ID="your-client-id"
GMAIL_CLIENT_SECRET="your-client-secret"
GMAIL_REDIRECT_URI="your-redirect-uri"
GMAIL_REFRESH_TOKEN="your-refresh-token"

# Email
ADMIN_EMAIL="admin@westernnebraskasports.org"
NOTIFICATION_EMAIL="notifications@westernnebraskasports.org"

# Other
NODE_ENV="development"
PORT="3000"
```

4. Set up the database:

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed the database with sample data
npm run prisma:seed
```

5. Start the development server:

```bash
npm run dev
```

Visit `http://localhost:3000` to see the public website.

### Default Admin Credentials

After running the seed script, you can log in with:

- **Email**: admin@westernnebraskasports.org
- **Password**: admin123456

**⚠️ IMPORTANT**: Change this password immediately after first login!

## Database Schema

The application uses the following main models:

- **User**: Admin users with role-based access control
- **Event**: Sporting events with full details
- **Contact**: Contact form submissions
- **Task**: Task management for team collaboration
- **Note**: Notes linked to events, contacts, or standalone
- **PageView/EventView**: Analytics tracking
- **Newsletter**: Newsletter subscriptions
- **Setting**: Site-wide settings

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:seed` - Seed database with sample data
- `npm run prisma:studio` - Open Prisma Studio

## Project Structure

```
wnsc-v2/
├── app/                      # Next.js app directory
│   ├── (public)/            # Public routes (home, about, events, etc.)
│   ├── admin/               # Admin routes (dashboard, events, contacts, etc.)
│   ├── api/                 # API routes
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
├── components/
│   ├── public/              # Public-facing components
│   ├── admin/               # Admin components
│   └── ui/                  # Reusable UI components
├── lib/
│   ├── auth.ts              # Authentication utilities
│   ├── prisma.ts            # Prisma client
│   ├── gmail.ts             # Gmail API integration
│   ├── analytics.ts         # Analytics utilities
│   └── utils.ts             # General utilities
├── middleware/
│   ├── rateLimiter.ts       # Rate limiting
│   └── validation.ts        # Input validation schemas
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.js              # Seed script
├── public/                  # Static assets
├── types/                   # TypeScript type definitions
└── middleware.ts            # Next.js middleware (auth)
```

## Security Features

- JWT-based session management
- Bcrypt password hashing
- Google reCAPTCHA v3 on forms
- Rate limiting on all endpoints
- Input validation with Zod
- CSRF protection
- SQL injection prevention (Prisma)
- XSS protection

## Deployment

### Production Setup

1. Set up your production database (Neon.tech)
2. Configure environment variables in `.env.production`
3. Build the application:

```bash
npm run build
```

4. Use PM2 for process management:

```bash
pm2 start ecosystem.config.js
```

5. Set up NGINX or Caddy as a reverse proxy (see configuration examples in the documentation)

### PM2 Commands

- `pm2 start ecosystem.config.js` - Start the application
- `pm2 stop wnsc-website` - Stop the application
- `pm2 restart wnsc-website` - Restart the application
- `pm2 logs wnsc-website` - View logs
- `pm2 monit` - Monitor resource usage

## Gmail API Setup

1. Create a Google Cloud Project
2. Enable Gmail API
3. Configure OAuth 2.0 credentials
4. Get refresh token
5. Add credentials to environment variables

See Google's documentation for detailed setup instructions.

## License

Copyright © 2026 Western Nebraska Sports Council. All rights reserved.

## Support

For questions or issues, contact: admin@westernnebraskasports.org
