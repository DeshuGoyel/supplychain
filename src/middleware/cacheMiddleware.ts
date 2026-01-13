import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/cacheService';

interface CachedRequest extends Request {
  cacheKey?: string;
  cacheTTL?: number;
}

export const cacheMiddleware = (ttl: number = 600) => {
  return async (req: CachedRequest, res: Response, next: NextFunction) => {
    const { companyId } = req.user || {};
    const key = `cache:${companyId}:${req.path}:${JSON.stringify(req.query)}`;

    const cached = await cacheService.get(key);

    if (cached) {
      try {
        const data = JSON.parse(cached);
        res.setHeader('X-Cache', 'HIT');
        return res.json(data);
      } catch (error) {
        console.error('Cache parse error:', error);
      }
    }

    res.setHeader('X-Cache', 'MISS');

    const originalJson = res.json.bind(res);

    res.json = function (data: any) {
      if (res.statusCode === 200) {
        cacheService.set(key, JSON.stringify(data), ttl);
      }
      return originalJson(data);
    };

    next();
  };
};

export const cacheByKey = (keyGenerator: (req: Request) => string, ttl: number = 600) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);

    const cached = await cacheService.get(key);

    if (cached) {
      try {
        const data = JSON.parse(cached);
        res.setHeader('X-Cache', 'HIT');
        return res.json(data);
      } catch (error) {
        console.error('Cache parse error:', error);
      }
    }

    res.setHeader('X-Cache', 'MISS');

    const originalJson = res.json.bind(res);

    res.json = function (data: any) {
      if (res.statusCode === 200) {
        cacheService.set(key, JSON.stringify(data), ttl);
      }
      return originalJson(data);
    };

    next();
  };
};

export const invalidateCache = async (companyId: string): Promise<void> => {
  await cacheService.invalidateCompanyCache(companyId);
};
