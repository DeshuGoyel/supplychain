import { PrismaClient, WhiteLabel } from '@prisma/client';

type WhiteLabelWithCompany = WhiteLabel & {
  company: {
    id: string;
    name: string;
  };
};

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const normalizeDomain = (raw: string): string => {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*/, '')
    .split(':')[0] || raw;
};

export class WhiteLabelService {
  private readonly prisma: PrismaClient;
  private readonly ttlMs: number;
  private readonly byDomain = new Map<string, CacheEntry<WhiteLabelWithCompany | null>>();
  private readonly byCompany = new Map<string, CacheEntry<WhiteLabelWithCompany | null>>();

  constructor(prisma?: PrismaClient, ttlMs: number = 5 * 60 * 1000) {
    this.prisma = prisma ?? new PrismaClient();
    this.ttlMs = ttlMs;
  }

  private getFromCache<T>(map: Map<string, CacheEntry<T>>, key: string): T | undefined {
    const entry = map.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      map.delete(key);
      return undefined;
    }
    return entry.value;
  }

  private setCache<T>(map: Map<string, CacheEntry<T>>, key: string, value: T): void {
    map.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  invalidateCompany(companyId: string): void {
    this.byCompany.delete(companyId);
  }

  invalidateDomain(domain: string): void {
    this.byDomain.delete(normalizeDomain(domain));
  }

  async getByDomain(domain: string): Promise<WhiteLabelWithCompany | null> {
    const normalized = normalizeDomain(domain);

    const cached = this.getFromCache(this.byDomain, normalized);
    if (cached !== undefined) return cached;

    const config = await this.prisma.whiteLabel.findFirst({
      where: {
        customDomain: normalized,
        enabled: true,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    this.setCache(this.byDomain, normalized, config);
    if (config) this.setCache(this.byCompany, config.companyId, config);

    return config;
  }

  async getByCompanyId(companyId: string): Promise<WhiteLabelWithCompany | null> {
    const cached = this.getFromCache(this.byCompany, companyId);
    if (cached !== undefined) return cached;

    const config = await this.prisma.whiteLabel.findUnique({
      where: { companyId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    this.setCache(this.byCompany, companyId, config);
    if (config?.customDomain) this.setCache(this.byDomain, normalizeDomain(config.customDomain), config);

    return config;
  }
}

export const whiteLabelService = new WhiteLabelService();
