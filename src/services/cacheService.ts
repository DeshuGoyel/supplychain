import Redis from 'ioredis';

class CacheService {
  private redis: Redis | null = null;
  private isEnabled: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      console.warn('Redis URL not configured. Caching will be disabled.');
      return;
    }

    try {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      this.redis.on('connect', () => {
        console.log('Redis connected successfully');
        this.isEnabled = true;
      });

      this.redis.on('error', (error) => {
        console.error('Redis connection error:', error);
        this.isEnabled = false;
      });
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      this.isEnabled = false;
    }
  }

  private isAvailable(): boolean {
    return this.isEnabled && this.redis !== null;
  }

  async get(key: string): Promise<string | null> {
    if (!this.isAvailable()) return null;

    try {
      return await this.redis!.get(key);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      if (ttlSeconds) {
        await this.redis!.setex(key, ttlSeconds, value);
      } else {
        await this.redis!.set(key, value);
      }
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      await this.redis!.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async delPattern(pattern: string): Promise<number> {
    if (!this.isAvailable()) return 0;

    try {
      const keys = await this.redis!.keys(pattern);
      if (keys.length === 0) return 0;
      return await this.redis!.del(...keys);
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      return 0;
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Cache JSON parse error:', error);
      return null;
    }
  }

  async setJson(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      const jsonValue = JSON.stringify(value);
      return await this.set(key, jsonValue, ttlSeconds);
    } catch (error) {
      console.error('Cache JSON stringify error:', error);
      return false;
    }
  }

  async invalidateCompanyCache(companyId: string): Promise<void> {
    if (!this.isAvailable()) return;

    const patterns = [
      `kpi:${companyId}:*`,
      `dashboard:${companyId}*`,
      `supplier:${companyId}:*`,
      `inventory:${companyId}:*`,
      `analytics:${companyId}:*`,
    ];

    for (const pattern of patterns) {
      await this.delPattern(pattern);
    }

    console.log(`Cache invalidated for company ${companyId}`);
  }

  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<T> {
    const cached = await this.getJson<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    await this.setJson(key, value, ttlSeconds);
    return value;
  }

  async getStats(): Promise<{ enabled: boolean; keys: number; memory: string }> {
    if (!this.isAvailable()) {
      return { enabled: false, keys: 0, memory: '0B' };
    }

    try {
      const info = await this.redis!.info('memory');
      const memoryLine = info.split('\n').find(line => line.startsWith('used_memory_human:'));
      const memory = memoryLine ? memoryLine.split(':')[1].trim() : 'unknown';

      const keys = await this.redis!.dbsize();
      return { enabled: true, keys, memory };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { enabled: false, keys: 0, memory: 'unknown' };
    }
  }

  async flushAll(): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      await this.redis!.flushdb();
      console.log('Cache flushed successfully');
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }
}

export const cacheService = new CacheService();
