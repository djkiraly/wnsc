#!/bin/bash

# West Nebraska Sports Council - Installation Script
# This script installs the WNSC application on a fresh Linux system
#
# Usage:
#   1. Clone repository: git clone https://github.com/djkiraly/wnsc.git
#   2. Run script: sudo ./install.sh
#
# Or download directly (requires public repository):
#   curl -fsSL https://raw.githubusercontent.com/djkiraly/wnsc/main/install.sh | sudo bash

set -e  # Exit on any error

# Set non-interactive mode for package installations
export DEBIAN_FRONTEND=noninteractive
export NEEDRESTART_MODE=a

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NODE_VERSION="18"
POSTGRES_VERSION="14"
APP_USER="wnsc"
APP_DIR="/opt/wnsc"
DB_NAME="wnsc_db"
DB_USER="wnsc_user"

# Log function
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Detect Linux distribution
detect_distro() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        DISTRO=$ID
        VERSION=$VERSION_ID
    else
        error "Cannot detect Linux distribution"
        exit 1
    fi
    log "Detected distribution: $DISTRO $VERSION"
}

# Update system packages
update_system() {
    log "Updating system packages..."
    case $DISTRO in
        ubuntu|debian)
            apt-get update
            apt-get upgrade -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold"
            apt-get install -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" curl wget gnupg2 software-properties-common apt-transport-https ca-certificates lsb-release
            ;;
        centos|rhel|fedora)
            if command -v dnf &> /dev/null; then
                dnf update -y
                dnf install -y curl wget gnupg2
            else
                yum update -y
                yum install -y curl wget gnupg2
            fi
            ;;
        *)
            warning "Unsupported distribution: $DISTRO. Continuing anyway..."
            ;;
    esac
    success "System packages updated"
}

# Install Node.js
install_nodejs() {
    log "Installing Node.js $NODE_VERSION..."
    
    # Install NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    
    case $DISTRO in
        ubuntu|debian)
            apt-get install -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" nodejs
            ;;
        centos|rhel|fedora)
            if command -v dnf &> /dev/null; then
                dnf install -y nodejs
            else
                yum install -y nodejs
            fi
            ;;
    esac
    
    # Verify installation
    NODE_VERSION_ACTUAL=$(node --version)
    NPM_VERSION_ACTUAL=$(npm --version)
    log "Node.js version: $NODE_VERSION_ACTUAL"
    log "npm version: $NPM_VERSION_ACTUAL"
    success "Node.js installed successfully"
}

# Install PostgreSQL
install_postgresql() {
    log "Installing PostgreSQL $POSTGRES_VERSION..."
    
    case $DISTRO in
        ubuntu|debian)
            # Install PostgreSQL official repository
            wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
            echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list
            apt-get update
            apt-get install -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" postgresql-$POSTGRES_VERSION postgresql-client-$POSTGRES_VERSION postgresql-contrib-$POSTGRES_VERSION
            ;;
        centos|rhel|fedora)
            if command -v dnf &> /dev/null; then
                dnf install -y postgresql-server postgresql-contrib
                postgresql-setup --initdb
            else
                yum install -y postgresql-server postgresql-contrib
                postgresql-setup initdb
            fi
            ;;
    esac
    
    # Start and enable PostgreSQL
    systemctl start postgresql
    systemctl enable postgresql
    
    success "PostgreSQL installed successfully"
}

# Configure PostgreSQL
configure_postgresql() {
    log "Configuring PostgreSQL..."
    
    # Generate random password
    DB_PASSWORD=$(openssl rand -base64 32)
    
    # Create database and user
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;"
    
    # Configure PostgreSQL for local connections
    PG_VERSION=$(sudo -u postgres psql -t -c "SELECT version();" | grep -oP "PostgreSQL \K[0-9]+\.[0-9]+")
    PG_CONF_DIR="/etc/postgresql/$PG_VERSION/main"
    
    if [ -d "$PG_CONF_DIR" ]; then
        # Update pg_hba.conf for local connections
        sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" $PG_CONF_DIR/postgresql.conf
        
        # Restart PostgreSQL
        systemctl restart postgresql
    fi
    
    success "PostgreSQL configured successfully"
    log "Database: $DB_NAME"
    log "User: $DB_USER"
    log "Password: $DB_PASSWORD (save this!)"
    
    # Save database credentials to file
    cat > /root/wnsc_db_credentials.txt << EOF
Database Configuration for WNSC Application
==========================================
Database Name: $DB_NAME
Database User: $DB_USER
Database Password: $DB_PASSWORD
Database Host: localhost
Database Port: 5432

Copy these credentials to your server/.env file:
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_HOST=localhost
DB_PORT=5432
EOF
    chmod 600 /root/wnsc_db_credentials.txt
}

# Create application user
create_app_user() {
    log "Creating application user: $APP_USER"
    
    if ! id "$APP_USER" &>/dev/null; then
        useradd -r -m -d $APP_DIR -s /bin/bash $APP_USER
        success "User $APP_USER created"
    else
        log "User $APP_USER already exists"
    fi
}

# Install Git
install_git() {
    log "Installing Git..."
    
    case $DISTRO in
        ubuntu|debian)
            apt-get install -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" git
            ;;
        centos|rhel|fedora)
            if command -v dnf &> /dev/null; then
                dnf install -y git
            else
                yum install -y git
            fi
            ;;
    esac
    
    success "Git installed successfully"
}

# Install Nginx (optional)
install_nginx() {
    log "Installing Nginx..."
    
    case $DISTRO in
        ubuntu|debian)
            apt-get install -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" nginx
            ;;
        centos|rhel|fedora)
            if command -v dnf &> /dev/null; then
                dnf install -y nginx
            else
                yum install -y nginx
            fi
            ;;
    esac
    
    systemctl start nginx
    systemctl enable nginx
    
    success "Nginx installed successfully"
}

# Install PM2 for process management
install_pm2() {
    log "Installing PM2 process manager..."
    npm install -g pm2
    
    # Setup PM2 startup script
    pm2 startup systemd -u $APP_USER --hp $APP_DIR
    
    success "PM2 installed successfully"
}

# Configure firewall
configure_firewall() {
    log "Configuring firewall..."
    
    if command -v ufw &> /dev/null; then
        # Ubuntu/Debian UFW
        ufw --force enable
        ufw allow ssh
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw allow 3000/tcp  # React dev server
        ufw allow 5000/tcp  # Express server
        success "UFW firewall configured"
    elif command -v firewall-cmd &> /dev/null; then
        # CentOS/RHEL/Fedora firewalld
        systemctl start firewalld
        systemctl enable firewalld
        firewall-cmd --permanent --add-service=ssh
        firewall-cmd --permanent --add-service=http
        firewall-cmd --permanent --add-service=https
        firewall-cmd --permanent --add-port=3000/tcp
        firewall-cmd --permanent --add-port=5000/tcp
        firewall-cmd --reload
        success "Firewalld configured"
    else
        warning "No firewall detected. Please configure manually."
    fi
}

# Create systemd service files
create_systemd_services() {
    log "Creating systemd service files..."
    
    # WNSC Server service
    cat > /etc/systemd/system/wnsc-server.service << EOF
[Unit]
Description=WNSC Server
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR/server
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$APP_DIR

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    success "Systemd service created"
}

# Generate environment template
create_env_template() {
    log "Creating environment template..."
    
    cat > $APP_DIR/.env.template << EOF
# Server Configuration
PORT=5000
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# JWT Configuration (generate a secure secret)
JWT_SECRET=REPLACE_WITH_SECURE_JWT_SECRET
JWT_EXPIRES_IN=24h

# Session Configuration (generate a secure secret)
SESSION_SECRET=REPLACE_WITH_SECURE_SESSION_SECRET

# Google OAuth 2.0 Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Frontend URL
CLIENT_URL=http://localhost:3000
EOF

    chown $APP_USER:$APP_USER $APP_DIR/.env.template
    success "Environment template created at $APP_DIR/.env.template"
}

# Create installation summary
create_summary() {
    cat > /root/wnsc_installation_summary.txt << EOF
WNSC Application Installation Summary
=====================================

Installation completed on: $(date)

Installed Components:
- Node.js $(node --version)
- PostgreSQL $POSTGRES_VERSION
- Nginx (web server)
- PM2 (process manager)
- Git

Application Features:
- Google OAuth 2.0 authentication
- Event management with registration
- Task assignment and tracking
- User management and role-based access
- Admin panel with system settings
- Gmail integration for notifications
- Contact directory management
- Email template system

Application Details:
- Application user: $APP_USER
- Application directory: $APP_DIR
- Database name: $DB_NAME
- Database user: $DB_USER

Next Steps:
1. Clone your application code: git clone https://github.com/djkiraly/wnsc.git $APP_DIR
2. Copy $APP_DIR/.env.template to $APP_DIR/server/.env
3. Update the .env file with your Google OAuth credentials and secure secrets
4. Install application dependencies: cd $APP_DIR && npm run install:all
5. Run database migrations:
   cd $APP_DIR/server
   npm run migrate                    # Base tables
   npm run migrate:event-management   # Event management features
   npm run migrate:directory         # Directory updates
   npm run migrate:email-settings     # Email system
6. Build the frontend: cd $APP_DIR && npm run build
7. Start the service: systemctl start wnsc-server && systemctl enable wnsc-server

Configuration Files:
- Database credentials: /root/wnsc_db_credentials.txt
- Environment template: $APP_DIR/.env.template
- Systemd service: /etc/systemd/system/wnsc-server.service

Useful Commands:
- Check service status: systemctl status wnsc-server
- View service logs: journalctl -u wnsc-server -f
- Restart service: systemctl restart wnsc-server

Security Notes:
- Change default database password
- Generate secure JWT and session secrets
- Configure SSL/TLS certificates for production
- Review and update firewall rules as needed
EOF

    success "Installation summary created at /root/wnsc_installation_summary.txt"
}

# Main installation function
main() {
    echo -e "${BLUE}"
    echo "=============================================="
    echo "  West Nebraska Sports Council Installation"
    echo "=============================================="
    echo -e "${NC}"
    
    log "Starting installation process..."
    
    check_root
    detect_distro
    update_system
    install_git
    install_nodejs
    install_postgresql
    configure_postgresql
    create_app_user
    install_nginx
    install_pm2
    configure_firewall
    create_systemd_services
    create_env_template
    create_summary
    
    echo -e "${GREEN}"
    echo "=============================================="
    echo "         Installation Completed!"
    echo "=============================================="
    echo -e "${NC}"
    echo
    success "WNSC application environment is ready!"
    echo
    warning "Next steps:"
    echo "1. Review /root/wnsc_installation_summary.txt"
    echo "2. Review /root/wnsc_db_credentials.txt"
    echo "3. Clone application: git clone https://github.com/djkiraly/wnsc.git $APP_DIR"
    echo "4. Configure your .env file with OAuth credentials"
    echo "5. Install dependencies and run migrations"
    echo
    log "For detailed instructions, see the installation summary."
}

# Run main function
main "$@"