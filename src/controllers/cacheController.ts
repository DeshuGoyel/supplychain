import { Response, NextFunction } from 'express';
import { cacheService } from '../services/cacheService';
import { requireRole } from '../middleware/auth';

export const getCacheStats = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await cacheService.getStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const clearAllCache = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;

    const cleared = await cacheService.flushAll();

    res.json({
      success: true,
      data: {
        cleared,
        message: 'All cache cleared successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const clearCacheByType = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const { type } = req.params;

    let pattern = '';
    switch (type) {
      case 'kpi':
        pattern = `kpi:${companyId}:*`;
        break;
      case 'dashboard':
        pattern = `dashboard:${companyId}*`;
        break;
      case 'supplier':
        pattern = `supplier:*:metrics`;
        break;
      case 'inventory':
        pattern = `inventory:${companyId}:*`;
        break;
      case 'analytics':
        pattern = `analytics:${companyId}:*`;
        break;
      case 'forecast':
        pattern = `forecast:*`;
        break;
      default:
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CACHE_TYPE',
            message: 'Invalid cache type',
          },
        });
        return;
    }

    const keysCleared = await cacheService.delPattern(pattern);

    res.json({
      success: true,
      data: {
        type,
        keysCleared,
        message: `Cache of type '${type}' cleared successfully`,
      },
    });
  } catch (error) {
    next(error);
  }
};
