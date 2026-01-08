import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PRICING_TIERS } from '../utils/stripe';

const prisma = new PrismaClient();

// Calculate MRR (Monthly Recurring Revenue)
export async function getMRR(req: Request, res: Response) {
  try {
    const period = req.query.period as string || new Date().toISOString().slice(0, 7);

    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        status: { in: ['active', 'trialing'] },
      },
    });

    let mrr = 0;
    let breakdown: Record<string, { count: number; revenue: number }> = {
      starter: { count: 0, revenue: 0 },
      growth: { count: 0, revenue: 0 },
      enterprise: { count: 0, revenue: 0 },
    };

    activeSubscriptions.forEach((sub) => {
      if (sub.status === 'active') {
        const tier = sub.tier as keyof typeof PRICING_TIERS;
        const price = PRICING_TIERS[tier]?.price || 0;
        mrr += price;
        breakdown[tier].count += 1;
        breakdown[tier].revenue += price;
      }
    });

    // Get historical MRR
    const metric = await prisma.revenueMetric.findUnique({
      where: { period },
    });

    res.json({
      period,
      mrr,
      arr: mrr * 12,
      breakdown,
      historical: metric || null,
    });
  } catch (error: any) {
    console.error('Error calculating MRR:', error);
    res.status(500).json({ error: error.message || 'Failed to calculate MRR' });
  }
}

// Calculate churn rate
export async function getChurnRate(req: Request, res: Response) {
  try {
    const period = req.query.period as string || new Date().toISOString().slice(0, 7);
    const [year, month] = period.split('-').map(Number);

    // Get start and end of period
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Count active subscriptions at start of period
    const startCount = await prisma.subscription.count({
      where: {
        createdAt: { lte: startDate },
        status: { in: ['active', 'trialing'] },
      },
    });

    // Count churned subscriptions during period
    const churnedCount = await prisma.subscription.count({
      where: {
        status: 'cancelled',
        updatedAt: { gte: startDate, lte: endDate },
      },
    });

    const churnRate = startCount > 0 ? (churnedCount / startCount) * 100 : 0;

    // Get historical data for trend
    const historicalMetrics = await prisma.revenueMetric.findMany({
      orderBy: { period: 'desc' },
      take: 6,
    });

    res.json({
      period,
      churnRate: parseFloat(churnRate.toFixed(2)),
      churnedCount,
      totalAtStart: startCount,
      trend: historicalMetrics.map((m) => ({
        period: m.period,
        churnRate: m.churnRate,
      })),
    });
  } catch (error: any) {
    console.error('Error calculating churn rate:', error);
    res.status(500).json({ error: error.message || 'Failed to calculate churn rate' });
  }
}

// Calculate LTV and CAC
export async function getLTVCAC(req: Request, res: Response) {
  try {
    // Get all active subscriptions
    const activeSubscriptions = await prisma.subscription.findMany({
      where: { status: 'active' },
    });

    // Calculate average subscription value
    let totalRevenue = 0;
    activeSubscriptions.forEach((sub) => {
      const tier = sub.tier as keyof typeof PRICING_TIERS;
      totalRevenue += PRICING_TIERS[tier]?.price || 0;
    });

    const averageRevenue = activeSubscriptions.length > 0
      ? totalRevenue / activeSubscriptions.length
      : 0;

    // Estimate average lifetime (in months) - simplified calculation
    // In production, this would be calculated from actual customer lifetime data
    const averageLifetimeMonths = 24; // 2 years average

    const ltv = averageRevenue * averageLifetimeMonths;

    // CAC (Customer Acquisition Cost) - simplified
    // In production, this would be calculated from actual marketing spend
    const estimatedCAC = 500; // Placeholder value

    const ltvCacRatio = estimatedCAC > 0 ? ltv / estimatedCAC : 0;

    res.json({
      ltv: parseFloat(ltv.toFixed(2)),
      cac: estimatedCAC,
      ltvCacRatio: parseFloat(ltvCacRatio.toFixed(2)),
      averageRevenue: parseFloat(averageRevenue.toFixed(2)),
      averageLifetimeMonths,
    });
  } catch (error: any) {
    console.error('Error calculating LTV/CAC:', error);
    res.status(500).json({ error: error.message || 'Failed to calculate LTV/CAC' });
  }
}

// Get cohort analysis
export async function getCohortAnalysis(req: Request, res: Response) {
  try {
    const months = parseInt(req.query.months as string) || 6;

    // Get subscriptions grouped by signup month
    const subscriptions = await prisma.subscription.findMany({
      orderBy: { createdAt: 'asc' },
    });

    const cohorts: Record<string, any> = {};

    subscriptions.forEach((sub) => {
      const cohortMonth = sub.createdAt.toISOString().slice(0, 7);
      if (!cohorts[cohortMonth]) {
        cohorts[cohortMonth] = {
          month: cohortMonth,
          totalCustomers: 0,
          activeCustomers: 0,
          revenue: 0,
        };
      }
      cohorts[cohortMonth].totalCustomers += 1;
      if (sub.status === 'active') {
        cohorts[cohortMonth].activeCustomers += 1;
        const tier = sub.tier as keyof typeof PRICING_TIERS;
        cohorts[cohortMonth].revenue += PRICING_TIERS[tier]?.price || 0;
      }
    });

    const cohortArray = Object.values(cohorts)
      .slice(-months)
      .map((c: any) => ({
        ...c,
        retentionRate: c.totalCustomers > 0
          ? (c.activeCustomers / c.totalCustomers) * 100
          : 0,
      }));

    res.json({ cohorts: cohortArray });
  } catch (error: any) {
    console.error('Error getting cohort analysis:', error);
    res.status(500).json({ error: error.message || 'Failed to get cohort analysis' });
  }
}

// Get expansion revenue
export async function getExpansionRevenue(req: Request, res: Response) {
  try {
    const period = req.query.period as string || new Date().toISOString().slice(0, 7);
    const [year, month] = period.split('-').map(Number);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Find subscriptions that were upgraded during the period
    // This is a simplified version - in production, you'd track tier changes
    const subscriptions = await prisma.subscription.findMany({
      where: {
        updatedAt: { gte: startDate, lte: endDate },
        status: 'active',
      },
    });

    // Calculate expansion revenue
    // In production, this would compare old tier vs new tier
    let expansionRevenue = 0;
    const upgrades = subscriptions.filter((sub) => sub.tier === 'growth' || sub.tier === 'enterprise');
    
    upgrades.forEach((sub) => {
      const tier = sub.tier as keyof typeof PRICING_TIERS;
      const currentPrice = PRICING_TIERS[tier]?.price || 0;
      const starterPrice = PRICING_TIERS.starter.price;
      if (currentPrice > starterPrice) {
        expansionRevenue += currentPrice - starterPrice;
      }
    });

    res.json({
      period,
      expansionRevenue: parseFloat(expansionRevenue.toFixed(2)),
      upgradeCount: upgrades.length,
    });
  } catch (error: any) {
    console.error('Error calculating expansion revenue:', error);
    res.status(500).json({ error: error.message || 'Failed to calculate expansion revenue' });
  }
}

// Get retention curve
export async function getRetentionCurve(req: Request, res: Response) {
  try {
    const months = parseInt(req.query.months as string) || 12;

    const subscriptions = await prisma.subscription.findMany({
      orderBy: { createdAt: 'asc' },
    });

    // Group by month
    const monthlyData: Record<string, { total: number; active: number }> = {};

    subscriptions.forEach((sub) => {
      const month = sub.createdAt.toISOString().slice(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { total: 0, active: 0 };
      }
      monthlyData[month].total += 1;
      if (sub.status === 'active') {
        monthlyData[month].active += 1;
      }
    });

    const retentionCurve = Object.entries(monthlyData)
      .slice(-months)
      .map(([month, data]) => ({
        month,
        retentionRate: data.total > 0 ? (data.active / data.total) * 100 : 0,
        totalCustomers: data.total,
        activeCustomers: data.active,
      }));

    res.json({ retentionCurve });
  } catch (error: any) {
    console.error('Error getting retention curve:', error);
    res.status(500).json({ error: error.message || 'Failed to get retention curve' });
  }
}

// Update revenue metrics (should be run as a cron job)
export async function updateRevenueMetrics() {
  try {
    const period = new Date().toISOString().slice(0, 7);

    const activeSubscriptions = await prisma.subscription.findMany({
      where: { status: { in: ['active', 'trialing'] } },
    });

    let mrr = 0;
    activeSubscriptions.forEach((sub) => {
      if (sub.status === 'active') {
        const tier = sub.tier as keyof typeof PRICING_TIERS;
        mrr += PRICING_TIERS[tier]?.price || 0;
      }
    });

    const totalSubscriptions = await prisma.subscription.count();
    const newSignups = await prisma.subscription.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    });

    const churnCount = await prisma.subscription.count({
      where: {
        status: 'cancelled',
        updatedAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    });

    const churnRate = totalSubscriptions > 0 ? (churnCount / totalSubscriptions) * 100 : 0;

    await prisma.revenueMetric.upsert({
      where: { period },
      update: {
        mrr,
        arr: mrr * 12,
        activeUsers: activeSubscriptions.length,
        newSignups,
        churnCount,
        churnRate,
      },
      create: {
        period,
        mrr,
        arr: mrr * 12,
        activeUsers: activeSubscriptions.length,
        newSignups,
        churnCount,
        churnRate,
      },
    });

    console.log(`Revenue metrics updated for ${period}`);
  } catch (error) {
    console.error('Error updating revenue metrics:', error);
  }
}
