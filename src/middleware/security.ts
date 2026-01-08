import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
};

export const contentSecurityPolicy = helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'", 'https:'],
    fontSrc: ["'self'", 'data:'],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
    upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
  }
});

export const sensitiveOperationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many sensitive operations. Please try again later.'
  },
  skip: (req) => {
    return req.method === 'GET';
  }
});

export const auditSensitiveOperation = (action: string, resource: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send.bind(res);

    res.send = function(this: Response, ...args: any[]): Response {
      const { user } = req as any;

      if (user && res.statusCode < 400) {
        import('../services/auditLog').then(({ auditLogService }) => {
          const logEntry: any = {
            companyId: user.companyId,
            userId: user.userId,
            action,
            resource,
            resourceId: req.params.id,
            changes: req.body,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
          };

          auditLogService.log(logEntry)
            .catch(err => console.error('Audit log error:', err));
        }).catch(err => console.error('Audit log import error:', err));
      }

      return originalSend.apply(this, [args[0]]);
    };

    next();
  };
};
