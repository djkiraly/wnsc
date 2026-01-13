# Deployment Guide

This guide covers deploying the Western Nebraska Sports Council website to a production server.

## Prerequisites

- Ubuntu/Debian server (20.04 LTS or newer recommended)
- Root or sudo access
- Domain name configured to point to your server
- Node.js 18+ installed
- PostgreSQL database (Neon.tech recommended)

## 1. Server Setup

### Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Install PM2 globally

```bash
sudo npm install -g pm2
```

### Install NGINX

```bash
sudo apt update
sudo apt install nginx
```

## 2. Application Setup

### Clone and Install

```bash
cd /var/www
sudo git clone <your-repository-url> wnsc
cd wnsc
sudo npm install
```

### Configure Environment Variables

```bash
sudo nano .env.production
```

Add all required environment variables (see SETUP.md for details). Make sure to:
- Use production database URL
- Use strong, unique secrets
- Set NEXTAUTH_URL to your domain
- Configure Gmail API credentials
- Set NODE_ENV to "production"

### Build the Application

```bash
sudo npm run build
```

### Set Up Database

```bash
# Generate Prisma client
sudo npm run prisma:generate

# Run migrations
sudo npm run prisma:migrate

# Seed the database (optional)
sudo npm run prisma:seed
```

## 3. PM2 Configuration

### Start the Application

```bash
sudo pm2 start ecosystem.config.js
```

### Configure PM2 to Start on Boot

```bash
sudo pm2 startup systemd
sudo pm2 save
```

### Useful PM2 Commands

```bash
# View logs
pm2 logs wnsc-website

# Restart application
pm2 restart wnsc-website

# Stop application
pm2 stop wnsc-website

# Monitor resources
pm2 monit

# View status
pm2 status
```

## 4. NGINX Configuration

### Create NGINX Configuration

```bash
sudo nano /etc/nginx/sites-available/wnsc
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name westernnebraskasports.org www.westernnebraskasports.org;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static files caching
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
    
    # Images
    location /images {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 7d;
        add_header Cache-Control "public, max-age=604800";
    }
    
    # Uploads
    location /uploads {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 7d;
        add_header Cache-Control "public, max-age=604800";
    }
}
```

### Enable the Site

```bash
sudo ln -s /etc/nginx/sites-available/wnsc /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 5. SSL Certificate (Let's Encrypt)

### Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx
```

### Obtain SSL Certificate

```bash
sudo certbot --nginx -d westernnebraskasports.org -d www.westernnebraskasports.org
```

Follow the prompts. Certbot will automatically configure NGINX for HTTPS and set up auto-renewal.

### Verify Auto-Renewal

```bash
sudo certbot renew --dry-run
```

## 6. Firewall Configuration

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

## 7. Alternative: Using Caddy (Simpler)

If you prefer Caddy over NGINX:

### Install Caddy

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

### Create Caddyfile

```bash
sudo nano /etc/caddy/Caddyfile
```

Add:

```
westernnebraskasports.org {
    reverse_proxy localhost:3000
    encode gzip
    
    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "no-referrer-when-downgrade"
    }
}
```

### Start Caddy

```bash
sudo systemctl restart caddy
sudo systemctl enable caddy
```

Caddy automatically handles SSL certificates!

## 8. Monitoring and Maintenance

### Create Log Directory

```bash
sudo mkdir -p /var/www/wnsc/logs
sudo chown -R $USER:$USER /var/www/wnsc/logs
```

### Set Up Log Rotation

```bash
sudo nano /etc/logrotate.d/wnsc
```

Add:

```
/var/www/wnsc/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

### Monitor System Resources

```bash
# View PM2 monitoring
pm2 monit

# Check NGINX status
sudo systemctl status nginx

# Check application logs
pm2 logs wnsc-website --lines 100
```

## 9. Backup Strategy

### Database Backups

Create a backup script:

```bash
sudo nano /usr/local/bin/backup-wnsc-db.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/wnsc"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Export from Neon.tech or your PostgreSQL
pg_dump $DATABASE_URL > $BACKUP_DIR/wnsc_$DATE.sql

# Keep only last 30 days
find $BACKUP_DIR -name "wnsc_*.sql" -mtime +30 -delete
```

Make executable:

```bash
sudo chmod +x /usr/local/bin/backup-wnsc-db.sh
```

### Schedule Backups

```bash
sudo crontab -e
```

Add:

```
0 2 * * * /usr/local/bin/backup-wnsc-db.sh
```

### File Backups

```bash
# Backup uploads directory
sudo tar -czf /var/backups/wnsc/uploads_$(date +%Y%m%d).tar.gz /var/www/wnsc/public/uploads
```

## 10. Deployment Updates

### Update Application

```bash
cd /var/www/wnsc
sudo git pull
sudo npm install
sudo npm run build
pm2 restart wnsc-website
```

### Database Migrations

```bash
cd /var/www/wnsc
sudo npm run prisma:migrate
pm2 restart wnsc-website
```

## 11. Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs wnsc-website

# Check environment variables
pm2 env 0

# Restart PM2
pm2 restart all
```

### NGINX Issues

```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Restart NGINX
sudo systemctl restart nginx
```

### Database Connection Issues

- Verify DATABASE_URL in .env.production
- Check Neon.tech dashboard for connection limits
- Ensure firewall allows outbound PostgreSQL connections

### Performance Issues

```bash
# Check PM2 resource usage
pm2 monit

# Check server resources
htop

# View slow queries
pm2 logs wnsc-website | grep "query"
```

## 12. Security Checklist

- [ ] All environment variables are secure and unique
- [ ] Default admin password has been changed
- [ ] SSL certificate is installed and auto-renewal configured
- [ ] Firewall is enabled with only necessary ports open
- [ ] Database backups are configured
- [ ] Log rotation is set up
- [ ] Server is kept up to date: `sudo apt update && sudo apt upgrade`
- [ ] Rate limiting is properly configured
- [ ] reCAPTCHA is enabled on all forms
- [ ] Security headers are configured in NGINX/Caddy

## Support

For deployment issues, contact: admin@westernnebraskasports.org
