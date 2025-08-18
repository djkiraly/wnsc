# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Quick Start
```bash
npm run install:all    # Install all dependencies (root, server, client)
npm start              # Run both frontend and backend concurrently
```

### Individual Services
```bash
npm run server:dev     # Start backend with nodemon on port 5000
npm run client:dev     # Start React dev server on port 3000
npm run build          # Build React app for production
```

### Database Operations
```bash
cd server
npm run migrate                    # Run database migrations
npm run migrate:event-management   # Add event management tables (notes, contacts)
npm run migrate:directory         # Update directory table
npm run seed                      # Seed database with sample data
```

### Testing
```bash
cd client
npm test              # Run React tests
```

## Architecture Overview

### Project Structure
- **Monorepo** with separate client and server directories
- **Client**: React 18+ SPA with Tailwind CSS and Context API
- **Server**: Node.js/Express API with PostgreSQL and session-based auth
- **Database**: PostgreSQL with connection pooling

### Authentication Flow
- **Google OAuth 2.0** via Passport.js
- **Session-based** authentication with PostgreSQL session store
- **Role-based access**: admin, organizer, member
- Sessions handled automatically by Express middleware

### Key Technologies
- **Frontend**: React Router, Axios, React Hot Toast, Heroicons
- **Backend**: Express, Passport.js, Helmet, CORS, Rate Limiting
- **Database**: PostgreSQL with pg connection pool
- **Development**: Concurrently for running both services

### State Management
- **AuthContext** (`client/src/contexts/AuthContext.js`) handles user authentication state
- Uses `useReducer` for complex auth state transitions
- Axios configured with base URL and credentials support

### Database Configuration
- Connection pool managed in `server/config/database.js`
- Environment variables in `server/.env` (not committed)
- Default development database: `wnsc_db` on localhost:5432

### API Structure
- All API routes prefixed with `/api/`
- Routes organized by feature: `/auth`, `/users`, `/events`, `/tasks`, `/directory`
- Middleware chain: Helmet → CORS → Rate Limiting → Session → Passport
- **Event Contacts Integration**: Adding contacts to events automatically populates the directory

### UI Framework
- **Tailwind CSS** with custom color palette (primary/secondary)
- **Layout component** with sidebar navigation
- **ProtectedRoute** component for role-based access control
- Responsive design with mobile-first approach

## Important Notes

- Backend expects PostgreSQL connection string via environment variables
- Google OAuth credentials required in `server/.env`
- Client proxies API requests to `http://localhost:5000` in development
- Database migrations must be run before first use
- Session store requires `user_sessions` table in PostgreSQL