import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import helmet from 'helmet';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { globalRateLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/requestLogger';
import { optionalAuthMiddleware } from './middleware/auth';
import { whiteLabelMiddleware } from './middleware/whiteLabel';

// Import routes
import samlRoutes from './routes/saml';
import twofaRoutes from './routes/twofa';
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import inventoryRoutes from './routes/inventory';
import supplierRoutes from './routes/suppliers';
import purchaseOrderRoutes from './routes/purchaseOrders';
import shipmentRoutes from './routes/shipments';
import demandRoutes from './routes/demand';
import analyticsRoutes from './routes/analytics';
import whiteLabelRoutes from './routes/whitelabel';
import auditRoutes from './routes/audit';

// Load environment variables
dotenv.config();

const app: Application = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', 1);

// CORS configuration
const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security headers
app.use(
  helmet({
    frameguard: { action: 'deny' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'self'"],
      },
    },
    hsts: process.env.NODE_ENV === 'production',
  })
);

// Enforce HTTPS in production behind a proxy
app.use((req: Request, res: Response, next) => {
  if (process.env.NODE_ENV === 'production') {
    const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol;
    if (proto !== 'https') {
      res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
      return;
    }
  }
  next();
});

// Static uploads (local development fallback)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Optional auth + white-label headers
app.use(optionalAuthMiddleware);
app.use(whiteLabelMiddleware);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use(requestLogger);

// Rate limiting middleware
app.use(globalRateLimiter);

// Passport middleware
app.use(passport.initialize());

// Health check endpoint with DB connection test
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      database: 'disconnected'
    });
  }
});

// API routes
app.use('/api/auth/saml', samlRoutes);
app.use('/api/auth/2fa', twofaRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/demand', demandRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/white-label', whiteLabelRoutes);
app.use('/api/audit-logs', auditRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Supply Chain AI Control Assistant API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      saml: '/api/auth/saml',
      twoFactor: '/api/auth/2fa',
      dashboard: '/api/dashboard',
      inventory: '/api/inventory',
      suppliers: '/api/suppliers',
      purchaseOrders: '/api/purchase-orders',
      shipments: '/api/shipments',
      demand: '/api/demand',
      analytics: '/api/analytics',
      whiteLabel: '/api/white-label',
      auditLogs: '/api/audit-logs'
    }
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Global error handler:', err);
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  try {
    await prisma.$disconnect();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📝 API Documentation: http://localhost:${PORT}`);
});

export default app;