import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// Rate limiting store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const apiRateLimiter = (windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    
    // Clean up expired entries
    for (const [storeKey, value] of rateLimitStore.entries()) {
      if (value.resetTime < now) {
        rateLimitStore.delete(storeKey);
      }
    }
    
    // Get current count
    const current = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs };
    
    // Reset if window has passed
    if (current.resetTime < now) {
      current.count = 0;
      current.resetTime = now + windowMs;
    }
    
    current.count++;
    rateLimitStore.set(key, current);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - current.count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(current.resetTime).toISOString());
    
    // Check if limit exceeded
    if (current.count > maxRequests) {
      const retryAfter = Math.ceil((current.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later.',
          retryAfter
        },
        timestamp: new Date().toISOString(),
        requestId: req.requestId || uuidv4()
      });
    }
    
    next();
  };
};

export const strictApiRateLimiter = apiRateLimiter(15 * 60 * 1000, 10); // 10 requests per 15 minutes

export const authRateLimiter = apiRateLimiter(15 * 60 * 1000, 5); // 5 auth attempts per 15 minutes

export const webhookRateLimiter = apiRateLimiter(60 * 1000, 60); // 60 webhooks per minute

// Cache middleware for performance
export const cache = (duration: number = 300) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }
    
    const key = `cache:${req.originalUrl}`;
    const cached = cacheStore.get(key);
    
    if (cached && cached.expires > Date.now()) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached.data);
    }
    
    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(body) {
      cacheStore.set(key, {
        data: body,
        expires: Date.now() + (duration * 1000)
      });
      res.setHeader('X-Cache', 'MISS');
      return originalJson.call(this, body);
    };
    
    next();
  };
};

// Simple in-memory cache (use Redis in production)
const cacheStore = new Map<string, { data: any; expires: number }>();

// Cleanup cache every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cacheStore.entries()) {
    if (value.expires <= now) {
      cacheStore.delete(key);
    }
  }
}, 60000);

// Database connection pool monitoring
export const monitorDatabaseHealth = (prisma: PrismaClient) => {
  setInterval(async () => {
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - start;
      
      // Log slow database queries
      if (responseTime > 1000) {
        console.warn(`Slow database query detected: ${responseTime}ms`);
      }
    } catch (error) {
      console.error('Database health check failed:', error);
    }
  }, 30000); // Check every 30 seconds
};

// Memory usage monitoring
export const monitorMemoryUsage = () => {
  setInterval(() => {
    const usage = process.memoryUsage();
    const usageMB = {
      rss: Math.round(usage.rss / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024)
    };
    
    // Log high memory usage
    if (usageMB.heapUsed > 500) {
      console.warn(`High memory usage detected: ${JSON.stringify(usageMB)}`);
    }
  }, 60000); // Check every minute
};

// Security monitoring
export const monitorSecurityEvents = (req: Request, event: string, details: any) => {
  const securityLog = {
    event,
    details,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  };
  
  // In production, send to external security service
  console.warn('Security event:', JSON.stringify(securityLog, null, 2));
};

// Performance tracking
export const trackApiPerformance = (req: Request, res: Response, duration: number) => {
  const performanceData = {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent'),
    requestId: req.requestId
  };
  
  // Log slow requests
  if (duration > 1000) {
    console.warn('Slow API request:', JSON.stringify(performanceData, null, 2));
  }
};