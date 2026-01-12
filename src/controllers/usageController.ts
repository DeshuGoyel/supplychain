import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get usage limits and current usage
 * GET /api/usage/limits
 */
export const getUsageLimits = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user.companyId;

    // Get or create usage limits
    let usageLimits = await prisma.usageLimit.findUnique({
      where: { companyId }
    });

    if (!usageLimits) {
      // Get plan limits based on subscription tier
      const company = await prisma.company.findUnique({
        where: { id: companyId }
      });

      const plan = await prisma.plan.findFirst({
        where: { tier: company?.subscriptionTier || 'starter', isActive: true }
      });

      usageLimits = await prisma.usageLimit.create({
        data: {
          companyId,
          apiCallsLimit: plan?.maxApiCalls || 10000,
          storageLimit: plan?.maxStorageGb || 5
        }
      });
    }

    // Get current billing period usage
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const apiCalls = await prisma.usageMetric.aggregate({
      where: {
        companyId,
        metricType: 'API_CALLS',
        period: { gte: periodStart }
      },
      _sum: { value: true }
    });

    const storage = await prisma.usageMetric.aggregate({
      where: {
        companyId,
        metricType: 'STORAGE_GB',
        period: { gte: periodStart }
      },
      _sum: { value: true }
    });

    const activeUsers = await prisma.usageMetric.aggregate({
      where: {
        companyId,
        metricType: 'ACTIVE_USERS',
        period: { gte: periodStart }
      },
      _sum: { value: true }
    });

    const apiCallsUsed = apiCalls._sum.value || 0;
    const storageUsed = storage._sum.value || 0;
    const activeUsersCount = activeUsers._sum.value || 0;

    res.status(200).json({
      success: true,
      limits: {
        apiCalls: usageLimits.apiCallsLimit,
        storage: usageLimits.storageLimit,
        activeUsers: 10 // Default, could be plan-based
      },
      usage: {
        apiCalls: apiCallsUsed,
        storage: storageUsed,
        activeUsers: activeUsersCount
      },
      percentages: {
        apiCalls: Math.round((apiCallsUsed / usageLimits.apiCallsLimit) * 100),
        storage: Math.round((storageUsed / usageLimits.storageLimit) * 100)
      },
      periodStart,
      periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0)
    });
  } catch (error) {
    console.error('Get usage limits error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error fetching usage limits'
    });
  }
};

/**
 * Get usage summary for current billing period
 * GET /api/usage/summary
 */
export const getUsageSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user.companyId;
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all metrics for current period
    const metrics = await prisma.usageMetric.groupBy({
      by: ['metricType'],
      where: {
        companyId,
        period: { gte: periodStart }
      },
      _sum: { value: true }
    });

    // Get plan limits
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    const plan = await prisma.plan.findFirst({
      where: { tier: company?.subscriptionTier || 'starter', isActive: true }
    });

    const summary = metrics.reduce((acc, m) => {
      acc[m.metricType] = m._sum.value || 0;
      return acc;
    }, {} as Record<string, number>);

    res.status(200).json({
      success: true,
      summary: {
        apiCalls: summary.API_CALLS || 0,
        ordersProcessed: summary.ORDERS_PROCESSED || 0,
        storage: summary.STORAGE_GB || 0,
        activeUsers: summary.ACTIVE_USERS || 0
      },
      limits: {
        apiCalls: plan?.maxApiCalls || 10000,
        ordersProcessed: 1000, // Default
        storage: plan?.maxStorageGb || 5,
        users: plan?.maxUsers || 5
      },
      periodStart,
      periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0)
    });
  } catch (error) {
    console.error('Get usage summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error fetching usage summary'
    });
  }
};

/**
 * Get usage history
 * GET /api/usage/history
 */
export const getUsageHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user.companyId;
    const months = parseInt(req.query.months as string) || 12;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const history = await prisma.usageMetric.findMany({
      where: {
        companyId,
        period: { gte: startDate }
      },
      orderBy: { period: 'asc' }
    });

    // Group by period
    const grouped = history.reduce((acc, m) => {
      const key = m.period.toISOString().split('T')[0];
      if (!acc[key]) acc[key] = {};
      acc[key][m.metricType] = m.value;
      return acc;
    }, {} as Record<string, Record<string, number>>);

    res.status(200).json({
      success: true,
      history: grouped
    });
  } catch (error) {
    console.error('Get usage history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error fetching usage history'
    });
  }
};

/**
 * Report usage
 * POST /api/usage/report
 */
export const reportUsage = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user.companyId;
    const { metricType, value } = req.body;

    if (!metricType || value === undefined) {
      res.status(400).json({
        success: false,
        message: 'metricType and value are required'
      });
      return;
    }

    const validTypes = ['API_CALLS', 'ORDERS_PROCESSED', 'ACTIVE_USERS', 'STORAGE_GB'];
    if (!validTypes.includes(metricType)) {
      res.status(400).json({
        success: false,
        message: `Invalid metricType. Must be one of: ${validTypes.join(', ')}`
      });
      return;
    }

    // Get current date at start of day
    const period = new Date();
    period.setHours(0, 0, 0, 0);

    // Upsert usage metric
    await prisma.usageMetric.upsert({
      where: {
        companyId_metricType_period: {
          companyId,
          metricType,
          period
        }
      },
      update: {
        value
      },
      create: {
        companyId,
        metricType,
        value,
        period
      }
    });

    // Update usage limits table for real-time tracking
    if (metricType === 'API_CALLS') {
      await prisma.usageLimit.update({
        where: { companyId },
        data: { apiCallsUsed: value }
      });
    } else if (metricType === 'STORAGE_GB') {
      await prisma.usageLimit.update({
        where: { companyId },
        data: { storageUsed: value }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Usage reported successfully'
    });
  } catch (error) {
    console.error('Report usage error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error reporting usage'
    });
  }
};

/**
 * Update usage limits
 * PUT /api/usage/limits
 */
export const updateUsageLimits = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user.companyId;
    const { apiCallsLimit, storageLimit } = req.body;

    const limits = await prisma.usageLimit.upsert({
      where: { companyId },
      update: {
        apiCallsLimit: apiCallsLimit || undefined,
        storageLimit: storageLimit || undefined
      },
      create: {
        companyId,
        apiCallsLimit: apiCallsLimit || 10000,
        storageLimit: storageLimit || 5
      }
    });

    res.status(200).json({
      success: true,
      message: 'Usage limits updated successfully',
      limits
    });
  } catch (error) {
    console.error('Update usage limits error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error updating usage limits'
    });
  }
};

/**
 * Reset usage counters
 * POST /api/usage/reset
 */
export const resetUsage = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user.companyId;
    const { metricType } = req.body;

    if (metricType) {
      // Reset specific metric
      const period = new Date();
      period.setDate(1); // First day of current month

      await prisma.usageMetric.updateMany({
        where: {
          companyId,
          metricType,
          period: { gte: period }
        },
        data: { value: 0 }
      });
    } else {
      // Reset all usage
      await prisma.usageLimit.update({
        where: { companyId },
        data: {
          apiCallsUsed: 0,
          storageUsed: 0,
          lastResetAt: new Date()
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Usage reset successfully'
    });
  } catch (error) {
    console.error('Reset usage error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error resetting usage'
    });
  }
};
