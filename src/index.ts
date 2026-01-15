import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import { globalRateLimiter } from './middleware/rateLimiter';
import { requestLogger, errorLogger, performanceMonitor } from './middleware/advancedLogger';
import compression from 'compression';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { scheduledTasks } from './jobs/scheduledTasks';
import { enhancedHealthCheck, globalErrorHandler, notFoundHandler, validateEnvironment } from './middleware/errorHandler';
import { apiRateLimiter, monitorDatabaseHealth, monitorMemoryUsage } from './middleware/production';
import { securityHeaders } from './middleware/security';

// Import routes
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import inventoryRoutes from './routes/inventory';
import supplierRoutes from './routes/suppliers';
import purchaseOrderRoutes from './routes/purchaseOrders';
import shipmentRoutes from './routes/shipments';
import demandRoutes from './routes/demand';
import analyticsRoutes from './routes/analytics';
import whitelabelRoutes from './routes/whitelabel';
import ssoRoutes from './routes/sso';
import twoFactorRoutes from './routes/twoFactor';
import auditRoutes from './routes/audit';
import billingRoutes from './routes/billing';
import webhookRoutes from './routes/webhooks';
import legalRoutes from './routes/legal';
import usageRoutes from './routes/usage';
import subscriptionRoutes from './routes/subscription';
import notificationRoutes from './routes/notifications';
import supplierEnhancedRoutes from './routes/supplierEnhanced';
import forecastRoutes from './routes/forecasts';
import reportRoutes from './routes/reports';
import bulkOperationRoutes from './routes/bulkOperations';
import cacheRoutes from './routes/cache';
import path from 'path';

// Load environment variables
dotenv.config();

// Validate environment on startup
try {
  validateEnvironment();
  console.log('✅ Environment validation passed');
} catch (error) {
  console.error('❌ Environment validation failed:', error.message);
  process.exit(1);
}

const app: Application = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Create HTTP server for Socket.IO
const httpServer = createServer(app);

// Initialize Socket.IO for real-time updates
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('dashboard:subscribe', (data: { companyId: string }) => {
    socket.join(`dashboard:${data.companyId}`);
    console.log(`Client subscribed to dashboard: ${data.companyId}`);
  });

  socket.on('dashboard:unsubscribe', (data: { companyId: string }) => {
    socket.leave(`dashboard:${data.companyId}`);
    console.log(`Client unsubscribed from dashboard: ${data.companyId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Export io for use in other modules
export { io };

// CORS configuration
const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com", "wss:"],
      frameSrc: ["'self'", "https://js.stripe.com"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Custom security headers
app.use(securityHeaders);

// Webhook routes (must be before body parsers for raw body access)
app.use('/api/webhooks', webhookRoutes);

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use(requestLogger);
app.use(performanceMonitor);

// Rate limiting middleware
app.use(globalRateLimiter);

// Passport middleware
app.use(passport.initialize());

// Serve static files from public directory
app.use(express.static(path.join(process.cwd(), 'public')));

// Health check endpoint with enhanced monitoring
app.get('/api/health', enhancedHealthCheck);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/suppliers', supplierEnhancedRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/demand', demandRoutes);
app.use('/api/forecasts', forecastRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/whitelabel', whitelabelRoutes);
app.use('/api/sso', ssoRoutes);
app.use('/api/auth/2fa', twoFactorRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/legal', legalRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/bulk', bulkOperationRoutes);
app.use('/api/cache', cacheRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Supply Chain AI Control Assistant API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      dashboard: '/api/dashboard',
      inventory: '/api/inventory',
      suppliers: '/api/suppliers',
      purchaseOrders: '/api/purchase-orders',
      shipments: '/api/shipments',
      demand: '/api/demand',
      analytics: '/api/analytics',
      whitelabel: '/api/whitelabel'
    }
  });
});

// 404 handler
app.use('*', notFoundHandler);

// Global error handler
app.use(globalErrorHandler);

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
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📝 API Documentation: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server: http://localhost:${PORT}`);
});

export default app;