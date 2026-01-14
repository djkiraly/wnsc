# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Western Nebraska Sports Council (WNSC) website - a Next.js 15 application with a public-facing website and admin CMS dashboard. Uses PostgreSQL (Neon) with Prisma ORM.

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Generate Prisma client and build Next.js
npm run lint         # Run ESLint

# Database
npm run prisma:generate  # Generate Prisma client after schema changes
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma database GUI
npm run prisma:seed      # Seed database with initial data
```

## Architecture

### Application Structure

- **`app/`** - Next.js App Router
  - `app/admin/` - Protected admin dashboard (requires auth)
  - `app/api/` - API routes (REST endpoints)
  - `app/api/public/` - Public API endpoints (no auth required)
  - Public pages: events, facilities, news, contact, explore, plan-your-event

- **`components/`** - Reusable React components
  - `components/admin/` - Admin UI (Sidebar, AdminHeader)
  - `components/public/` - Public site UI (Header, Footer, Analytics)

- **`lib/`** - Core utilities
  - `auth.ts` - JWT session management with jose library
  - `prisma.ts` - Prisma client singleton
  - `gmail.ts` - Gmail API integration for notifications
  - `gcs.ts` - Google Cloud Storage for file uploads
  - `encryption.ts` - Encryption for sensitive stored credentials

- **`middleware/`** - Request middleware
  - `rateLimiter.ts` - Rate limiting
  - `validation.ts` - Zod-based request validation

### Authentication & Authorization

JWT-based authentication stored in httpOnly cookies. Three role levels with hierarchical permissions:

| Role | Level | Access |
|------|-------|--------|
| EDITOR | Lowest | Events, calendar, tasks, contacts, analytics |
| ADMIN | Middle | + User management (EDITOR only), settings |
| SUPER_ADMIN | Highest | Full access including security settings, email config |

See `roles.md` for complete permission matrix.

### Database Schema

Main models in `prisma/schema.prisma`:
- **User** - Staff accounts with roles and approval workflow
- **Event** - Sports events with status workflow (DRAFT → PUBLISHED → COMPLETED)
- **Contact/EventSubmission** - Public form submissions
- **Task/Note** - Internal project management
- **CMS Models**: Facility, Testimonial, Attraction, Accommodation, Partner, FAQ, Resource, News, Media

### API Pattern

Admin API routes verify session and check role permissions. Public routes under `app/api/public/` don't require auth. Standard pattern:

```typescript
import { verifySession, hasRole } from '@/lib/auth';

export async function GET() {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // ... handler logic
}
```

## Key Configuration

- TypeScript strict mode with `noUncheckedIndexedAccess`
- Path alias: `@/*` maps to project root
- Tailwind colors: `primary` (blue #2563EB), `secondary` (amber #F59E0B), `accent` (emerald #10B981)
- Server actions body size limit: 5mb

## Environment Setup

Copy `.env.example` to both `.env` (Prisma) and `.env.local` (Next.js). Required:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Minimum 32 characters
- `RECAPTCHA_SITE_KEY` / `RECAPTCHA_SECRET_KEY` - For contact forms

Optional (can configure via Admin Panel):
- Gmail API credentials for email notifications
- Google Cloud Storage credentials for file uploads
