# Production Deployment Guide

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Stripe account
- Google Cloud Console project (for OAuth)
- Azure AD app registration (for Microsoft OAuth)

## Environment Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd supplychain-ai
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env with production values
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Strong random string (32+ characters)
- `ENCRYPTION_KEY` - 32-byte key for encrypting sensitive data
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth credentials
- `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET` - Microsoft OAuth credentials

### 3. Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate:deploy

# Seed initial data
npm run seed:production
npm run seed:legal
```

## Deployment Options

### Option 1: Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY . .

# Build and generate Prisma client
RUN npm run prisma:generate
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t supplychain-ai .
docker run -d -p 3001:3001 --env-file .env supplychain-ai
```

### Option 2: AWS ECS/Fargate

1. Create ECR repository
2. Build and push Docker image
3. Create ECS task definition
4. Set up Application Load Balancer
5. Configure auto-scaling

### Option 3: Railway/Heroku/Render

1. Connect GitHub repository
2. Set environment variables in platform dashboard
3. Add PostgreSQL database addon
4. Deploy

## Stripe Webhook Setup

For local development, use Stripe CLI:

```bash
# Install Stripe CLI
curl -sL https://stripe.com/docs/stripe-cli | bash

# Login and listen to webhooks
stripe login
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

For production, configure webhook endpoint in Stripe Dashboard:
- URL: `https://your-domain.com/api/webhooks/stripe`
- Events: `customer.subscription.*`, `invoice.*`, `payment_intent.*`

## OAuth Configuration

### Google OAuth

1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add authorized redirect URIs:
   - Development: `http://localhost:3001/api/sso/google/callback`
   - Production: `https://your-domain.com/api/sso/google/callback`

### Microsoft OAuth

1. Go to Azure Portal > App Registrations
2. Create new registration
3. Add redirect URIs:
   - Development: `http://localhost:3001/api/sso/microsoft/callback`
   - Production: `https://your-domain.com/api/sso/microsoft/callback`
4. Generate client secret

## SSL/TLS Configuration

### Using Let's Encrypt (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Monitoring & Logging

### Structured Logging

Logs are output in JSON format with fields:
- `timestamp`: ISO timestamp
- `level`: debug, info, warn, error
- `message`: Log message
- `traceId`: Request trace ID
- `userId`: User ID (if authenticated)
- `path`: Request path

### Recommended Monitoring Stack

1. **Error Tracking**: Sentry
2. **Logs Aggregation**: Datadog, CloudWatch, or LogDNA
3. **Uptime Monitoring**: Pingdom, UptimeRobot
4. **APM**: New Relic, Datadog APM

## Backup & Recovery

### Database Backups

Configure automated backups for PostgreSQL:
- AWS RDS: Enable automated backups
- Heroku Postgres: Automatic
- Self-hosted: Use pg_dump with cron

### Restore from Backup

```bash
pg_restore -h localhost -U username -d database_name backup.dump
```

## Security Checklist

- [ ] HTTPS enabled with valid SSL certificate
- [ ] JWT secret is strong and unique
- [ ] Encryption key is 32 bytes
- [ ] API rate limiting enabled
- [ ] CORS configured for production domain
- [ ] Security headers (CSP, HSTS, X-Frame-Options)
- [ ] Database credentials not in version control
- [ ] Webhook signature verification enabled
- [ ] OAuth secrets encrypted/stored securely
- [ ] Audit logging enabled

## Performance Optimization

### Backend
- Enable gzip compression
- Configure connection pooling
- Use Redis for caching (optional)
- Optimize database queries

### Frontend
- Enable Next.js static optimization
- Use CDN for static assets
- Configure proper caching headers

## Troubleshooting

### Common Issues

1. **Database connection failed**
   - Verify DATABASE_URL format
   - Check firewall rules
   - Ensure database is running

2. **OAuth callback errors**
   - Verify redirect URIs match exactly
   - Check client ID/secret
   - Ensure OAuth providers are enabled

3. **Stripe webhooks not working**
   - Verify webhook secret
   - Check webhook endpoint is publicly accessible
   - Review Stripe logs for errors

### Check Logs

```bash
# View application logs
tail -f logs/app.log

# Check Docker logs
docker logs -f supplychain-ai
```

## Rollback Procedure

1. **Database rollback**:
   ```bash
   npm run prisma:migrate:deploy -- --to previous_migration_name
   ```

2. **Application rollback**:
   - Redeploy previous Docker image
   - Or revert to previous git tag

## Support

For deployment issues, contact: devops@example.com
