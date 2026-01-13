import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { cacheService } from '../services/cacheService';

const prisma = new PrismaClient();

export const getSupplierPerformance = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;

    const cacheKey = `supplier:${companyId}:${id}:performance`;
    const cached = await cacheService.getJson(cacheKey);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.json({ success: true, data: cached });
      return;
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        metrics: { orderBy: { period: 'desc' }, take: 12 },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        purchaseOrders: {
          include: { lineItems: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!supplier) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Supplier not found',
        },
      });
      return;
    }

    const metricsTrend = supplier.metrics.map(m => ({
      period: m.period,
      onTimeDeliveryRate: m.onTimeDeliveryRate,
      qualityScore: m.qualityScore,
      costTrend: m.costTrend,
      leadTimeVariance: m.leadTimeVariance,
    }));

    const recentMetrics = supplier.metrics[0];
    const avgOnTimeRate = supplier.metrics.length > 0
      ? supplier.metrics.reduce((sum, m) => sum + m.onTimeDeliveryRate, 0) / supplier.metrics.length
      : supplier.onTimeRate;

    const avgQualityScore = supplier.metrics.length > 0
      ? supplier.metrics.reduce((sum, m) => sum + m.qualityScore, 0) / supplier.metrics.length
      : supplier.qualityRate;

    const avgLeadTime = supplier.metrics.length > 0
      ? supplier.metrics.reduce((sum, m) => sum + m.leadTimeVariance, 0) / supplier.metrics.length
      : supplier.leadTime;

    const totalOrders = supplier.orders.length;
    const onTimeOrders = supplier.orders.filter(o => o.status === 'ON_TIME').length;
    const delayedOrders = supplier.orders.filter(o => o.status === 'DELAYED').length;
    const onTimeRate = totalOrders > 0 ? (onTimeOrders / totalOrders) * 100 : 0;

    const performanceData = {
      id: supplier.id,
      name: supplier.name,
      contactName: supplier.contactName,
      contactEmail: supplier.contactEmail,
      onTimeRate: onTimeRate,
      qualityRate: supplier.qualityRate,
      leadTime: supplier.leadTime,
      performanceScore: supplier.performanceScore,
      metrics: {
        avgOnTimeRate,
        avgQualityScore,
        avgLeadTime,
        costTrend: recentMetrics?.costTrend || 0,
        leadTimeVariance: recentMetrics?.leadTimeVariance || 0,
      },
      metricsTrend,
      orders: {
        total: totalOrders,
        onTime: onTimeOrders,
        delayed: delayedOrders,
        pending: supplier.orders.filter(o => o.status === 'PENDING').length,
        completed: supplier.orders.filter(o => o.status === 'COMPLETED').length,
      },
      recentOrders: supplier.orders.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        eta: o.eta,
        daysOverdue: o.daysOverdue,
        totalAmount: o.totalAmount,
      })),
    };

    await cacheService.setJson(cacheKey, performanceData, 900);

    res.setHeader('X-Cache', 'MISS');
    res.json({ success: true, data: performanceData });
  } catch (error) {
    next(error);
  }
};

export const compareSuppliers = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Supplier IDs array is required',
        },
      });
      return;
    }

    const suppliers = await prisma.supplier.findMany({
      where: { id: { in: ids }, companyId },
      include: {
        metrics: { orderBy: { period: 'desc' }, take: 6 },
        orders: {
          where: { createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
        },
      },
    });

    const comparison = suppliers.map(supplier => {
      const recentMetrics = supplier.metrics[0];
      const avgOnTimeRate = supplier.metrics.length > 0
        ? supplier.metrics.reduce((sum, m) => sum + m.onTimeDeliveryRate, 0) / supplier.metrics.length
        : supplier.onTimeRate;

      const avgQualityScore = supplier.metrics.length > 0
        ? supplier.metrics.reduce((sum, m) => sum + m.qualityScore, 0) / supplier.metrics.length
        : supplier.qualityRate;

      const avgLeadTime = supplier.metrics.length > 0
        ? supplier.metrics.reduce((sum, m) => sum + m.leadTimeVariance, 0) / supplier.metrics.length
        : supplier.leadTime;

      return {
        id: supplier.id,
        name: supplier.name,
        performanceScore: supplier.performanceScore,
        metrics: {
          onTimeDeliveryRate: avgOnTimeRate,
          qualityScore: avgQualityScore,
          leadTime: avgLeadTime,
          costTrend: recentMetrics?.costTrend || 0,
          leadTimeVariance: recentMetrics?.leadTimeVariance || 0,
        },
        orders: {
          total: supplier.orders.length,
          onTime: supplier.orders.filter(o => o.status === 'ON_TIME').length,
          delayed: supplier.orders.filter(o => o.status === 'DELAYED').length,
        },
        paymentTerms: supplier.paymentTerms,
        status: supplier.status,
      };
    });

    res.json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    next(error);
  }
};

export const getSupplierRankings = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const { sortBy = 'performanceScore', limit = 20 } = req.query;

    const cacheKey = `suppliers:${companyId}:rankings:${sortBy}`;
    const cached = await cacheService.getJson(cacheKey);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.json({ success: true, data: cached });
      return;
    }

    const suppliers = await prisma.supplier.findMany({
      where: { companyId, status: 'ACTIVE' },
      include: {
        metrics: { orderBy: { period: 'desc' }, take: 6 },
      },
      orderBy:
        sortBy === 'performanceScore' ? { performanceScore: 'desc' }
          : sortBy === 'onTimeRate' ? { onTimeRate: 'desc' }
            : sortBy === 'qualityRate' ? { qualityRate: 'desc' }
              : sortBy === 'leadTime' ? { leadTime: 'asc' }
                : { performanceScore: 'desc' },
      take: parseInt(limit as string),
    });

    const rankings = suppliers.map((supplier, index) => {
      const recentMetrics = supplier.metrics[0];
      return {
        rank: index + 1,
        id: supplier.id,
        name: supplier.name,
        performanceScore: supplier.performanceScore,
        onTimeRate: supplier.onTimeRate,
        qualityRate: supplier.qualityRate,
        leadTime: supplier.leadTime,
        costTrend: recentMetrics?.costTrend || 0,
        leadTimeVariance: recentMetrics?.leadTimeVariance || 0,
      };
    });

    await cacheService.setJson(cacheKey, rankings, 900);

    res.setHeader('X-Cache', 'MISS');
    res.json({ success: true, data: rankings });
  } catch (error) {
    next(error);
  }
};

export const updateSupplierMetrics = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;
    const { period, onTimeDeliveryRate, qualityScore, costTrend, leadTimeVariance } = req.body;

    const supplier = await prisma.supplier.findFirst({
      where: { id, companyId },
    });

    if (!supplier) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Supplier not found',
        },
      });
      return;
    }

    const now = new Date();
    const currentPeriod = period || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const metrics = await prisma.supplierMetric.upsert({
      where: {
        supplierId_period: {
          supplierId: id,
          period: currentPeriod,
        },
      },
      update: {
        onTimeDeliveryRate: onTimeDeliveryRate !== undefined ? onTimeDeliveryRate : undefined,
        qualityScore: qualityScore !== undefined ? qualityScore : undefined,
        costTrend: costTrend !== undefined ? costTrend : undefined,
        leadTimeVariance: leadTimeVariance !== undefined ? leadTimeVariance : undefined,
      },
      create: {
        supplierId: id,
        companyId,
        onTimeDeliveryRate: onTimeDeliveryRate || supplier.onTimeRate,
        qualityScore: qualityScore || supplier.qualityRate,
        costTrend: costTrend || 0,
        leadTimeVariance: leadTimeVariance || 0,
        period: currentPeriod,
      },
    });

    await cacheService.invalidateCompanyCache(companyId);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    next(error);
  }
};

export const getABCAnalysis = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;

    const cacheKey = `inventory:${companyId}:abc-analysis`;
    const cached = await cacheService.getJson(cacheKey);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.json({ success: true, data: cached });
      return;
    }

    const inventory = await prisma.inventory.findMany({
      where: { companyId },
      include: { supplier: true },
    });

    const totalValue = inventory.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

    const sortedByValue = [...inventory].sort((a, b) => (b.quantity * b.unitCost) - (a.quantity * a.unitCost));

    let cumulativeValue = 0;
    const analysis = sortedByValue.map((item) => {
      cumulativeValue += item.quantity * item.unitCost;
      const percentage = (cumulativeValue / totalValue) * 100;

      let abcClass = 'C';
      if (percentage <= 80) abcClass = 'A';
      else if (percentage <= 95) abcClass = 'B';

      return {
        sku: item.sku,
        name: item.name,
        value: item.quantity * item.unitCost,
        valuePercentage: ((item.quantity * item.unitCost) / totalValue) * 100,
        cumulativePercentage: percentage,
        abcClass,
        quantity: item.quantity,
        supplier: item.supplier?.name,
      };
    });

    const summary = {
      totalItems: inventory.length,
      totalValue,
      aClass: { count: analysis.filter(a => a.abcClass === 'A').length, value: analysis.filter(a => a.abcClass === 'A').reduce((sum, a) => sum + a.value, 0) },
      bClass: { count: analysis.filter(a => a.abcClass === 'B').length, value: analysis.filter(a => a.abcClass === 'B').reduce((sum, a) => sum + a.value, 0) },
      cClass: { count: analysis.filter(a => a.abcClass === 'C').length, value: analysis.filter(a => a.abcClass === 'C').reduce((sum, a) => sum + a.value, 0) },
    };

    await cacheService.setJson(cacheKey, { analysis, summary }, 600);

    res.setHeader('X-Cache', 'MISS');
    res.json({
      success: true,
      data: { analysis, summary },
    });
  } catch (error) {
    next(error);
  }
};
