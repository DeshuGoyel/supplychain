import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const isAdmin = (role: string) => {
  return role === 'ADMIN' || role === 'MANAGER';
};

/**
 * MRR calculation
 * GET /api/analytics/mrr
 */
export const getMRR = async (req: any, res: Response): Promise<void> => {
  try {
    if (!isAdmin(req.user.role)) {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const activeSubs = await prisma.subscription.findMany({
      where: {
        status: { in: ['active', 'trialing'] }
      }
    });

    // Simple MRR based on tier (in a real system we'd use Stripe amounts)
    const tierPricing: Record<string, number> = {
      starter: 99,
      growth: 299,
      enterprise: 0
    };

    const mrr = activeSubs.reduce((sum, sub) => {
      const base = tierPricing[sub.tier] || 0;
      return sum + (sub.billingCycle === 'annual' ? base / 12 : base);
    }, 0);

    res.status(200).json({
      success: true,
      mrr,
      currency: 'USD',
      activeSubscriptions: activeSubs.length
    });
  } catch (error: any) {
    console.error('Get MRR error:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate MRR', error: error.message });
  }
};

/**
 * ARR calculation
 * GET /api/analytics/arr
 */
export const getARR = async (req: any, res: Response): Promise<void> => {
  try {
    if (!isAdmin(req.user.role)) {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const activeSubs = await prisma.subscription.findMany({
      where: {
        status: { in: ['active', 'trialing'] }
      }
    });

    const tierPricing: Record<string, number> = {
      starter: 99,
      growth: 299,
      enterprise: 0
    };

    const mrr = activeSubs.reduce((sum, sub) => {
      const base = tierPricing[sub.tier] || 0;
      return sum + (sub.billingCycle === 'annual' ? base / 12 : base);
    }, 0);

    res.status(200).json({
      success: true,
      arr: mrr * 12,
      currency: 'USD',
      activeSubscriptions: activeSubs.length
    });
  } catch (error: any) {
    console.error('Get ARR error:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate ARR', error: error.message });
  }
};

/**
 * Churn calculation
 * GET /api/analytics/churn
 */
export const getChurn = async (req: any, res: Response): Promise<void> => {
  try {
    if (!isAdmin(req.user.role)) {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const activeAtStart = await prisma.subscription.count({
      where: {
        createdAt: { lte: startOfPrevMonth },
        status: { in: ['active', 'trialing'] }
      }
    });

    const churnedThisMonth = await prisma.subscription.count({
      where: {
        updatedAt: { gte: startOfMonth },
        status: 'canceled'
      }
    });

    const churnRate = activeAtStart === 0 ? 0 : (churnedThisMonth / activeAtStart) * 100;

    res.status(200).json({
      success: true,
      churnRate,
      churnedThisMonth,
      activeAtStart
    });
  } catch (error: any) {
    console.error('Get churn error:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate churn', error: error.message });
  }
};

/**
 * LTV / CAC placeholder
 * GET /api/analytics/ltv-cac
 */
export const getLtvCac = async (req: any, res: Response): Promise<void> => {
  try {
    if (!isAdmin(req.user.role)) {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    // Placeholder: In real system you'd track acquisition cost and lifetime revenue
    const ltv: number = 5000;
    const cac: number = 500;

    res.status(200).json({
      success: true,
      ltv,
      cac,
      ratio: cac === 0 ? 0 : (ltv / cac)
    });
  } catch (error: any) {
    console.error('Get LTV/CAC error:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate LTV/CAC', error: error.message });
  }
};

/**
 * Cohort analysis placeholder
 * GET /api/analytics/cohorts
 */
export const getCohorts = async (req: any, res: Response): Promise<void> => {
  try {
    if (!isAdmin(req.user.role)) {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    res.status(200).json({
      success: true,
      cohorts: []
    });
  } catch (error: any) {
    console.error('Get cohorts error:', error);
    res.status(500).json({ success: false, message: 'Failed to get cohorts', error: error.message });
  }
};

/**
 * Expansion revenue placeholder
 * GET /api/analytics/expansion
 */
export const getExpansion = async (req: any, res: Response): Promise<void> => {
  try {
    if (!isAdmin(req.user.role)) {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    res.status(200).json({
      success: true,
      expansionRevenue: 0
    });
  } catch (error: any) {
    console.error('Get expansion error:', error);
    res.status(500).json({ success: false, message: 'Failed to get expansion revenue', error: error.message });
  }
};

/**
 * Retention placeholder
 * GET /api/analytics/retention
 */
export const getRetention = async (req: any, res: Response): Promise<void> => {
  try {
    if (!isAdmin(req.user.role)) {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    res.status(200).json({
      success: true,
      retention: []
    });
  } catch (error: any) {
    console.error('Get retention error:', error);
    res.status(500).json({ success: false, message: 'Failed to get retention data', error: error.message });
  }
};
