import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, originalUrl } = req;
  const userAgent = req.get('user-agent') || 'unknown';
  const ip = req.ip || req.connection.remoteAddress || 'unknown';

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    
    const logLevel = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO';
    const timestamp = new Date().toISOString();
    
    console.log(
      `[${timestamp}] [${logLevel}] ${method} ${originalUrl} - ${statusCode} - ${duration}ms - IP: ${ip}`
    );
  });

  next();
};
