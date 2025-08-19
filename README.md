# West Nebraska Sports Council - Web Application

A comprehensive web application for managing events, tasks, and member coordination for the West Nebraska Sports Council.

## 🚀 Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **Google OAuth 2.0** authentication
- **Passport.js** for authentication strategy
- **Session-based** authentication with PostgreSQL session store

### Frontend
- **React 18+** with functional components and hooks
- **Tailwind CSS** for styling
- **React Context API** for state management
- **React Router** for navigation
- **Axios** for API calls
- **React Hot Toast** for notifications
- **Heroicons** for icons

## 📁 Project Structure

```
wnsc/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React Context providers
│   │   ├── pages/          # Page components
│   │   └── ...
│   ├── package.json
│   └── tailwind.config.js
├── server/                 # Node.js backend
│   ├── config/            # Configuration files
│   ├── middleware/        # Custom middleware
│   ├── routes/            # API routes
│   ├── scripts/           # Database scripts
│   ├── package.json
│   └── server.js
├── package.json           # Root package.json with scripts
└── README.md
```

## 🗄️ Database Schema

### Core Tables
- **users** - User profiles with Google OAuth integration
- **events** - Sports events and tournaments
- **tasks** - Task management and assignment
- **event_participants** - Many-to-many relationship for event registration
- **notifications** - User notification system
- **user_sessions** - Session storage
- **system_settings** - Application-wide configuration settings
- **gmail_credentials** - Gmail API integration credentials
- **email_templates** - Customizable email templates
- **email_logs** - Email delivery tracking and logs
- **notes** - Event-related notes and documentation
- **contacts** - Directory of contacts with event associations

### User Roles
- **Admin** - Full system access including user management and system settings
- **Organizer** - Can create/manage events and tasks
- **Member** - Can participate in events and view assigned tasks

## ⚙️ Setup Instructions

### Quick Installation for Linux Servers

For fresh Linux installations, use our automated installation script:

```bash
# Clone the repository first
git clone https://github.com/djkiraly/wnsc.git
cd wnsc

# Run the installation script
sudo ./install.sh
```

**Alternative**: If the repository is public, you can run directly:
```bash
# Direct download and run (requires public repository)
curl -fsSL https://raw.githubusercontent.com/djkiraly/wnsc/main/install.sh | sudo bash
```

The installation script will:
- Install Node.js 18, PostgreSQL 14, Nginx, and Git
- Create application user and directories
- Configure PostgreSQL database and user
- Set up systemd services for production deployment
- Configure firewall rules
- Generate environment template files

**Note**: The direct curl method requires the repository to be public. If you get a 404 error, clone the repository first and run the script locally.

### Manual Setup (Development)

#### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- Google OAuth 2.0 credentials

#### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/djkiraly/wnsc.git
cd wnsc

# Install all dependencies (root, server, and client)
npm run install:all

# Or install individually
npm install                 # Root dependencies
npm run install:server      # Server dependencies
npm run install:client      # Client dependencies
```

#### 2. Database Setup

```bash
# Create PostgreSQL database
createdb wnsc_db

# Run migrations to create tables
cd server
npm run migrate                    # Create base tables
npm run migrate:event-management   # Add event management features (notes, contacts)
npm run migrate:directory         # Update directory table structure
npm run migrate:email-settings     # Add email system tables

# (Optional) Seed with sample data
npm run seed
```

#### 3. Environment Configuration

Create `server/.env` file:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wnsc_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Session Configuration
SESSION_SECRET=your_session_secret_key_here

# Google OAuth 2.0 Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Frontend URL
CLIENT_URL=http://localhost:3000
```

#### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback` (development)
   - Your production callback URL
6. Copy Client ID and Client Secret to `.env` file

## 🚀 Running the Application

### Development Mode

```bash
# Run both frontend and backend concurrently
npm start

# Run backend only
npm run server:dev

# Run frontend only
npm run client:dev
```

### Production Mode

#### Using the Installation Script
After running the installation script, deploy your application:

```bash
# Clone your application to the server
sudo -u wnsc git clone https://github.com/djkiraly/wnsc.git /opt/wnsc
cd /opt/wnsc

# Install dependencies
sudo -u wnsc npm run install:all

# Configure environment
sudo cp .env.template server/.env
sudo nano server/.env  # Update with your OAuth credentials and secrets

# Run database migrations
cd server && sudo -u wnsc npm run migrate

# Build frontend for production
cd .. && sudo -u wnsc npm run build

# Start the service
sudo systemctl start wnsc-server
sudo systemctl enable wnsc-server

# Check service status
sudo systemctl status wnsc-server
```

#### Manual Production Setup

```bash
# Build frontend
npm run build

# Start server in production mode
npm run server:start
```

## 📡 API Endpoints

### Authentication
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - OAuth callback
- `GET /auth/user` - Get current user
- `POST /auth/logout` - Logout user
- `GET /auth/status` - Check auth status

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/:id/role` - Update user role (admin only)
- `GET /api/users/tasks` - Get user's tasks

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create event (organizer+)
- `PUT /api/events/:id` - Update event (organizer+)
- `POST /api/events/:id/register` - Register for event
- `DELETE /api/events/:id/register` - Unregister from event

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get single task
- `POST /api/tasks` - Create task (organizer+)
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task (organizer+)
- `PATCH /api/tasks/:id/status` - Update task status

### System Settings (Admin Only)
- `GET /api/settings` - Get all system settings
- `PUT /api/settings/:key` - Update setting value
- `GET /api/settings/gmail/status` - Get Gmail integration status
- `GET /api/settings/gmail/auth` - Initiate Gmail OAuth
- `DELETE /api/settings/gmail/disconnect` - Disconnect Gmail
- `GET /api/settings/email-templates` - Get email templates
- `GET /api/settings/email-logs` - Get email delivery logs

### Directory
- `GET /api/directory` - Get all contacts
- `POST /api/directory` - Create contact
- `PUT /api/directory/:id` - Update contact
- `DELETE /api/directory/:id` - Delete contact

## 🔐 Authentication Flow

1. User clicks "Sign in with Google"
2. Redirected to Google OAuth consent screen
3. After approval, redirected to callback URL
4. Server creates/updates user record
5. Session established with user data
6. Client receives authenticated user context

## 🎨 UI Components

### Layout Components
- `Layout` - Main application layout with sidebar
- `ProtectedRoute` - Route protection with role-based access
- `LoadingSpinner` - Loading state component

### Pages
- `HomePage` - Public landing page
- `LoginPage` - Google OAuth login
- `DashboardPage` - User dashboard with role-based tools
- `EventsPage` - Event listing and management with creation/editing modals
- `TasksPage` - Task management interface with assignment workflow
- `ProfilePage` - User profile management with tabbed interface
- `AdminPage` - Administrative interface with user management and system settings
- `DirectoryPage` - Contact directory with event associations
- `EventDetailPage` - Detailed event view with participants and tasks

## 🚧 Development Status - Core Features Complete

✅ **Completed Features:**
- Project structure setup
- Database schema and migrations
- Google OAuth 2.0 authentication
- React 18+ frontend with Tailwind CSS
- Context API state management
- Protected routing with role-based access
- Complete event management system with modals
- Task creation and assignment workflow
- User profile management with tabbed interface
- Admin panel with user management
- Integrated system settings (email, Gmail integration, templates, logs)
- Event registration and participation system
- Directory management with contact associations
- Dashboard with role-based organizer tools

🔄 **Future Enhancements:**
- Real-time notifications system
- Advanced reporting and analytics
- Email template editor
- File upload and document management
- Mobile responsive optimizations

## 📝 Available Scripts

### Root Scripts
- `npm start` - Run both services in development
- `npm run start:detached` - Run services in background
- `npm run stop` - Stop all running services
- `npm run install:all` - Install all dependencies
- `npm run build` - Build frontend for production

### Server Scripts
- `npm run dev` - Start server with nodemon
- `npm run migrate` - Run base database migrations
- `npm run migrate:event-management` - Add event management tables
- `npm run migrate:directory` - Update directory table
- `npm run migrate:email-settings` - Add email system tables
- `npm run seed` - Seed database with sample data

### Client Scripts
- `npm start` - Start React development server
- `npm run build` - Build for production
- `npm test` - Run tests

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🖥️ Production Deployment

### System Requirements
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 10GB minimum
- **CPU**: 2 cores minimum

### Security Considerations
- Change all default passwords and secrets
- Configure SSL/TLS certificates (Let's Encrypt recommended)
- Set up regular database backups
- Configure log rotation
- Update firewall rules for your specific needs
- Regular security updates

### Monitoring and Logs
```bash
# Service status
sudo systemctl status wnsc-server

# View logs
sudo journalctl -u wnsc-server -f

# PM2 process monitoring (if using PM2)
sudo -u wnsc pm2 status
sudo -u wnsc pm2 logs
```

### Backup and Maintenance
```bash
# Database backup
sudo -u postgres pg_dump wnsc_db > backup_$(date +%Y%m%d).sql

# Application backup
sudo tar -czf wnsc_backup_$(date +%Y%m%d).tar.gz /opt/wnsc

# Update application
cd /opt/wnsc
sudo -u wnsc git pull
sudo -u wnsc npm run install:all
sudo -u wnsc npm run build
sudo systemctl restart wnsc-server
```

## 🔮 Future Enhancements

- Real-time updates with WebSockets
- Mobile app with React Native
- Advanced reporting and analytics
- Integration with external calendar systems
- Enhanced email notification workflows
- File upload and document management
- Multi-language support
- Calendar integration (Google Calendar, Outlook)
- SMS notifications
- Event check-in/check-out system
- Payment processing integration
- Advanced user permission system