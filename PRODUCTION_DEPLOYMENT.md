# Production Deployment Guide

## Overview
This guide covers deploying the Supply Chain AI Control Assistant to production using Railway (backend) and Vercel (frontend).

## Prerequisites
- Railway account (https://railway.app)
- Vercel account (https://vercel.com)
- GitHub repository (for automatic deployments)
- Stripe account (for payments)
- SendGrid account (for emails)

## Backend Deployment (Railway)

### 1. Database Setup
1. Create a new project on Railway
2. Add PostgreSQL database service
3. Note the `DATABASE_URL` connection string

### 2. Backend Service Setup
1. Create a new service in Railway
2. Connect to your GitHub repository
3. Select the root directory (backend code)
4. Railway will auto-detect the Node.js build

### 3. Environment Variables
Add the following environment variables in Railway dashboard:

```
DATABASE_URL=<your-railway-postgres-url>
JWT_SECRET=<generate-secure-random-string-32-chars>
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=production
CORS_ORIGINS=https://your-frontend-domain.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
STRIPE_SECRET_KEY=<your-stripe-secret-key>
STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>
STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>
SENDGRID_API_KEY=<your-sendgrid-api-key>
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Supply Chain Control Tower
FRONTEND_URL=https://your-frontend-domain.vercel.app
SENTRY_DSN=<your-sentry-dsn>
MIXPANEL_TOKEN=<your-mixpanel-token>
```

### 4. Build & Deploy
1. Railway will automatically build and deploy on git push
2. Your backend will be available at: `https://your-project.railway.app`

### 5. Database Migration
```bash
# Connect to Railway shell
railway run npx prisma migrate deploy
railway run npx prisma generate
railway run npm run seed
```

## Frontend Deployment (Vercel)

### 1. Project Setup
1. Go to Vercel dashboard
2. Click "New Project"
3. Import your GitHub repository
4. Select the `frontend` directory as root directory

### 2. Environment Variables
Add the following in Vercel dashboard:

```
NEXT_PUBLIC_API_URL=https://your-project.railway.app
```

### 3. Build Settings
- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

### 4. Deploy
1. Click "Deploy"
2. Vercel will build and deploy automatically
3. Your app will be available at: `https://your-project.vercel.app`

### 5. Custom Domain (Optional)
1. Go to Project Settings > Domains
2. Add your custom domain (e.g., app.yourdomain.com)
3. Update DNS records as instructed by Vercel
4. Update CORS_ORIGINS in Railway backend

## Post-Deployment Setup

### 1. Stripe Webhooks
1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://your-project.railway.app/api/webhooks/stripe`
3. Select events: `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`
4. Copy webhook signing secret to Railway env vars

### 2. SendGrid Setup
1. Verify sender email in SendGrid
2. Create email templates for welcome, payment confirmation, trial reminder
3. Note template IDs and update backend code if needed

### 3. Monitoring Setup

#### Sentry (Error Tracking)
1. Create project on Sentry.io
2. Copy DSN and add to env vars
3. Errors will be automatically tracked

#### Mixpanel (Analytics)
1. Create project on Mixpanel
2. Copy project token
3. Add to env vars

### 4. Health Check
Test the deployment:
```bash
curl https://your-project.railway.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-05T...",
  "environment": "production",
  "version": "1.0.0",
  "database": "connected"
}
```

## Security Checklist

- [ ] JWT_SECRET is strong and unique
- [ ] CORS_ORIGINS is set to frontend domain only (no *)
- [ ] Rate limiting is enabled
- [ ] Database has SSL enabled
- [ ] All API keys are in environment variables (not hardcoded)
- [ ] Stripe is in live mode (not test mode)
- [ ] SendGrid is verified and sending real emails

## Monitoring & Maintenance

### Daily Checks
- Check Sentry for errors
- Monitor Railway logs for issues
- Check Stripe dashboard for failed payments

### Weekly Checks
- Review Mixpanel analytics
- Check database performance
- Review rate limiting logs

### Monthly Tasks
- Update dependencies (`npm outdated`, `npm update`)
- Review and optimize database queries
- Check and renew SSL certificates (automatic with Vercel/Railway)

## Scaling

### Backend Scaling (Railway)
- Railway auto-scales based on usage
- Monitor CPU/Memory usage in dashboard
- Upgrade plan if needed

### Frontend Scaling (Vercel)
- Vercel auto-scales globally via CDN
- Monitor bandwidth usage
- Upgrade plan if needed

### Database Scaling
- Monitor connection pool usage
- Upgrade PostgreSQL plan on Railway if needed
- Consider read replicas for heavy read workloads

## Troubleshooting

### Backend won't start
- Check Railway logs
- Verify all environment variables are set
- Check DATABASE_URL is correct
- Run `npx prisma generate` if Prisma client is missing

### Frontend won't connect to backend
- Check CORS_ORIGINS includes frontend domain
- Verify NEXT_PUBLIC_API_URL is correct
- Check backend is running and accessible

### Database connection errors
- Check DATABASE_URL format
- Verify SSL is enabled
- Check connection pool settings

### Stripe webhooks failing
- Verify webhook URL is correct
- Check webhook signing secret matches
- Review Stripe webhook logs

## Support & Resources

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Stripe Docs: https://stripe.com/docs
- SendGrid Docs: https://docs.sendgrid.com
- Prisma Docs: https://www.prisma.io/docs
