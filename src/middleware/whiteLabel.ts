import { Request, Response, NextFunction } from 'express';
import { whiteLabelService } from '../services/whiteLabelService';

const normalizeHost = (rawHost?: string): string | null => {
  if (!rawHost) return null;
  const host = rawHost.split(',')[0]?.trim();
  if (!host) return null;
  return host.toLowerCase().split(':')[0] || null;
};

export const whiteLabelMiddleware = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const forwardedHost = req.headers['x-forwarded-host'];
    const hostHeader = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost;

    const host = normalizeHost((hostHeader as string | undefined) ?? req.headers.host);
    if (!host) {
      next();
      return;
    }

    const config = await whiteLabelService.getByDomain(host);
    if (config) {
      (req as any).whiteLabel = config;
      (req as any).whiteLabelCompanyId = config.companyId;
    }

    next();
  } catch (error) {
    // Never block a request due to branding lookup
    next();
  }
};
