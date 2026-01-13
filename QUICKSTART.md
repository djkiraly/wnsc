# Quick Start Guide

Get the Western Nebraska Sports Council website running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- A Neon.tech account (free tier works)
- A text editor

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Environment File

Create a file named `.env.local` in the root directory with this content:

```env
# Get this from Neon.tech after creating a database
DATABASE_URL="postgresql://user:password@host.neon.tech/database?sslmode=require"

# Use these for local development (change for production!)
JWT_SECRET="dev-secret-minimum-32-characters-long-change-in-production"
SESSION_SECRET="dev-session-secret-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-nextauth-secret-change-in-production"

# Dummy values for development (features won't work but app will run)
GMAIL_CLIENT_ID="dummy"
GMAIL_CLIENT_SECRET="dummy"
GMAIL_REDIRECT_URI="dummy"
GMAIL_REFRESH_TOKEN="dummy"
RECAPTCHA_SITE_KEY="dummy"
RECAPTCHA_SECRET_KEY="dummy"

# Email addresses
ADMIN_EMAIL="admin@westernnebraskasports.org"
NOTIFICATION_EMAIL="notifications@westernnebraskasports.org"

# Environment
NODE_ENV="development"
PORT="3000"
```

**Important**: Only `DATABASE_URL` needs to be real. Other values can be dummy for initial testing.

### 3. Get Your Database URL

1. Go to https://neon.tech
2. Sign up (free)
3. Create a new project
4. Copy the connection string
5. Paste it as your `DATABASE_URL` in `.env.local`

### 4. Set Up the Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Create database tables
npm run prisma:migrate

# Add sample data (includes admin user)
npm run prisma:seed
```

### 5. Start the Development Server

```bash
npm run dev
```

### 6. Visit Your Site

Open your browser and go to:

- **Public Website**: http://localhost:3000
- **Admin Login**: http://localhost:3000/admin/login

### 7. Log In to Admin

Use these default credentials:

- **Email**: admin@westernnebraskasports.org
- **Password**: admin123456

⚠️ **Change this password immediately after logging in!**

## What You Get

After completing these steps, you'll have:

- ✅ A fully functional public website with home page
- ✅ Admin portal with dashboard
- ✅ Authentication system
- ✅ Database with sample events
- ✅ Two user accounts (admin and editor)

## Next Steps

### Set Up Real Services (Optional for Development)

For full functionality, set up these services:

1. **Google reCAPTCHA v3** (for forms)
   - Visit: https://www.google.com/recaptcha/admin/create
   - Get site key and secret key
   - Update in `.env.local`

2. **Gmail API** (for sending emails)
   - Follow detailed instructions in `SETUP.md`
   - Update Gmail credentials in `.env.local`

### Explore the Admin Panel

After logging in, you can:

- View dashboard with statistics
- Manage events (create, edit, delete)
- View contact submissions
- Manage tasks
- Add notes
- View analytics
- Manage users (admin only)
- Configure settings

### Build for Production

When ready to deploy:

```bash
# Build the application
npm run build

# Start production server
npm start
```

See `DEPLOYMENT.md` for complete production deployment instructions.

## Troubleshooting

### Can't connect to database
- Verify your DATABASE_URL is correct
- Check you have internet connection
- Make sure you copied the full connection string from Neon.tech

### "Cannot find module '@prisma/client'"
```bash
npm run prisma:generate
```

### Port 3000 already in use
```bash
# Change PORT in .env.local to 3001 or another port
PORT="3001"
```

### Authentication not working
- Make sure `.env.local` file exists in the root directory
- Verify JWT_SECRET is at least 32 characters
- Restart the dev server after modifying `.env.local`

### Page not loading
- Check terminal for error messages
- Make sure all dependencies installed: `npm install`
- Try clearing Next.js cache: `rm -rf .next` then `npm run dev`

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Start production server

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:seed      # Seed database
npm run prisma:studio    # Open Prisma Studio (database GUI)

# Code Quality
npm run lint             # Run ESLint
```

## Getting Help

- Check `README.md` for general information
- Read `SETUP.md` for detailed setup instructions
- See `DEPLOYMENT.md` for production deployment
- Review `PHASE1_COMPLETE.md` for what's been implemented

## What's Included in Phase 1

### Public Website
- Home page with hero, stats, and sections
- Responsive header and footer
- Professional light theme design

### Admin Portal
- Dashboard with key metrics
- Event management interface
- Calendar view
- Task management
- Contact inbox
- Notes system
- Analytics dashboard
- User management
- Settings page

### Backend
- PostgreSQL database with complete schema
- JWT authentication
- Rate limiting
- Input validation
- Gmail API integration ready
- reCAPTCHA integration ready
- Analytics tracking

---

**Estimated Setup Time**: 5-10 minutes
**Difficulty**: Beginner-friendly

Enjoy building with the Western Nebraska Sports Council platform! 🎉
