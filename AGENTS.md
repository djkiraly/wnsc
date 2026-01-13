# AGENTS.md - Development Agent Guidelines

This file keeps AI development agents aligned when working on the WNSC v2 codebase.

---

## Project Overview

**Project:** Western Nebraska Sports Council Website (wnsc-v2)
**Type:** Next.js 15 full-stack application
**Purpose:** Public marketing site + private admin portal for event/contact management

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15.1.5 (App Router) |
| Language | TypeScript 5.7.2 |
| UI | React 19, Tailwind CSS 3.4.17 |
| Database | PostgreSQL via Prisma 6.19.2 |
| Auth | JWT (jose), bcrypt |
| Validation | Zod |
| Email | Gmail API + Nodemailer |

---

## Critical Architecture Rules

### 1. Middleware Constraints
The `middleware.ts` file runs on the Edge runtime. **Never import**:
- `bcrypt` or other native Node modules
- Prisma client directly
- Any file that imports these

**Safe imports for middleware:**
- `@/lib/jwt-config` (JWT secret only)
- `jose` library
- Standard Next.js imports

### 2. JWT Configuration
JWT secret is defined in `lib/jwt-config.ts` (edge-compatible).
- `lib/auth.ts` imports from `jwt-config.ts`
- `middleware.ts` imports from `jwt-config.ts`
- Never duplicate the JWT_SECRET definition

### 3. Environment Variables
Required variables (app fails without these):
```
DATABASE_URL          # PostgreSQL connection
JWT_SECRET            # Min 32 characters
RECAPTCHA_SECRET_KEY  # Google reCAPTCHA v3
```

---

## File Structure

```
app/
├── (public)/          # Public routes (about, contact, events, resources)
├── admin/             # Protected admin routes
│   ├── layout.tsx     # Auth check, sidebar, header
│   ├── error.tsx      # Admin error boundary
│   └── [feature]/     # dashboard, events, contacts, tasks, etc.
├── api/               # API routes
├── error.tsx          # Global error boundary
├── not-found.tsx      # 404 page
└── layout.tsx         # Root layout

lib/
├── jwt-config.ts      # JWT secret (edge-safe)
├── auth.ts            # Auth functions (server-only)
├── prisma.ts          # Prisma client singleton
├── gmail.ts           # Email sending
├── analytics.ts       # Page/event tracking
└── utils.ts           # Helper utilities

middleware/
├── validation.ts      # Zod schemas
└── rateLimiter.ts     # Rate limiting

components/
├── public/            # Public site components
├── admin/             # Admin portal components
└── ui/                # Shared UI components
```

---

## Code Patterns

### API Routes
```typescript
// Standard pattern for API routes
export async function POST(request: NextRequest) {
  // 1. Rate limiting
  const rateLimitResponse = await rateLimit(request, 'type');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    // 2. Parse and validate input
    const body = await request.json();
    const validation = schema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    // 3. Business logic
    const result = await doSomething(validation.data);

    // 4. Success response
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}
```

### Authentication Check
```typescript
// In server components or API routes
import { getCurrentUser, requireAuth } from '@/lib/auth';

// Optional auth (returns null if not logged in)
const user = await getCurrentUser();

// Required auth (throws if not logged in)
const user = await requireAuth();
```

### Database Queries
```typescript
import prisma from '@/lib/prisma';

// Always use Prisma, never raw SQL
const events = await prisma.event.findMany({
  where: { published: true },
  include: { createdBy: { select: { id: true, name: true } } },
  orderBy: { startDate: 'asc' },
});
```

### Validation Schemas
```typescript
// Located in middleware/validation.ts
import { z } from 'zod';

// Strong password (for user creation/password updates)
const strongPasswordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Must contain uppercase')
  .regex(/[a-z]/, 'Must contain lowercase')
  .regex(/[0-9]/, 'Must contain number');
```

---

## Database Schema Notes

### Key Relationships
- `Event` → `User` (createdBy, onDelete: SetNull)
- `Task` → `User` (assignedTo: SetNull, createdBy: Cascade)
- `Task` → `Event` (onDelete: Cascade)
- `Note` → `User/Event/Contact` (onDelete: Cascade)
- `EventView` → `Event` (onDelete: Cascade)

### Indexed Fields
Performance indexes exist on:
- Event: `[status, published]`, `[startDate]`, `[createdById]`
- Contact: `[status]`, `[createdAt]`, `[assignedToId]`
- Task: `[status]`, `[dueDate]`, `[assignedToId]`, `[createdById]`
- PageView: `[timestamp]`, `[page]`, `[path]`
- EventView: `[eventId]`, `[timestamp]`

### After Schema Changes
Always run:
```bash
npx prisma migrate dev --name descriptive_name
npx prisma generate
```

---

## Security Checklist

When adding features, verify:
- [ ] Input validated with Zod schema
- [ ] Rate limiting applied to public endpoints
- [ ] Auth check for admin routes (`requireAuth()` or middleware)
- [ ] Role check for sensitive operations (`hasRole()`)
- [ ] No secrets logged or exposed in responses
- [ ] SQL injection prevented (use Prisma, not raw queries)
- [ ] XSS prevented (React handles this, but avoid `dangerouslySetInnerHTML`)

---

## TypeScript Configuration

Strict options enabled:
- `strict: true`
- `noUncheckedIndexedAccess: true`

When accessing array/object indices, always handle `undefined`:
```typescript
const items = ['a', 'b', 'c'];
const first = items[0]; // Type: string | undefined
if (first) {
  // Now safe to use
}
```

---

## Common Gotchas

1. **Edge Runtime**: Middleware can't use bcrypt, Prisma, or Node-specific APIs
2. **Server vs Client**: Components are server by default; add `'use client'` for interactivity
3. **Password Changes**: Strong password validation (12+ chars) applies to new passwords only, not login
4. **JWT Expiration**: 7 days, checked in middleware and auth.ts
5. **createdById nullable**: Event.createdById is nullable (SetNull on user delete)

---

## Testing Changes

After modifications:
1. Run `npm run build` to check TypeScript/compilation
2. Run `npm run lint` for linting issues
3. Test affected features manually
4. Check browser console for client-side errors

---

## Style Guide

- Use Tailwind CSS utilities, avoid custom CSS
- Use `cn()` utility from `lib/utils.ts` for conditional classes
- Follow existing component patterns in `components/`
- API responses use `ApiResponse<T>` interface from `types/index.ts`
- Error logging: `console.error('Context:', error)`

---

*Last updated: January 2026*
