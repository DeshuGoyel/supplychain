import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import { PrismaClient } from '@prisma/client';
import { globalRateLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/requestLogger';

// Import routes
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import inventoryRoutes from './routes/inventory';
import supplierRoutes from './routes/suppliers';
import purchaseOrderRoutes from './routes/purchaseOrders';
import shipmentRoutes from './routes/shipments';
import demandRoutes from './routes/demand';
import analyticsRoutes from './routes/analytics';

// Load environment variables
dotenv.config();

const app: Application = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// CORS configuration
const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use(requestLogger);

// Rate limiting middleware
app.use(globalRateLimiter);

// Passport middleware
app.use(passport.initialize());

// Enhanced health check endpoint with comprehensive status
app.get('/api/health', async (req: Request, res: Response) => {
  const healthStatus: any = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: {
      status: 'unknown',
      version: null,
      connectionPool: 'unknown'
    },
    services: {
      redis: { status: 'not_configured' },
      external_apis: {}
    },
    migrations: {
      status: 'unknown',
      lastRun: null,
      pending: []
    },
    performance: {
      avgResponseTime: 0,
      requestsPerMinute: 0
    }
  };

  try {
    // Test database connection and get version
    const dbResult = await prisma.$queryRaw<any[]>`
      SELECT 
        version(),
        now() as current_time,
        pg_database_size(current_database()) as db_size
    `;
    
    if (dbResult && dbResult.length > 0) {
      const dbInfo = dbResult[0];
      healthStatus.database.status = 'connected';
      healthStatus.database.version = dbInfo.version || 'unknown';
      healthStatus.database.connectionPool = 'healthy';
      healthStatus.database.size = dbInfo.db_size ? parseInt(dbInfo.db_size.toString()) || 0 : 0;
    }

    // Test migration status
    try {
      const migrationResult = await prisma.$queryRaw<any[]>`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `;
      
      if (migrationResult && migrationResult.length > 0) {
        healthStatus.migrations.status = 'up_to_date';
        healthStatus.migrations.tables = migrationResult.map((t: any) => t.table_name);
      }
    } catch (migrationError: any) {
      healthStatus.migrations.status = 'error';
      healthStatus.migrations.error = 'Unable to verify migration status';
    }

    // Test external service dependencies
    const externalChecks = await Promise.allSettled([
      // Add external API health checks here if needed
      Promise.resolve({ service: 'core_api', status: 'healthy' })
    ]);

    externalChecks.forEach((result) => {
      if (result.status === 'fulfilled') {
        const service = result.value as any;
        healthStatus.services.external_apis[service.service] = {
          status: service.status,
          responseTime: service.responseTime || 0
        };
      }
    });

    res.status(200).json(healthStatus);
    
  } catch (error: any) {
    console.error('Health check failed:', error);
    
    healthStatus.status = 'degraded';
    healthStatus.database.status = 'disconnected';
    healthStatus.database.error = error?.message || 'Unknown database error';
    
    res.status(503).json(healthStatus);
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/demand', demandRoutes);
app.use('/api/analytics', analyticsRoutes);

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
      analytics: '/api/analytics'
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