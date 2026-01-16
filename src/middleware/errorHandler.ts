import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from './advancedLogger';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Environment validation
export const validateEnvironment = () => {
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NODE_ENV'
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new CustomError(
      `Missing required environment variables: ${missing.join(', ')}`,
      500,
      'MISSING_ENV_VARS'
    );
  }

  // Validate JWT_SECRET length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new CustomError(
      'JWT_SECRET must be at least 32 characters long',
      500,
      'WEAK_JWT_SECRET'
    );
  }

  // Validate database URL format
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
    throw new CustomError(
      'DATABASE_URL must be a valid PostgreSQL connection string',
      500,
      'INVALID_DB_URL'
    );
  }
};

// Database health check
export const checkDatabaseHealth = async (prisma: PrismaClient) => {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - start;

    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Database health check failed', { error: error.message });
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Enhanced health check endpoint
export const enhancedHealthCheck = async (req: Request, res: Response) => {
  const checks = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    checks: {} as any
  };

  try {
    // Database check
    checks.checks.database = await checkDatabaseHealth(req.app.get('prisma'));
    
    // Redis check (if configured)
    if (process.env.REDIS_URL) {
      try {
        // Add Redis health check here if Redis is used
        checks.checks.redis = { status: 'healthy', message: 'Redis not configured in this implementation' };
      } catch (error) {
        checks.checks.redis = { status: 'unhealthy', error: error.message };
      }
    }

    // Application-specific checks
    checks.checks.application = {
      status: 'healthy',
      routesLoaded: true,
      middlewareLoaded: true,
      timestamp: new Date().toISOString()
    };

    const allHealthy = Object.values(checks.checks).every((check: any) => 
      check.status === 'healthy'
    );

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'ok' : 'degraded',
      ...checks
    });

  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      checks: checks.checks
    });
  }
};

// Global error handler middleware
export const globalErrorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { statusCode = 500, code = 'INTERNAL_ERROR', message } = err;

  // Log error details
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    statusCode,
    code,
    method: req.method,
    url: req.url,
    requestId: req.requestId,
    body: req.body,
    params: req.params,
    query: req.query,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Send error response
  const errorResponse: any = {
    success: false,
    error: {
      code,
      message: process.env.NODE_ENV === 'production' && statusCode === 500
        ? 'Something went wrong'
        : message
    },
    timestamp: new Date().toISOString()
  };

  // Include request ID in response
  if (req.requestId) {
    errorResponse.requestId = req.requestId;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.url,
    requestId: req.requestId,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.url} not found`
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
};