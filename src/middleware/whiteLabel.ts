import { NextFunction, Request, Response } from 'express';
import { PrismaClient, WhiteLabelStatus } from '@prisma/client';

const prisma = new PrismaClient();

type CacheEntry = {
  expiresAt: number;
  data: any;
};

const cache = new Map<string, CacheEntry>();

const getCached = (key: string) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
};

const setCached = (key: string, data: any, ttlMs = 5 * 60 * 1000) => {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
};

export const whiteLabelMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const host = req.hostname;
    const user = (req as any).user;

    const cacheKey = user?.companyId ? `company:${user.companyId}` : `host:${host}`;
    let config = getCached(cacheKey);

    if (!config) {
      if (user?.companyId) {
        config = await prisma.whiteLabelConfig.findUnique({ where: { companyId: user.companyId } });
      } else {
        config = await prisma.whiteLabelConfig.findFirst({
          where: { customDomain: host, status: WhiteLabelStatus.ACTIVE },
        });
      }

      setCached(cacheKey, config || null);
    }

    if (config) {
      res.setHeader('X-WhiteLabel-Primary-Color', config.primaryColor || '');
      res.setHeader('X-WhiteLabel-Secondary-Color', config.secondaryColor || '');
      res.setHeader('X-WhiteLabel-Font-Family', config.fontFamily || '');
      res.setHeader('X-WhiteLabel-Logo-Url', config.logoUrl || '');
      res.setHeader('X-WhiteLabel-Favicon-Url', config.faviconUrl || '');
      res.setHeader('X-WhiteLabel-Header-Text', config.headerText || '');
      res.setHeader('X-WhiteLabel-Footer-Text', config.footerText || '');
      res.setHeader('X-WhiteLabel-Removed-Branding', String(Boolean(config.removedBranding)));
      res.setHeader('X-WhiteLabel-Help-Center-Url', config.customHelpCenterUrl || '');
      res.setHeader('X-WhiteLabel-Status', config.status || '');
    }
  } catch {
    // ignore theme errors
  }

  next();
};
