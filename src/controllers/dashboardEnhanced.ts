import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { cacheService } from '../services/cacheService';
import { io } from '../index';

const prisma = new PrismaClient();

export const getDashboardData = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;

    const cacheKey = `dashboard:${companyId}:full`;
    const cached = await cacheService.getJson(cacheKey);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.json({ success: true, data: cached });
      return;
    }

    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const [inventory, suppliers, orders, kpis] = await Promise.all([
      prisma.inventory.findMany({ where: { companyId } }),
      prisma.supplier.findMany({ where: { companyId, status: 'ACTIVE' } }),
      prisma.order.findMany({ where: { companyId } }),
      prisma.kPI.findMany({ where: { companyId, period: currentPeriod } }),
    ]);

    const totalInventoryValue = inventory.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
    const healthyItems = inventory.filter(item => item.stockLevel === 'HEALTHY').length;
    const lowItems = inventory.filter(item => item.stockLevel === 'LOW').length;
    const outOfStockItems = inventory.filter(item => item.stockLevel === 'OUT_OF_STOCK').length;

    const onTimeOrders = orders.filter(o => o.status === 'ON_TIME').length;
    const delayedOrders = orders.filter(o => o.status === 'DELAYED').length;
    const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
    const completedOrders = orders.filter(o => o.status === 'COMPLETED').length;

    const avgOTIF = kpis.find(k => k.name === 'OTIF')?.value || 95;
    const avgDIO = kpis.find(k => k.name === 'DIO')?.value || 45;
    const avgFillRate = kpis.find(k => k.name === 'FILL_RATE')?.value || 98;
    const avgTurnover = kpis.find(k => k.name === 'TURNOVER')?.value || 6;

    const dashboardData = {
      summary: {
        totalInventoryValue: Math.round(totalInventoryValue),
        totalSKUs: inventory.length,
        totalSuppliers: suppliers.length,
        totalOrders: orders.length,
        onTimeRate: orders.length > 0 ? ((onTimeOrders / orders.length) * 100).toFixed(1) : '0.0',
        stockHealth: inventory.length > 0 ? ((healthyItems / inventory.length) * 100).toFixed(1) : '100.0',
      },
      kpis: [
        { name: 'OTIF', value: avgOTIF, target: 95, status: avgOTIF >= 95 ? 'ON_TRACK' : 'AT_RISK' },
        { name: 'DIO', value: avgDIO, target: 50, status: avgDIO <= 50 ? 'ON_TRACK' : 'AT_RISK' },
        { name: 'Fill Rate', value: avgFillRate, target: 98, status: avgFillRate >= 98 ? 'ON_TRACK' : 'AT_RISK' },
        { name: 'Turnover', value: avgTurnover, target: 5, status: avgTurnover >= 5 ? 'EXCELLENT' : 'AT_RISK' },
      ],
      inventoryHealth: {
        healthy: healthyItems,
        low: lowItems,
        outOfStock: outOfStockItems,
        percentage: inventory.length > 0 ? ((healthyItems / inventory.length) * 100).toFixed(1) : '100.0',
      },
      orderStatus: {
        pending: pendingOrders,
        onTime: onTimeOrders,
        delayed: delayedOrders,
        completed: completedOrders,
        total: orders.length,
      },
      topSuppliers: suppliers
        .sort((a, b) => b.performanceScore - a.performanceScore)
        .slice(0, 5)
        .map(s => ({
          id: s.id,
          name: s.name,
          score: Math.round(s.performanceScore),
          onTimeRate: s.onTimeRate,
        })),
      lowStockItems: inventory
        .filter(i => i.stockLevel === 'LOW' || i.stockLevel === 'OUT_OF_STOCK')
        .sort((a, b) => a.quantity - b.quantity)
        .slice(0, 10)
        .map(i => ({
          sku: i.sku,
          name: i.name,
          quantity: i.quantity,
          reorderPoint: i.reorderPoint,
          unitCost: i.unitCost,
        })),
      delayedOrders: orders
        .filter(o => o.status === 'DELAYED')
        .sort((a, b) => b.daysOverdue - a.daysOverdue)
        .slice(0, 10)
        .map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          supplier: o.supplierId,
          daysOverdue: o.daysOverdue,
          eta: o.eta,
        })),
    };

    await cacheService.setJson(cacheKey, dashboardData, 600);

    res.setHeader('X-Cache', 'MISS');
    res.json({ success: true, data: dashboardData });
  } catch (error) {
    next(error);
  }
};

export const getChartData = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const { chartName, period = '12' } = req.query;

    const cacheKey = `dashboard:${companyId}:chart:${chartName}:${period}`;
    const cached = await cacheService.getJson(cacheKey);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.json({ success: true, data: cached });
      return;
    }

    let chartData: any = {};

    switch (chartName) {
      case 'inventory-health':
        const inventory = await prisma.inventory.findMany({ where: { companyId } });
        chartData = {
          healthy: inventory.filter(i => i.stockLevel === 'HEALTHY').length,
          low: inventory.filter(i => i.stockLevel === 'LOW').length,
          outOfStock: inventory.filter(i => i.stockLevel === 'OUT_OF_STOCK').length,
        };
        break;

      case 'stock-value-trend':
        const now = new Date();
        const trendData = [];
        for (let i = parseInt(period as string); i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          trendData.push({
            date: date.toISOString().split('T')[0],
            value: Math.random() * 500000 + 100000,
          });
        }
        chartData = trendData;
        break;

      case 'order-status':
        const orders = await prisma.order.findMany({ where: { companyId } });
        chartData = {
          pending: orders.filter(o => o.status === 'PENDING').length,
          onTime: orders.filter(o => o.status === 'ON_TIME').length,
          delayed: orders.filter(o => o.status === 'DELAYED').length,
          completed: orders.filter(o => o.status === 'COMPLETED').length,
        };
        break;

      case 'otif-trend':
        const kpis = await prisma.kPI.findMany({
          where: {
            companyId,
            name: 'OTIF',
          },
          orderBy: { period: 'desc' },
          take: parseInt(period as string),
        });
        chartData = kpis.map(k => ({
          period: k.period,
          value: k.value,
          target: k.target,
        })).reverse();
        break;

      case 'supplier-performance':
        const suppliers = await prisma.supplier.findMany({
          where: { companyId, status: 'ACTIVE' },
          orderBy: { performanceScore: 'desc' },
          take: 5,
        });
        chartData = suppliers.map(s => ({
          name: s.name,
          score: Math.round(s.performanceScore),
        }));
        break;

      default:
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_CHART', message: 'Invalid chart name' },
        });
        return;
    }

    await cacheService.setJson(cacheKey, chartData, 600);

    res.setHeader('X-Cache', 'MISS');
    res.json({ success: true, data: chartData });
  } catch (error) {
    next(error);
  }
};

export const emitDashboardUpdate = async (companyId: string, eventType: string, data: any): Promise<void> => {
  try {
    io.to(`dashboard:${companyId}`).emit(eventType, data);
  } catch (error) {
    console.error('Error emitting dashboard update:', error);
  }
};

export const refreshDashboard = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;

    await cacheService.invalidateCompanyCache(companyId);

    await emitDashboardUpdate(companyId, 'dashboard:refresh', {
      companyId,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Dashboard cache invalidated and refresh triggered',
    });
  } catch (error) {
    next(error);
  }
};
